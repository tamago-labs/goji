# Goji — The P2P Payment Origination Layer Built on Arc

[![npm version](https://img.shields.io/npm/v/@tamago-labs/goji.svg)](https://www.npmjs.com/package/@tamago-labs/goji)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Private Payments. Public Proof.**

Private P2P workspace for business payments that anchors cryptographic proof on Arc, enabling receivables and other real-world assets to originate from verified payment history.

<img width="886" height="408" alt="Goji" src="https://github.com/user-attachments/assets/c17d5a2c-1245-41dd-8625-52e4f4f13f53" />

## Quick Links

- **Live App:** https://goji-testnet.vercel.app/
- **Demo Video:** https://www.youtube.com/watch?v=YfxArY9uQQo
- **Presentation:** https://canva.link/7z2iw3keeii3uwc

Goji is a P2P payment origination layer built on Arc.

Businesses run payroll, contractor payments, invoices, and other business settlements inside a private workspace. Every settlement automatically generates cryptographic proof anchored on Arc, creating verifiable payment history that can be used to originate receivables and other real-world assets for financial partners.

---

## The Problem

Business payments are managed across disconnected systems that weren't designed to create verifiable financial history:

- **Payroll & accounting software** — isolated from other payment workflows
- **Spreadsheets** — manual, error-prone, and difficult to audit
- **Email approvals** — fragmented decisions with no shared history
- **Banking systems** — settlement without reusable financial proof

The result is fragmented payment history that's difficult to verify, expensive to underwrite, and impossible to reuse as financial infrastructure.

---

## What Goji Does

Goji is a private payment workspace built on Arc where businesses, counterparties, and financial partners collaborate through cryptographic proof instead of fragmented paperwork.

**Private Layer:** Payroll, contractor payments, invoices, vendor payments, documents, and approvals remain between authorized participants.

**Verification Layer:** Every settlement automatically generates Merkle proofs, signatures, and audit records that can be independently verified without exposing sensitive business data.

**Settlement Layer:** Settle USDC from supported chains through Circle Unified Balance while anchoring cryptographic proof on Arc to create a permanent, verifiable payment history.

**Financial Layer:** Verified payment history enables businesses to originate receivables and other real-world assets while connecting directly with financing, treasury, and credit partners.

---

## Who It's For

- **Businesses** — Create and settle payroll, contractor payments, invoices, and vendor payments.
- **Counterparties** — Receive payments, verify records, and access permissioned documents.
- **Financial Partners** — Verify cryptographic proof, evaluate payment history, and fund real-world assets.

---

## How It Works

### Run the Terminal

```
npx @tamago-labs/goji
```

### Workspace Roles

| Role | Description |
|------|-------------|
| Company | Creates payment workflows, manages participants |
| Payee | Receives payments, views documents |
| Payer | Approves and sends payments |
| Financial Partner | Verifies proof, provides financing |

### Invoice Flow

1. **Create** — Draft invoice, add documents, send P2P
2. **Fund & Approve** — Payer tops up Unified Balance, reviews and approves
3. **Settle on Arc** — USDC payment executed, proof anchored on-chain
4. **Originate & Finance** — Receivable asset created, financial partners evaluate and fund

### Payment Flow

1. **Create** — Company draws wallet → recipient flow on canvas
2. **Configure** — Set payment amount, attach documents
3. **Sign** — Payer approves, Circle Unified Balance executes
4. **Settle** — USDC sent, proof anchored on GojiProof

### RWA System

- **Company View:** Create receivables from pending flows, set terms, invite financial partners
- **Partner View:** Browse receivables, verify proofs, invest with pro-rata interest
- **Public Explorer:** View all assets on Arc at `/rwa` (no wallet required)

### Proof Explorer

- Search any merkle root hash to verify on-chain via GojiProof contract
- Your Proofs table shows Date, Document, From, To, Amount, Status
- Click Verify to open modal with on-chain verification result
- Document preview iframe for anchored payments

---

## Tech Stack

### Frontend
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4
- RainbowKit + Wagmi + Viem
- Circle AppKit + Unified Balance Kit
- Framer Motion (animations)

### Backend
- Node.js CLI with P2P rooms
- Autobase + Hyperswarm + BlindPairing
- Express HTTP API + WebSocket
- Keet Identity (portable P2P identities)

### Blockchain
- Arc Testnet, Base Sepolia, Ethereum Sepolia
- Circle Unified Balance (cross-chain USDC)
- Circle Gateway (settlement)
- GojiProof contract (merkle root anchoring)
- ReceivableToken + ReceivableFactory (RWA issuance)
- PriceOracle (custom + Pyth)

### Protocols
- Pear P2P (real-time sync)
- Hyperschema (schema-driven storage)

---

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
| POST | /api/members/assign | Role assignment |
| GET | /api/members | List members |
| WebSocket | ws://localhost:3001 | Real-time sync |

---

## Canvas System

- **Wallet Card** — Company wallet (Arc settlement)
- **Recipient Card** — Payment target with chain selector
- **Deposit Wallet Card** — Payer's Unified Balance wallet
- **Connection Lines** — Click to configure payment/document/template
- **Invoice Flow** — Deposit Wallet → Company Wallet (delegation-based)

---

## Gotchas

- **`--webpack` flag**: Frontend scripts use `--webpack` because RainbowKit has Turbopack compatibility issues.
- **Lockfile warning**: Next.js warns about multiple lockfiles (root + frontend). This is cosmetic — ignore it.
- **P2P requires UDP**: Hyperswarm uses UDP for peer discovery. Cloud servers need UDP open.
- **Keet identity**: First run prompts for identity setup (generate/import mnemonic). Saved to `identity.json` in storage folder.
- **No monorepo tooling**: Two separate npm projects. Run `npm install` independently in each directory.

---

## Deployment (Arc Testnet)

| Contract | Address |
|----------|---------|
| GojiProof | `0x9465a4C246D44F32F391Ebda165Acb12886746Ca` |
| ReceivableFactory | `0x5646647B48b5458D8352764F1b697195454D52Bf` |

**Chain:** Arc Testnet (Chain ID: 5042002)

**Deployer:** `0x36bBb997235Fc965a854e132976fC8461B9392F5`

### Platform Fees

- **Flat Fee:** 1 USDC per receivable created
- **Fee Payer:** Company (issuer)
- **Treasury:** Configurable by admin
- **Withdrawal:** Admin calls `withdrawFees()` to collect

---

## License

Apache License 2.0
