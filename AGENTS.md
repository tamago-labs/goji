# Goji

Two independent stacks in one repo:

- **Root** (`/`) — Bare CLI app with pear-runtime for OTA updates. Written in CommonJS (app.js) and ESM (bin.mjs). Uses the Bare runtime, not Node.js.
- **`frontend/`** — Next.js 16 + React 19 + Tailwind v4 app (TypeScript). Completely separate `package.json` and `node_modules`.

## Commands

### Root (Bare CLI)

```
npm install          # install deps
npm start            # bare bin.mjs --no-updates (dev mode, updates off by default)
npm test             # brittle-bare test/index.js
npm run lint         # prettier --check && lunte
npm run format       # prettier . --write
```

To test OTA update flow: `npm start -- --updates`

### Frontend (Next.js)

```
cd frontend
npm install
npm run dev          # next dev (port 3000)
npm run build        # next build
npm run lint         # eslint
```

## Gotchas

- **`bare` vs `node`**: Root code runs on Bare, not Node. `bin.mjs` detects dev mode via `path.basename(Bare.argv[0]) === 'bare'`. Don't `node bin.mjs` — use `npm start`.
- **Upgrade link required**: `package.json` `upgrade` field must be a valid `pear://` link. Placeholder `pear://<YOUR_KEY_HERE>` causes `INVALID_URL` crash. Fix with `pear touch`, then paste the link.
- **Prettier config**: `.prettierrc` points to `prettier-config-holepunch` (shared config). Don't override with custom rules unless intended.
- **Test runner**: Tests use `brittle-bare`, not `jest` or `node:test`. Single test file at `test/index.js`.
- **`lunte`**: Used as the linter for root Bare code. Installed as a devDependency.
- **Platform builds**: `npm run make` auto-detects host OS/arch. Supports darwin/linux/win32 x arm64/x64. Outputs to `out/<platform>-<arch>/`.
- **`frontend/AGENTS.md`**: Contains a Next.js-specific warning — Next.js 16 has breaking changes from training data. Read `node_modules/next/dist/docs/` before modifying frontend code.
- **No monorepo tooling**: These are two separate npm projects, not a workspace. Run `npm install` independently in each directory.
