# Goji

Visual payment flows for DAOs and teams. Two independent stacks in one repo:

- **Root** (`/`) — Node.js CLI with P2P rooms (Autobase + Hyperswarm + BlindPairing). Express HTTP API + WebSocket for frontend communication.
- **`frontend/`** — Next.js 16 + React 19 + Tailwind v4 + RainbowKit app (TypeScript). Completely separate `package.json` and `node_modules`.

## Commands

### Root (Terminal CLI)

```
npm install              # install deps
npm start                # host mode (port 3001)
npm start -- --join <code>  # guest mode
npm run start:guest      # guest shortcut (port 3002)
npm run build:specs      # rebuild hyperschema specs
npm run clean:storage    # wipe .goji-storage and tmp-guest
npm run lint             # prettier --check && lunte
npm run format           # prettier . --write
```

### Frontend (Next.js)

```
cd frontend
npm install
npm run dev              # next dev --webpack (port 3000)
npm run build            # next build --webpack
npm run lint             # eslint
```

## Architecture

### Root (Terminal)

- `src/index.js` — Main entry: Express server, WebSocket, P2P room
- `schema.js` — Hyperschema + HyperDB collections (boards, cards, connections, chat, invites, identity)
- `spec/` — Generated schema/dispatch/db specs
- `scripts/clean-storage.js` — Wipe storage directories
- Keet identity key integration for portable P2P identities

### Frontend

- `app/components/landing/` — Landing page (Nav, Hero, UseCases, CardCanvas, HowItWorks)
- `app/components/start/` — Start page (dashboard with boards + templates)
- `app/components/flow/` — Canvas/flow builder (Canvas, CanvasCard, CanvasLines, FlowBuilder, Toolbar, AddCardPopover)
- `app/components/common/` — Shared components (Logo)
- `app/providers.tsx` — RainbowKit + wagmi + React Query providers
- `lib/wagmi.ts` — Wagmi config with Arc Testnet

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/health | Server status, peer info, name |
| GET/POST | /api/boards | List/create boards |
| PUT/DELETE | /api/boards/:id | Rename/delete board |
| GET/POST/PUT/DELETE | /api/cards | Card CRUD |
| GET/POST/DELETE | /api/connections | Connection CRUD |
| GET/POST | /api/chat | Chat messages |
| PUT | /api/username | Update display name |
| WebSocket | ws://localhost:3001 | Real-time sync |

## Gotchas

- **`--webpack` flag**: Frontend scripts use `--webpack` because RainbowKit has Turbopack compatibility issues.
- **Lockfile warning**: Next.js warns about multiple lockfiles (root + frontend). This is cosmetic — ignore it.
- **P2P requires UDP**: Hyperswarm uses UDP for peer discovery. Cloud servers need UDP open.
- **Keet identity**: First run prompts for identity setup (generate/import mnemonic). Saved to `identity.json` in storage folder.
- **No monorepo tooling**: Two separate npm projects. Run `npm install` independently in each directory.
- **`frontend/AGENTS.md`**: Next.js 16 has breaking changes from training data. Read `node_modules/next/dist/docs/` before modifying frontend code.
