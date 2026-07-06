#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stdin as input, stdout as output } from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getProjectName() {
  let name = process.argv[2];

  if (name === '--help' || name === '-h') {
    console.log(`
Usage:
  npx shopify-theme-setup                → prompts for project name
  npx shopify-theme-setup <project-name> → uses the name you passed

Example:
  npx shopify-theme-setup acme-store
`);
    process.exit(0);
  }

  if (!name) {
    const rl = readline.createInterface({ input, output });
    while (!name) {
      const answer = (await rl.question('Project name: ')).trim();
      if (!answer) {
        console.log('  Project name is required.');
        continue;
      }
      if (!/^[a-z0-9][a-z0-9-_]*$/i.test(answer)) {
        console.log('  Use only letters, numbers, hyphens, or underscores. No spaces.');
        continue;
      }
      name = answer;
    }
    rl.close();
  }

  return name;
}

const projectName = await getProjectName();
const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
  console.error(`\n❌ Directory "${projectName}" already exists.`);
  process.exit(1);
}

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const step = (msg) => console.log(`\n→ ${msg}`);

step('Cloning latest Dawn theme from Shopify...');
run(`git clone --depth 1 https://github.com/Shopify/dawn.git "${projectName}"`);
fs.rmSync(path.join(targetDir, '.git'), { recursive: true, force: true });

step('Applying standard configs...');
const templatesDir = path.join(__dirname, 'templates');

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
const rlBuild = readline.createInterface({ input, output });
const buildAnswer = (await rlBuild.question('Run `npm run build` now? (Y/n) ')).trim().toLowerCase();
rlBuild.close();

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

const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';
const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';

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
