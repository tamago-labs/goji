# Goji — The Origination Layer Built on Arc

[![npm version](https://img.shields.io/npm/v/@tamago-labs/goji.svg)](https://www.npmjs.com/package/@tamago-labs/goji)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Private Payments. Public Proof.**

Private P2P workspace for business payments that anchors cryptographic proof on Arc, enabling receivables and other real-world assets to originate from verified payment history.

<img width="922" height="398" alt="Screenshot 2026-08-02 220139" src="https://github.com/user-attachments/assets/d52bd988-6b6b-4348-8709-b5fe73eb44a2" />

## Quick Links

- **Live App:** https://goji.tamagolabs.com/
- **Demo Video:** https://youtu.be/QaZRVty_ViE
- **Presentation:** https://canva.link/7z2iw3keeii3uwc
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)

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

Goji is a stablecoin-native payment and treasury workspace built on Arc, where businesses coordinate USDC payments, approvals, proof anchoring, and receivable financing through a private P2P network.

**Private Layer:** Payroll, contractor payments, invoices, vendor payments, documents, and approvals remain between authorized participants.

**Verification Layer:** Every settlement automatically generates Merkle proofs, signatures, and audit records that can be independently verified without exposing sensitive business data.

**Settlement Layer:** Settle USDC through Circle Unified Balance and Circle Gateway, while anchoring cryptographic payment proofs on Arc.

**Financial Layer:** Convert verified payment history into receivable assets that financial partners can evaluate and fund through programmable stablecoin workflows.

---

## How It Works

Goji runs as a local terminal that hosts a private workspace with an embedded web interface. The frontend is served directly from the terminal — no separate processes needed.

### Host a Workspace

Run the company terminal:

```bash
npx @tamago-labs/goji
```

Opens at `http://localhost:3001` with the full web interface.

The host terminal prints an invite code. Share it with the people who should join the workspace.

### Join a Workspace

Run:

```bash
npx @tamago-labs/goji --join
```

Goji prompts for the invite code and connects the terminal to the existing workspace.

After joining, the company administrator assigns each participant a role from **Organization → Members**.

### Development Mode

For development with hot reload:

```bash
npm start          # CLI on port 3001 (API only)
cd frontend && npm run dev  # Frontend on port 3000
```

### Workspace Roles

| Role              | Access                                                 |
| ----------------- | ------------------------------------------------------ |
| Company           | Manages members, workflows, documents, and receivables |
| Payee             | Receives payments and views permitted documents        |
| Payer             | Reviews and approves payment flows                     |
| Financial Partner | Verifies proofs and funds receivables                  |

## P2P Identity

On first launch, Goji creates a Keet identity using a 24-word mnemonic. Save this mnemonic securely because it is the portable identity for the P2P workspace.

This identity is:

- Not a wallet
- Not used for payment funds
- Used to identify the participant to workspace peers
- Used to associate messages and records with the real sender

The identity and room use encrypted Pear P2P communication over Hyperswarm. Only authorized members added to the workspace can participate.

A first host launch looks like this:

```text
goji v0.1.0
mode: host
port: 3001

No identity found
1. Generate new identity
2. Import existing mnemonic

Choose (1 or 2): 1

New identity generated
Save this mnemonic: <24-word mnemonic>

Enter display name: <name>
Identity saved to ~/.goji/host/identity.json

invite: <invite-code>
share: npx @tamago-labs/goji --join <invite-code>
```

Never publish your mnemonic or an active invite code in documentation, logs, screenshots, or issue reports.

## Smart Contracts

Goji uses Arc smart contracts to anchor payment proofs and create receivable assets from verified payment history.

### GojiProof

GojiProof anchors Merkle roots for payment documents on Arc. The private document stays inside the P2P workspace; the contract stores its root, canvas connection reference, submitting address, and anchor timestamp. Anchoring is permissionless, each Merkle root can be anchored only once, and the contract emits a `RootAnchored` event.

- `anchorRoot(bytes32 merkleRoot, bytes32 connectionId)` stores a proof
- `isAnchored(bytes32 merkleRoot)` verifies that a root exists
- `getDocument(bytes32 merkleRoot)` returns the root, connection, submitter, and timestamp
- `getRootByConnection(bytes32 connectionId)` looks up a root from its canvas connection
- `hasDocument(bytes32 connectionId)` checks whether a connection has an anchored document

### SoulboundIdentityPass

The Arc Testnet identity pass binds one non-transferable NFT to each wallet. It stores only the token/pass reference on-chain; compliance and banking data remain workspace-scoped.

- `mint()` creates one pass per wallet
- `tokenIdOf(address wallet)` returns the wallet's NFT id
- `passIdOf(address wallet)` returns the separate identity pass id
- `isValid(address wallet)` checks revocation and expiry

### ComplianceRegistry

ComplianceRegistry is a company or pool-specific eligibility layer. It does not change the global identity NFT. Reviewers approve a pass with a compliance tier, expiry, and ISO country code; pools can then apply their own country allowlist.

- `approveIdentity(...)` records an approved pass
- `revokeIdentity(...)` removes approval
- `isEligible(...)` checks pass validity and tier
- `isEligibleForCountry(...)` checks pass, tier, and country

### ReceivableFactory

ReceivableFactory creates and tracks receivable token contracts for company issuers.

- Creates receivables with amount, interest rate, minimum investment, expiry, and proof hashes
- `createReceivableWithCompliance(...)` optionally applies an identity registry and required tier
- Charges a configurable flat creation fee of 1 USDC by default
- Tracks receivables and total value by issuer
- Allows the administrator to configure the treasury and withdraw platform fees

### ReceivableToken

Each receivable has an ERC-20 token representing fractional ownership of the financed payment.

- References multiple GojiProof hashes to demonstrate the company’s verified payment history.
- Partners finance receivables with native USDC on Arc
- Tokens are issued according to each partner's investment
- Interest is calculated pro rata using investment amount and time funded
- The company repays principal plus interest at expiry
- Token holders redeem their share after repayment
- Repayment is restricted to the receivable issuer

### ReceivablePool

Financial partners can aggregate multiple receivables into a pool. Pool investors deposit native USDC and receive pool-share tokens instead of interacting with each receivable directly.

- Adds and finances multiple receivables
- Checks optional identity tier and country eligibility on deposits
- Closes deposits before the funding phase
- Opens redemptions explicitly after receivable repayment is collected

### ReceivablePoolFactory

Creates pools owned by the financial partner who created them. Pool policy can require a minimum compliance tier and allow multiple countries.

#### Default Receivable Parameters

| Parameter          | Default            | Description                        |
| ------------------ | ------------------ | ---------------------------------- |
| Token supply       | 1,000,000          | Maximum token units per receivable |
| Interest rate      | 20% APR            | Configured by the company          |
| Minimum investment | 1 USDC             | Configured by the company          |
| Term options       | 30, 60, or 90 days | Configured at creation             |
| Creation fee       | 1 USDC             | Paid by the company issuer         |

Interest is distributed pro rata: investors who contribute more or fund earlier receive a larger share of the return.

## Private Knowledge Base

Goji includes a private knowledge base for company documents. The employer terminal runs GTE-Large locally and keeps the vector index on the host. Authorized members search policies, invoices, and procedures through encrypted P2P requests.

- Employer management: `/start/organization/ai-assistant`
- Member search: `/start/knowledge`
- Sources: pasted text and website URLs
- Current model: GTE-Large embeddings and vector search

Source documents and embeddings are never replicated. Members receive only relevant search snippets while the employer host is online. The employer controls model lifecycle and document management.

| Component            | Responsibility                                                 |
| -------------------- | -------------------------------------------------------------- |
| `src/index.js`       | Terminal entrypoint, API, WebSocket, P2P room, and role checks |
| `src/ragStore.js`    | Local document metadata, embeddings, and vector search         |
| `schema.js`          | HyperSchema records, HyperDB collections, and dispatch routes  |
| `spec/`              | Generated schema, database, and dispatch specifications        |
| `frontend/app/start` | Workspace application and role-based pages                     |
| `contracts/src`      | GojiProof and receivable contracts                             |

## API Surface

| Endpoint                                        | Purpose                                               |
| ----------------------------------------------- | ----------------------------------------------------- |
| `GET /api/health`                               | Terminal status, identity, role, and peers            |
| `/api/boards`, `/api/cards`, `/api/connections` | Visual workflow data                                  |
| `/api/flow-status`                              | Payment execution status                              |
| `/api/chat`                                     | P2P workspace chat                                    |
| `/api/wallets`                                  | Wallet registration and balances                      |
| `/api/templates`, `/api/invoices`               | Document and invoice workflows                        |
| `/api/knowledge/documents`                      | Employer document management                          |
| `/api/knowledge/model`                          | Embedding model status and lifecycle                  |
| `POST /api/knowledge/url`                       | Fetch website text for ingestion                      |
| `POST /api/knowledge/search`                    | Local or P2P knowledge search                         |
| `/api/members`                                  | Employer member and role management                   |
| `ws://localhost:3001`                           | Live browser updates for the visual payment workspace |

## Getting Started

### Terminal

```bash
npm install
npm run build:specs
npm start
```

To join an existing workspace:

```bash
npm start -- --join <invite-code>
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on port `3000` and connects to `http://localhost:3001` by default. The terminal and frontend are independent npm projects.

### Operational Notes

- Hyperswarm peer discovery requires UDP access.
- Keep the employer terminal online for member knowledge searches.
- Frontend scripts use `--webpack` because of the RainbowKit integration.
- The first terminal run may create a Keet identity in the Goji storage directory.
- Use `npm run clean:storage` only when intentionally resetting local P2P state.

## Arc Testnet Contracts

| Contract              | Address                                      |
| --------------------- | -------------------------------------------- |
| GojiProof             | `0x9465a4C246D44F32F391Ebda165Acb12886746Ca` |
| ReceivableFactory     | `0x9CE5e02F96ef27bc894366AB360DD7f8545d5708` |
| SoulboundIdentityPass | `0x9829724359A49c36B53deB1e059c14d3C2eA5458` |
| ComplianceRegistry    | `0x31289306250CeB6dC5Bb78A32AC2393Dab250b22` |
| ReceivablePoolFactory | `0xB492cb1C7bf4a199954c06b9640DF3936Af8e782` |

- Chain: Arc Testnet, chain ID `5042002`
- Receivable creation fee: 1 USDC, configurable by the administrator
- Receivable funding uses native USDC on Arc

Deployment order for the compliance and pooled-financing layer:

```text
SoulboundIdentityPass
        ↓
ComplianceRegistry
        ↓
ReceivablePoolFactory
```

## Roadmap

- Local Qwen and Gemma assistant models grounded in private workspace knowledge
- Multi-currency payment support beyond USDC
- Arc mainnet deployment
- Safe multisignature wallet support

## Roadmap

**Onboarding**

- Embed the frontend into the CLI terminal, so `npx @tamago-labs/goji` starts both the terminal and the workspace UI in a single command

**AI**

- Local Qwen and Gemma assistant models with tool access to the current RAG knowledge search, for conversational (not just snippet) answers

**Privacy**

- On-chain privacy (APS) for payment records and proofs

**Payments & Chains**

- Multi-stablecoin settlement, starting with EURC and other Circle-supported assets
- Mainnet deployment on Arc, followed by additional chain support
- Local currency payment terms (JPY, THB, USD, and others) with exchange rate fetched at settlement time

**Security / Compliance**

- Safe multisignature wallet support for company treasury and receivable funding
- Security audit of ReceivableToken and ReceivableFactory contracts
- KYC/KYB verification layer for companies, payees, and financial partners

## License

Apache License 2.0
