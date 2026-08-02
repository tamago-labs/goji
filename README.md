# Goji — The P2P Origination Layer Built on Arc

**Private Payments. Public Proof.**

<img width="886" height="408" alt="Goji" src="https://github.com/user-attachments/assets/c17d5a2c-1245-41dd-8625-52e4f4f13f53" />

## Quick Links

- **Live App:** https://goji-testnet.vercel.app/
- **Demo Video:** https://www.youtube.com/watch?v=YfxArY9uQQo
- **Presentation:** https://canva.link/7z2iw3keeii3uwc

Goji is a P2P payment origination layer built on Arc. Businesses run payroll, contractor payments, and invoices in a private workspace. Every settlement creates verifiable proof on Arc, enabling them to originate receivables and other real-world assets for financial partners.

---

## The Problem

Traditional businesses generate financial records through disconnected systems:

- **Payroll software** — siloed from other payments
- **Spreadsheets** — manual, error-prone, not verifiable
- **Email approvals** — no audit trail
- **Banking systems** — isolated, no proof of payment

These records are difficult to verify and expensive to underwrite.

---

## What Goji Does

Goji creates a private payment workspace where businesses, counterparties, and financial partners collaborate through a permissioned P2P network.

**Private Layer:** Payroll, contractor payments, invoices, and vendor payments stay between authorized participants.

**Verification Layer:** Every payment generates cryptographic proof — Merkle roots, signatures, audit trails — without exposing sensitive data.

**Settlement Layer:** USDC payments settle on Arc with on-chain proof anchoring.

**Financial Layer:** Verified payment records become real-world assets for receivable financing, treasury, and credit.

---

## Who It's For

- **Businesses:** Run payroll, pay contractors, and manage invoices in one private workspace
- **Contractors & Vendors:** Receive payments, verify records, access documents
- **Financial Partners:** Verify proof, evaluate receivables, provide financing

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
| ReceivableFactory | `0x6F2979De8B541840E2E91321D6772D94Ed91d700` |

**Chain:** Arc Testnet (Chain ID: 5042002)

**Deployer:** `0x36bBb997235Fc965a854e132976fC8461B9392F5`

### Platform Fees

- **Flat Fee:** 1 USDC per receivable created
- **Fee Payer:** Company (issuer)
- **Treasury:** Configurable by admin
- **Withdrawal:** Admin calls `withdrawFees()` to collect

---

## License

TBD.
