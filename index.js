#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Parse args ────────────────────────────────────────────────────────────
const projectName = process.argv[2];

if (!projectName || projectName === '--help' || projectName === '-h') {
  console.log(`
Usage: npm create @encircle/shopify-theme <project-name>

Example:
  npm create @encircle/shopify-theme acme-store

This will:
  1. Clone the latest Dawn theme from Shopify
  2. Apply Encircle's standard tooling (Tailwind, Prettier, ESLint, Husky, Theme Check)
  3. Install dependencies
  4. Initialize git and husky
`);
  process.exit(projectName ? 0 : 1);
}

const targetDir = path.resolve(process.cwd(), projectName);

if (fs.existsSync(targetDir)) {
  console.error(`❌ Directory "${projectName}" already exists. Choose a different name or remove it first.`);
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const step = (msg) => console.log(`\n→ ${msg}`);

// ── 1. Clone latest Dawn ──────────────────────────────────────────────────
step('Cloning latest Dawn theme from Shopify...');
run(`git clone --depth 1 https://github.com/Shopify/dawn.git "${projectName}"`);

// Remove Dawn's git history — we want a fresh repo
fs.rmSync(path.join(targetDir, '.git'), { recursive: true, force: true });

// ── 2. Copy template files over Dawn ──────────────────────────────────────
step('Applying Encircle standard configs...');
const templatesDir = path.join(__dirname, 'templates');

// Recursive copy with overwrite. Renames `gitignore` -> `.gitignore`
// (npm strips leading dots from .gitignore when publishing, so we
//  store it dotless in templates and rename on copy.)
function copyTemplates(src, dest) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    let destName = entry.name;

    // Restore dotfiles that npm would have stripped
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

// ── 3. Inject application.css into layout/theme.liquid ────────────────────
step('Injecting application.css into layout/theme.liquid...');
const themeLiquidPath = path.join(targetDir, 'layout', 'theme.liquid');
const stylesheetTag = "    {{ 'application.css' | asset_url | stylesheet_tag }}";

if (fs.existsSync(themeLiquidPath)) {
  let themeLiquid = fs.readFileSync(themeLiquidPath, 'utf8');

  // Idempotent — only inject if not already present
  if (!themeLiquid.includes("'application.css'")) {
    themeLiquid = themeLiquid.replace('</head>', `${stylesheetTag}\n  </head>`);
    fs.writeFileSync(themeLiquidPath, themeLiquid);
  } else {
    console.log('  (already present — skipped)');
  }
} else {
  console.warn('⚠️  layout/theme.liquid not found — skipping stylesheet injection.');
}

// ── 3. Customize package.json with the project name ───────────────────────
const pkgPath = path.join(targetDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// ── 4. Install dependencies ───────────────────────────────────────────────
step('Installing dependencies (this takes a minute)...');
run('npm install', { cwd: targetDir });

// ── 5. Initialize git and husky ───────────────────────────────────────────
step('Initializing git repository...');
run('git init', { cwd: targetDir });

step('Initializing husky hooks...');
// husky init creates .husky/pre-commit with a default — we then overwrite
// it with our custom hook from the template.
run('npx husky init', { cwd: targetDir });
const huskyHook = path.join(targetDir, '.husky', 'pre-commit');
fs.writeFileSync(huskyHook, 'npx lint-staged\nnpx shopify theme check\n');
fs.chmodSync(huskyHook, 0o755);

// ── Done ──────────────────────────────────────────────────────────────────
console.log(`
✅ Project "${projectName}" ready.

Next steps:
  cd ${projectName}
  npm run build              # start Tailwind watcher (keep running)
  shopify theme dev --store=your-store.myshopify.com

  git add . && git commit -m "chore: initial commit"
`);
