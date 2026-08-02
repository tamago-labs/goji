# Goji

P2P payment origination layer for verifiable payroll and invoicing. Two independent stacks in one repo:

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
- `schema.js` — Hyperschema + HyperDB collections (boards, cards, connections, chat, invites, identity, wallets, flow-statuses, templates, invoices)
- `spec/` — Generated schema/dispatch/db specs
- Keet identity key integration for portable P2P identities and wallet verification

### Contracts

- `contracts/src/GojiProof.sol` — Merkle root storage for document verification
- `contracts/src/ReceivableToken.sol` — ERC-20 for receivable assets (multiple proofs, configurable terms)
- `contracts/src/ReceivableFactory.sol` — Factory for creating receivable tokens (flat fee system)
- `contracts/src/PriceOracle.sol` — Custom + Pyth price oracle
- `contracts/script/` — Deploy scripts (1-DeployTokens, 2-DeployOracles, 3-DeployProof, 4-DeployReceivable)

### Frontend

- `app/components/landing/` — Landing page (Nav, Hero, UseCases, CardCanvas, HowItWorks, InvoiceFlow, SupportedChains, CTA)
- `app/components/start/` — Start page (Overview, Wallets, Payments, Invoices, Proof Explorer, Templates, Members, AI Assistant)
- `app/components/flow/` — Canvas/flow builder (Canvas, CanvasCard, CanvasLines, FlowBuilder, Toolbar, FlowOverlay, ConnectionDrawer, InvoiceDrawer, PreviewRoutesModal)
- `app/components/chat/` — Chat panel with Keet identity verification
- `app/providers/` — WalletProvider (Circle Unified Balance adapter)
- `app/providers.tsx` — RainbowKit + wagmi + React Query providers
- `lib/wagmi.ts` — Wagmi config with injected wallet (no MetaMask SDK)
- `lib/unified-balance.ts` — Circle Unified Balance API (deposit, spend, fetch, delegate)
- `lib/payslipTemplates.ts` — 3 default templates (Standard Receipt, Invoice, Service Agreement)
- `lib/gojiProof.ts` — GojiProof ABI for on-chain merkle root verification
- `lib/merkle.ts` — Merkle tree generation with viem + merkletreejs

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/health | Server status, peer info, role |
| GET/POST | /api/boards | List/create boards |
| PUT/DELETE | /api/boards/:id | Rename/delete board |
| GET/POST/PUT/DELETE | /api/cards | Card CRUD |
| GET/POST/PUT/DELETE | /api/connections | Connection CRUD |
| GET/POST/PUT/DELETE | /api/flow-status | Flow execution status |
| GET/POST | /api/chat | Chat messages |
| GET/POST/DELETE | /api/wallets | Wallet registration |
| GET/POST/PUT/DELETE | /api/templates | Invoice templates |
| GET/PUT/DELETE | /api/invoices | Invoice management |
| POST | /api/members/assign | Role assignment (employer only) |
| GET | /api/members | List members (employer only) |
| WebSocket | ws://localhost:3001 | Real-time sync |

## Canvas System

- **Wallet Card** — Company wallet (Arc settlement)
- **Recipient Card** — Payment target with chain selector
- **Deposit Wallet Card** — Payer's Unified Balance wallet
- **Connection Lines** — Click to configure payment/document/template
- **Invoice Flow** — Deposit Wallet → Company Wallet (delegation-based)

## Flow Execution

1. Click Start → Preview modal with all routes and real statuses
2. Click "Start Flow" → Canvas locks, overlay panel appears
3. Sign routes → Uses Circle Unified Balance spend
4. Merkle root generated from document values, anchored on GojiProof contract
5. Status persists via P2P → Survives page navigation
6. Stop → Only clears pending routes, preserves settled

## Proof Explorer

- Table shows Date, Document, From, To, Amount, Status columns
- Resolves card titles for from/to names (not raw IDs)
- Search bar accepts any merkle root hash
- Verification calls GojiProof.isAnchored() on Arc Testnet
- Modal shows document info, merkle root, timestamp, contract address
- Document preview iframe for anchored payments

## RWA System

### Smart Contracts (Arc Testnet)

| Contract | Address |
|----------|---------|
| GojiProof | `0x9465a4C246D44F32F391Ebda165Acb12886746Ca` |
| ReceivableFactory | `0x5646647B48b5458D8352764F1b697195454D52Bf` |

### ReceivableToken

- ERC-20 fractional ownership token for receivables
- Multiple proof hashes as collateral (not single proof)
- Configurable: interest rate (bps), min investment, expiry (timestamp)
- Max supply: 1M tokens per receivable
- Finance: Investors send native USDC, receive tokens proportionally
- Repayment: Company deposits principal + interest at expiry
- Redemption: Investors burn tokens for proportional share

### ReceivableFactory

- Creates ReceivableToken contracts
- Flat fee system: 1 USDC per creation (admin configurable)
- Fee collection in factory, admin withdraws to treasury
- Tracks issuers, token addresses, total value per issuer

### Platform Fees

- **Fee Type:** Flat fee at creation
- **Fee Amount:** 1 USDC (18 decimals on Arc, configurable by admin)
- **Fee Payer:** Company (issuer)
- **Treasury:** Configurable by admin
- **Withdrawal:** Admin calls `withdrawFees()`

## Roles

| Role | Description |
|------|-------------|
| Company (employer) | Creates workflows, manages participants |
| Payee | Receives payments, views documents |
| Payer | Approves and sends payments |
| Financial Partner | Verifies proof, provides financing |
| Pending | Awaiting role assignment |

## Gotchas

- **`--webpack` flag**: Frontend scripts use `--webpack` because RainbowKit has Turbopack compatibility issues.
- **Lockfile warning**: Next.js warns about multiple lockfiles (root + frontend). This is cosmetic — ignore it.
- **P2P requires UDP**: Hyperswarm uses UDP for peer discovery. Cloud servers need UDP open.
- **Keet identity**: First run prompts for identity setup (generate/import mnemonic). Saved to `identity.json` in storage folder.
- **No monorepo tooling**: Two separate npm projects. Run `npm install` independently in each directory.
- **`frontend/AGENTS.md`**: Next.js 16 has breaking changes from training data. Read `node_modules/next/dist/docs/` before modifying frontend code.
- **Forge/Git Bash**: Use Git Bash for forge commands on Windows.
