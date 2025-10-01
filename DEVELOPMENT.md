# Development Guide

## Code Quality Setup

### Step 1: Install Prettier (Required)

Since Lovable doesn't manage `package.json` automatically, you need to install Prettier manually:

```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

### Step 2: Add Scripts to package.json

Manually add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --max-warnings=0",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### Step 3: Create Prettier Configuration

Create `.prettierrc` in the project root:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}
```

Create `.prettierignore`:

```
dist
node_modules
*.min.js
*.min.css
.lovable
public/data
```

## ESLint Configuration

Current ESLint rules (configured in `eslint.config.js`):

- ✅ `@typescript-eslint/no-unused-vars`: **warn** - Catches unused variables
  - Variables/args starting with `_` are ignored
- ⚠️ `@typescript-eslint/no-explicit-any`: **warn** - Discourages `any` type
- ⚠️ `no-console`: **warn** - Only allows `console.warn` and `console.error`

## Running Quality Checks

Once you've completed the setup above:

```bash
# Run linter (fail on warnings)
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format all files with Prettier
npm run format

# Check if files are formatted
npm run format:check
```

**Manual commands (if scripts aren't added):**

```bash
npx eslint src --max-warnings=0
npx eslint src --fix
npx prettier --write .
```

## Import Aliases

The project uses TypeScript path aliases configured in `tsconfig.json`:

- `@/*` → `src/*`

**Examples:**
```typescript
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgProvider";
import { getActiveTenantId } from "@/lib/utils";
```

## Pre-commit Hooks (Optional)

For automatic linting/formatting before commits:

```bash
npm install --save-dev husky lint-staged
npx husky init
```

Add to `package.json`:
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "src/**/*.{json,css,md}": ["prettier --write"]
  }
}
```

Create `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

## VS Code Configuration (Recommended)

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

Install recommended extensions:
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)

## Troubleshooting

### "Cannot find module '@/...'"

Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### ESLint/Prettier Conflicts

The project uses `eslint-config-prettier` to disable conflicting ESLint rules. If you see formatting issues, run:

```bash
npm run lint:fix && npm run format
```
