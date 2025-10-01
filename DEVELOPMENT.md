# Development Guide

## Code Quality Tools

### ESLint Configuration

The project uses ESLint with TypeScript support. Key rules:

- `@typescript-eslint/no-unused-vars`: **warn** - Catches unused variables (can use `_` prefix to ignore)
- `@typescript-eslint/no-explicit-any`: **warn** - Discourages use of `any` type
- `no-console`: **warn** - Allows only `console.warn` and `console.error`

### Recommended npm Scripts

Since `package.json` is managed by Lovable, you can run these commands manually or add them locally:

```json
{
  "scripts": {
    "lint": "eslint src --max-warnings=0",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

### Running Linting

**Manual commands (without package.json scripts):**

```bash
# Lint all files in src
npx eslint src --max-warnings=0

# Auto-fix linting issues
npx eslint src --fix

# Format with Prettier
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"

# Check formatting
npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"
```

### Import Aliases

The project uses TypeScript path aliases:

- `@/*` → `src/*`

Example:
```typescript
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
```

Configuration is in `tsconfig.json`:
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

## Prettier Configuration

If you want to add Prettier, install it:

```bash
npm install --save-dev prettier
```

Then create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

And `.prettierignore`:

```
dist
node_modules
*.min.js
*.min.css
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

Update `.husky/pre-commit`:
```bash
npx lint-staged
```
