# Goji: Visual Payment Canvas for DAOs & Teams

**Collaborative USDC flows • Payroll • Treasury • Arc-native cross-chain • P2P & non-custodial**

<img width="886" height="408" alt="Screenshot 2026-07-26 085530" src="https://github.com/user-attachments/assets/c17d5a2c-1245-41dd-8625-52e4f4f13f53" />

## Quick Links

- **Live App:** https://goji-testnet.vercel.app/
- **Demo Video:** https://www.youtube.com/watch?v=YfxArY9uQQo
- **Presentation:** https://canva.link/7z2iw3keeii3uwc

Goji is a collaborative workspace where teams review, approve, and execute USDC payments with attached payslips and documents. Built on Arc, it streamlines cross-chain payroll and payment operations into an interactive, visual workflow.

Under the hood, Goji combines Circle Gateway's unified USDC balance with Pear P2P's real-time state synchronization and local document transfer. Teams can chat, approve flows, and send payslips directly to payees — completely serverless, with zero data collection or central infrastructure.

---

## The Problem

Today's team payment operations suffer from three major bottlenecks:

- **Context-Free Workflows:** Payments are disconnected from contracts and invoices. Teams must manually match spreadsheet rows to raw wallet addresses, making reviews slow and error-prone.

- **Data Privacy & GDPR Risk:** Storing employee details, invoices, and pay rates across spreadsheets and centralized platforms exposes sensitive data to third-party risks.

- **Multi-Chain & Admin Overhead:** Managing single-chain transfers across multiple networks requires constant bridging, while manually issuing pay receipts adds hours of overhead.

## What Goji Does

Goji transforms complex payroll and team payouts into an interactive, visual payment canvas. Instead of wrestling with spreadsheet rows and copy-pasting raw wallet addresses, teams can visually map out connected payment flows, assign amounts, attach contracts or invoices directly to transfers, and review execution paths together in real time.

Every co-signer, finance lead, and payee gets complete context on the same canvas before signing a single transaction hash. Once approved, payments settle cross-chain in USDC via Circle Gateway, while auto-generated payslips and encrypted documents are delivered directly to recipients over Pear P2P — keeping your sensitive payroll data off central servers and GDPR-clean by design.

## Who It's For

- **Web3 Teams & Remote Startups:** Companies paying global employees and contractors in USDC that need automated payslips, seamless cross-chain payouts, and strict data privacy without relying on centralized SaaS tools.

- **DAO Treasury & Ops Leads:** Finance managers who need an interactive, visual canvas to map out and review multi-recipient payouts with co-signers before signing off on transactions.

- **Agencies & Software Houses:** Teams managing project-based contractor payouts that require attaching contracts and invoices directly to payments with verifiable, auto-generated receipts.

- **Privacy-Conscious Organizations:** Companies prioritizing serverless architecture and GDPR compliance by keeping payroll records, worker details, and transfer histories strictly peer-to-peer.

## How It Works

### Run the Terminal

Goji runs as a local P2P node on your machine:

1. **Install** — `npx @tamago-labs/goji`
2. **Host mode** — Runs on port 3001, creates an invite code
3. **Join mode** — `npx @tamago-labs/goji --join <code>` connects to a host
4. **Open the app** — Visit https://goji-testnet.vercel.app/ or run the frontend locally at http://localhost:3000

### For Co-Payers & Teams

1. **Register your wallet** — Connect and register your wallet address.
2. **Create a flow** — Build a payment pipeline on the canvas with wallets, recipients, and connection lines.
3. **Set payment details** — Click connection lines to set amounts, attach payslips or documents.
4. **Review & approve** — Collaborate with your team in real-time on the same canvas.
5. **Sign & settle** — Start the flow, preview all routes, and sign to send USDC to recipients.

### For Payees & Contractors

1. **Join via invite** — Connect to the host terminal using the invite code.
2. **Check History tab** — View all received payments with amounts, statuses, and dates.
3. **View documents** — Access payslips, invoices, and contracts attached to each payment.
4. **Funds arrive** — USDC lands in your wallet across any supported chain.

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
- Circle Gateway (deposit/spend)

### Protocols
- Pear P2P (real-time sync)
- Hyperschema (schema-driven storage)

## Status

### Current (v0.5)
✓ **Visual Canvas** — Interactive workflow builder for mapping out payments
✓ **Unified Balance** — Cross-chain payment processing via Circle Gateway
✓ **Payslip Generation** — Automated distribution of payment receipts via P2P
✓ **Real-Time Sync** — Peer-to-peer live state synchronization

### Roadmap to v1
○ **Multi-Sig Gate** — M-of-N approval workflow for team payments
○ **Recipient Mode** — Read-only payslip & document viewer for payees
○ **Batch Payments** — Multiple payments in a single transaction signature
○ **Transaction Export** — CSV & PDF export with full history

## License

TBD.
