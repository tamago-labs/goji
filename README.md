# Goji

**Visual Payment Flows for DAOs & Teams**

Goji turns payroll, contributor payments, and one-off transfers into something you can actually _see_ — a canvas where wallets, recipients, contracts, and payslips connect like a flow diagram, instead of a spreadsheet no one fully trusts.

---

## The problem

Most DAOs and small teams run payments through a patchwork of tools: a spreadsheet for who-gets-paid-what, a block explorer to confirm it landed, a Discord thread for the contract, and a multisig app for the actual signature. Nothing shows the full picture in one place, and reviewing a payout means trusting a wall of addresses and numbers rather than seeing the relationships behind them.

## What Goji does

Describe who needs to get paid — in plain language or a spreadsheet — and Goji drafts the flow for you: a wallet connected to recipients, each carrying its amount, schedule, and any attached document (a contract, an invoice, a payslip). You review it, edit anything that's wrong, and approve it. Once approved, the flow executes and settles instantly in USDC.

Because the flow is visual, every reviewer — a co-signer, a finance lead, a teammate — can look at the same canvas and understand exactly where money is going and why, before anyone has to trust a transaction hash.

## Who it's for

- **DAOs** paying contributors and grant recipients out of a shared treasury, where more than one person needs to review and approve before funds move.
- **Small web3 teams** running recurring contributor payroll without the overhead of a full compliance/accounting platform.
- **Freelancers and clients** who want the contract, the payment, and the receipt to live in one place instead of scattered across email and chat.
- **Anyone splitting a payment peer-to-peer** — a shared cost, a one-off transfer — who wants something as simple as drawing it out.

## How it works

1. **Register your wallet** — Connect and register your wallet address.
2. **Create a flow** — Build a payment pipeline on the canvas with wallets, recipients, and connection lines.
3. **Set payment details** — Click connection lines to set amounts, attach payslips or documents.
4. **Start & sign** — Preview all routes, start the flow, and sign to send USDC to recipients.
5. **Track status** — See real-time settlement status on the canvas and in your history.

## Tech Stack

- **Backend:** Node.js CLI with P2P rooms (Autobase + Hyperswarm + BlindPairing), Express HTTP API + WebSocket
- **Frontend:** Next.js 16 + React 19 + Tailwind v4 + RainbowKit (TypeScript)
- **Blockchain:** Arc Testnet, Base Sepolia, Ethereum Sepolia via Circle Unified Balance
- **Identity:** Keet identity key for portable P2P identities and signature verification

## Status

v0.5 — Early prototype built for the Encode x Arc "Programmable Money" hackathon. Features include canvas-based flow builder, payment execution via Circle Unified Balance, payslip templates, and P2P sync.

## License

TBD.
