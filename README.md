# @encircle/create-shopify-theme

Scaffold a new Shopify Dawn or Horizon theme project with Encircle's standard tooling preconfigured:

- Latest Dawn or Horizon theme (cloned fresh from Shopify on every run)
- Tailwind CSS v4
- Prettier + `@shopify/prettier-plugin-liquid`
- ESLint with Encircle's rule set (tuned per theme — Dawn's global-function API vs Horizon's native ES modules)
- Husky + lint-staged pre-commit hooks
- Shopify Theme Check
- Standard `.gitignore`, `.shopifyignore`, `CLAUDE.md`

## Usage

```bash
npx shopify-theme-setup my-store              # prompts for theme, defaults to Dawn
npx shopify-theme-setup my-store --theme=horizon
cd my-store
npm run build
shopify theme dev --store=my-store.myshopify.com
```

## Requirements

- Node.js 18+
- Git
- Shopify CLI (`npm install -g @shopify/cli`)

## What it does

1. Clones the latest Dawn or Horizon theme (`--theme=dawn|horizon`, prompts if omitted)
2. Strips the theme's git history
3. Copies Encircle's standard config files on top (from `templates/dawn/` or `templates/horizon/`)
4. Sets the project name in `package.json`
5. Runs `npm install`
6. Initializes a fresh git repo
7. Sets up the husky pre-commit hook

## Updating

When Encircle's standards change (new ESLint rule, updated Theme Check config, etc.):

```bash
# In this repo
# 1. Edit the relevant file under templates/dawn/ and/or templates/horizon/
# 2. Bump version and publish
npm version patch
npm publish --access public
```

All future `npm create` calls will pick up the new version automatically.

## License

MIT
