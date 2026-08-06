#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stdin as input, stdout as output } from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const THEMES = {
  dawn: { repo: 'https://github.com/Shopify/dawn.git', label: 'Dawn' },
  horizon: { repo: 'https://github.com/Shopify/horizon.git', label: 'Horizon' },
};

const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';
const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';

// A plain rl.question() drops any line that arrives while no question is
// pending — fatal when piped/scripted input delivers multiple answers in one
// burst. Queue every 'line' event so no answer is ever lost, regardless of
// timing relative to when it's asked for.
const rl = readline.createInterface({ input, output });
const lineQueue = [];
let pendingResolve = null;
rl.on('line', (line) => {
  if (pendingResolve) {
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve(line);
  } else {
    lineQueue.push(line);
  }
});

function ask(prompt) {
  output.write(prompt);
  if (lineQueue.length) return Promise.resolve(lineQueue.shift());
  return new Promise((resolve) => {
    pendingResolve = resolve;
  });
}

// Arrow-key radio selector. Requires a real TTY — callers must fall back to
// a text prompt when input isn't interactive (piped/scripted input).
function selectTheme(themes, defaultKey) {
  const keys = Object.keys(themes);
  let index = Math.max(0, keys.indexOf(defaultKey));

  const render = (first) => {
    if (!first) output.write(`\x1b[${keys.length}A`);
    for (const key of keys) {
      const selected = key === keys[index];
      const marker = selected ? `${CYAN}❯${RESET}` : ' ';
      const label = selected ? `${BOLD}${themes[key].label}${RESET}` : themes[key].label;
      output.write(`\x1b[2K\r  ${marker} ${label}\n`);
    }
  };

  return new Promise((resolve) => {
    output.write(`Theme ${DIM}(Use arrow keys, Enter to select)${RESET}\n`);
    render(true);

    rl.pause();
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');

    const cleanup = () => {
      input.removeListener('data', onData);
      input.setRawMode(false);
      rl.resume();
    };

    const onData = (chunk) => {
      if (chunk === '\x03') {
        cleanup();
        process.exit(130);
      } else if (chunk === '\r' || chunk === '\n') {
        cleanup();
        resolve(keys[index]);
      } else if (chunk === '\x1b[A' || chunk === 'k') {
        index = (index - 1 + keys.length) % keys.length;
        render(false);
      } else if (chunk === '\x1b[B' || chunk === 'j') {
        index = (index + 1) % keys.length;
        render(false);
      }
    };

    input.on('data', onData);
  });
}

function getThemeFlag() {
  const flag = process.argv.find((arg) => arg.startsWith('--theme='));
  if (!flag) return null;
  const value = flag.split('=')[1]?.trim().toLowerCase();
  if (!THEMES[value]) {
    console.error(`\n❌ Unknown theme "${value}". Choose one of: ${Object.keys(THEMES).join(', ')}`);
    process.exit(1);
  }
  return value;
}

async function getTheme() {
  const flagged = getThemeFlag();
  if (flagged) return flagged;

  if (input.isTTY) return selectTheme(THEMES, 'dawn');

  let theme;
  while (!theme) {
    const answer = (await ask(`Theme (${Object.keys(THEMES).join('/')}) [dawn]: `)).trim().toLowerCase();
    const choice = answer || 'dawn';
    if (!THEMES[choice]) {
      console.log(`  Choose one of: ${Object.keys(THEMES).join(', ')}`);
      continue;
    }
    theme = choice;
  }
  return theme;
}

async function getProjectName() {
  let name = process.argv[2]?.startsWith('--') ? undefined : process.argv[2];

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Usage:
  npx shopify-theme-setup                              → prompts for project name and theme
  npx shopify-theme-setup <project-name>                → uses the name you passed
  npx shopify-theme-setup <project-name> --theme=horizon → scaffolds the Horizon theme instead of Dawn

Example:
  npx shopify-theme-setup acme-store --theme=dawn
`);
    process.exit(0);
  }

  const NAME_PATTERN = /^[a-z0-9][a-z0-9-_]*$/i;

  if (name) {
    if (!NAME_PATTERN.test(name)) {
      console.error('\n❌ Project name must use only letters, numbers, hyphens, or underscores. No spaces.');
      process.exit(1);
    }
    return name;
  }

  while (!name) {
    const answer = (await ask('Project name: ')).trim();
    if (!answer) {
      console.log('  Project name is required.');
      continue;
    }
    if (!NAME_PATTERN.test(answer)) {
      console.log('  Use only letters, numbers, hyphens, or underscores. No spaces.');
      continue;
    }
    name = answer;
  }

  return name;
}

const projectName = await getProjectName();
const theme = await getTheme();
const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
  console.error(`\n❌ Directory "${projectName}" already exists.`);
  process.exit(1);
}

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const step = (msg) => console.log(`\n→ ${msg}`);

step(`Cloning latest ${THEMES[theme].label} theme from Shopify...`);
run(`git clone --depth 1 ${THEMES[theme].repo} "${projectName}"`);
fs.rmSync(path.join(targetDir, '.git'), { recursive: true, force: true });

step('Applying standard configs...');
const templatesDir = path.join(__dirname, 'templates', theme);

function copyTemplates(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    let destName = entry.name;
    if (destName === 'gitignore') destName = '.gitignore';
    const destPath = path.join(dest, destName);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyTemplates(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
copyTemplates(templatesDir, targetDir);

step('Injecting application.css into layout/theme.liquid...');
const themeLiquidPath = path.join(targetDir, 'layout', 'theme.liquid');
const stylesheetTag = "    {{ 'application.css' | asset_url | stylesheet_tag }}";

if (fs.existsSync(themeLiquidPath)) {
  let themeLiquid = fs.readFileSync(themeLiquidPath, 'utf8');
  if (!themeLiquid.includes("'application.css'")) {
    themeLiquid = themeLiquid.replace('</head>', `${stylesheetTag}\n  </head>`);
    fs.writeFileSync(themeLiquidPath, themeLiquid);
  }
}

const pkgPath = path.join(targetDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

step('Installing dependencies (this takes a minute)...');
run('npm install', { cwd: targetDir });

step('Initializing git repository...');
run('git init', { cwd: targetDir });

step('Initializing husky hooks...');
run('npx husky init', { cwd: targetDir });
const huskyHook = path.join(targetDir, '.husky', 'pre-commit');
fs.writeFileSync(huskyHook, 'npx lint-staged\nnpx shopify theme check\n');
fs.chmodSync(huskyHook, 0o755);

step('Setup complete!');
const buildAnswer = (await ask('Run `npm run build` now? (Y/n) ')).trim().toLowerCase();
rl.close();

let buildRan = false;
if (buildAnswer === '' || buildAnswer === 'y' || buildAnswer === 'yes') {
  step('Running npm run build...');
  try {
    run('npm run build', { cwd: targetDir });
    buildRan = true;
  } catch (err) {
    console.log('  ⚠️  Build failed. Run it manually later: npm run build');
  }
}

const nextSteps = [`cd ${projectName}`];
if (!buildRan) nextSteps.push('npm run build');
nextSteps.push('shopify theme dev --store=your-store.myshopify.com');

const boxLines = [
  { raw: `  ✅  Project "${projectName}" is ready!`, type: 'title' },
  { raw: `` },
  { raw: `  Next steps:`, type: 'heading' },
  { raw: `` },
  ...nextSteps.map((s, i) => ({ raw: `  ${i + 1}  ${s}`, type: 'step' })),
  { raw: `` },
];

const W = Math.max(...boxLines.map(l => l.raw.length));

const styledContent = ({ raw, type }) => {
  const pad = ' '.repeat(W - raw.length);
  switch (type) {
    case 'title':
      return `${BOLD}${GREEN}${raw}${RESET}${pad}`;
    case 'heading':
      return `${BOLD}${raw}${RESET}${pad}`;
    case 'step':
      return raw.replace(/^(\s+)(\d+)(\s+)/, (_, a, n, c) => `${a}${DIM}${n}${RESET}${c}`) + pad;
    default:
      return raw + pad;
  }
};

console.log('');
console.log(`${CYAN}╭${'─'.repeat(W + 2)}╮${RESET}`);
for (const line of boxLines) {
  console.log(`${CYAN}│${RESET} ${styledContent(line)} ${CYAN}│${RESET}`);
}
console.log(`${CYAN}╰${'─'.repeat(W + 2)}╯${RESET}`);
