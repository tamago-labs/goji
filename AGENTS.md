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

- `src/index.js` — Main entry: Express server, WebSocket, P2P room, flow status endpoints
- `schema.js` — Hyperschema + HyperDB collections (boards, cards, connections, chat, invites, identity, wallets, flow-statuses)
- `spec/` — Generated schema/dispatch/db specs
- Keet identity key integration for portable P2P identities and wallet verification

### Frontend

- `app/components/landing/` — Landing page (Nav, Hero, UseCases, CardCanvas, HowItWorks)
- `app/components/start/` — Start page (Overview, Offers, Boards, Wallets, History tabs)
- `app/components/flow/` — Canvas/flow builder (Canvas, CanvasCard, CanvasLines, FlowBuilder, Toolbar, FlowOverlay, ConnectionDrawer, PreviewRoutesModal)
- `app/components/chat/` — Chat panel with Keet identity verification
- `app/providers/` — WalletProvider (Circle Unified Balance adapter)
- `app/providers.tsx` — RainbowKit + wagmi + React Query providers
- `lib/wagmi.ts` — Wagmi config with injected wallet (no MetaMask SDK)
- `lib/unified-balance.ts` — Circle Unified Balance API (deposit, spend, fetch)
- `lib/payslipTemplates.ts` — 3 default payslip templates (Standard Receipt, Invoice, Service Agreement)

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/health | Server status, peer info, name |
| GET/POST | /api/boards | List/create boards |
| PUT/DELETE | /api/boards/:id | Rename/delete board |
| GET/POST/PUT/DELETE | /api/cards | Card CRUD |
| GET/POST/PUT/DELETE | /api/connections | Connection CRUD + payment route data |
| GET/POST/PUT/DELETE | /api/flow-status | Flow execution status tracking |
| GET/POST | /api/chat | Chat messages |
| GET/POST/DELETE | /api/wallets | Wallet registration + verification |
| PUT | /api/username | Update display name |
| WebSocket | ws://localhost:3001 | Real-time sync |

## Canvas System

- **Wallet Card** — Represents a connected wallet, shows verified badge
- **Recipient Card** — Payment target with chain selector, shows verified/custom badge
- **Gate Card** — Multisig gate (M-of-N signatures required)
- **Connection Lines** — Click to open ConnectionDrawer for payment/document settings
- **Flow Overlay** — Shows route status, Sign button for your wallets

## Flow Execution

1. Click Start → Preview modal with all routes and real statuses
2. Click "Start Flow" → Canvas locks, overlay panel appears
3. Sign routes → Uses Circle Unified Balance spend
4. Status persists via P2P → Survives page navigation
5. Stop → Only clears pending routes, preserves settled

## Gotchas

- **`--webpack` flag**: Frontend scripts use `--webpack` because RainbowKit has Turbopack compatibility issues.
- **Lockfile warning**: Next.js warns about multiple lockfiles (root + frontend). This is cosmetic — ignore it.
- **P2P requires UDP**: Hyperswarm uses UDP for peer discovery. Cloud servers need UDP open.
- **Keet identity**: First run prompts for identity setup (generate/import mnemonic). Saved to `identity.json` in storage folder.
- **No monorepo tooling**: Two separate npm projects. Run `npm install` independently in each directory.
- **`frontend/AGENTS.md`**: Next.js 16 has breaking changes from training data. Read `node_modules/next/dist/docs/` before modifying frontend code.
