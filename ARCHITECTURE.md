# Goji RWA Architecture

## Overview

Goji transforms verified payment records into real-world assets (RWAs). Companies use their payment history as collateral to receive financing from financial partners.

**Note:** USDC is the native token on Arc (Chain ID: 5042002). All funding uses `msg.value` (native transfers), not ERC-20 approvals.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Landing Page  │  Company App  │  Partner App  │  RWA Explorer  │
│  /             │  /start/*     │  /start/*     │  /rwa          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   P2P Network     │
                    │  (Hyperswarm)     │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                    Node.js Terminal                             │
├─────────────────────────────────────────────────────────────────┤
│  Express API  │  WebSocket  │  Autobase  │  Hyperschema        │
│  Local QVAC embeddings + private RAG index                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                    Smart Contracts (Arc)                         │
├─────────────────────────────────────────────────────────────────┤
│  GojiProof  │  ReceivableFactory  │  ReceivableToken            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Private Knowledge Base

The company CLI is the knowledge host. It stores document metadata and QVAC embeddings locally under its Goji storage directory. Text and URLs are ingested only by the employer. Other authorized peers submit `rag-search` requests through the encrypted Autobase room and receive bounded `rag-search-result` snippets; full documents and embeddings are never replicated.

The frontend exposes document/model management under `/start/organization/ai-assistant` for the employer and search under `/start/knowledge` for all assigned workspace roles.

---

## Data Flow

### Company Creates Receivable

```
Company Workspace (P2P)
  ├── Pending flows (payment/invoice)
  └── Settled flows (with merkleRoot proofs)
           ↓
Company creates receivable:
  1. Selects pending flow → defines terms
  2. Selects settled proofs → collateral
  3. Calls ReceivableFactory.createReceivable()
  4. Saves to P2P (/api/receivables)
           ↓
ReceivableToken deployed on Arc
  - 1,000,000 tokens (held by contract)
  - Status: Active
```

### Financial Partner Funds

```
Partner Workspace (P2P)
  └── Sees receivables from companies
           ↓
Partner reviews:
  1. Views receivable details
  2. Verifies proofs on GojiProof contract
  3. Checks terms and funding progress
           ↓
Partner funds:
  1. Calls ReceivableToken.finance{value: amount}()
  2. USDC sent to company (issuer)
  3. Tokens minted to partner
  4. Pro-rata interest based on funding date
```

### Company Repays

```
At expiry:
  Company calls ReceivableToken.claimRepayment{value: repayment}()
           ↓
  repayment = totalReceivable + totalInterest
  USDC stored in contract
  Status = Redeemed
           ↓
Partners redeem:
  Each partner calls ReceivableToken.redeem()
  Share = (tokens / totalSupply) * totalRedeemable
```

---

## Smart Contracts

### GojiProof

**Address:** `0x9465a4C246D44F32F391Ebda165Acb12886746Ca`

Stores Merkle roots for document verification.

```solidity
contract GojiProof {
    mapping(bytes32 => DocumentRecord) public documents;
    
    function anchorRoot(bytes32 merkleRoot, bytes32 connectionId) external;
    function isAnchored(bytes32 merkleRoot) external view returns (bool);
    function getDocument(bytes32 merkleRoot) external view returns (DocumentRecord memory);
}
```

### ReceivableFactory

**Address:** `0x5646647B48b5458D8352764F1b697195454D52Bf`

Creates and tracks receivable tokens. Collects platform fees.

```solidity
contract ReceivableFactory {
    address public owner;
    address public treasury;
    uint256 public feeAmount;         // 1 USDC (18 decimals)
    
    function createReceivable(
        string memory name,
        string memory receivableType,
        uint256 amount,
        uint256 interestRate,
        uint256 minInvestment,
        uint256 expiresAt,
        bytes32[] memory proofs
    ) external payable returns (address);
    
    function getReceivables(address issuer) external view returns (address[]);
    function setFee(uint256 _feeAmount) external;
    function setTreasury(address _treasury) external;
    function withdrawFees() external;
}
```

### ReceivableToken

ERC-20 fractional ownership token for receivables.

```solidity
contract ReceivableToken is ERC20, Ownable {
    string public receivableType;    // "invoice" or "payment"
    address public issuer;
    bytes32[] public proofHashes;    // Collateral proofs
    
    uint256 public totalReceivable;
    uint256 public interestRate;     // Basis points (2000 = 20%)
    uint256 public minInvestment;
    uint256 public maxSupply;        // 1,000,000 * 1e6
    uint256 public expiresAt;
    
    uint256 public fundedAmount;
    uint256 public totalRedeemable;
    
    mapping(address => uint256) public fundingDate;
    mapping(address => uint256) public investedAmount;
    
    enum Status { Active, Funded, Expired, Redeemed, Defaulted }
    Status public status;
    
    function finance() external payable;
    function claimRepayment() external payable;
    function redeem() external;
    
    function calculateShare(address investor) public view returns (uint256);
    function calculateInvestorInterest(address investor) public view returns (uint256);
    function getTotalRepayment() public view returns (uint256);
}
```

---

## Token Economics

### Parameters

| Parameter | Default | Notes |
|-----------|---------|-------|
| Total Supply | 1,000,000 | Per receivable token |
| Interest Rate | 20% APR | Set by company |
| Min Investment | 1 USDC | Set by company |
| Term Options | 30, 60, 90 days | Fixed options |
| Platform Fee | 1 USDC | Flat fee at creation |

### Pro-Rata Interest

Interest calculated based on **actual days invested**:

```
interest = investedAmount × daysInvested × interestRate / (totalDays × 10000)
```

| Investor | Funded | Day | Days Invested | Interest | Share |
|----------|--------|-----|---------------|----------|-------|
| Partner A | $5,000 | 0 | 60 | $1,000 | $6,000 |
| Partner B | $5,000 | 30 | 30 | $500 | $5,500 |
| **Total** | **$10,000** | — | — | **$1,500** | **$11,500** |

### Status Lifecycle

```
Active → Funded → Redeemed
  ↓        ↓
Expired  Defaulted
```

---

## Frontend Architecture

### Pages

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Landing page |
| `/rwa` | Public | RWA Explorer (on-chain data) |
| `/rwa/[address]` | Public | Token detail |
| `/start/overview` | Auth | Dashboard with portfolio |
| `/start/receivables/*` | Company | Create/manage receivables |
| `/start/available-receivables/*` | Partner | Browse and invest |
| `/start/proof` | All | Verify merkle roots |
| `/start/knowledge` | All assigned roles | Search private P2P knowledge |
| `/start/organization/ai-assistant` | Company | Manage local model and documents |

### Data Sources

| Source | Data |
|--------|------|
| P2P (API) | Flow details, document previews, workspace data |
| On-chain | Token info, funding status, investor balances |

### Key Components

| Component | Purpose |
|-----------|---------|
| `Portfolio` | Shows partner's investments on Overview |
| `DocumentPreview` | Renders invoice/receipt from template |
| `ProofExplorer` | Verifies merkle roots on GojiProof |

---

## Security

1. **Proof verification** — Multiple proofs as collateral
2. **Issuer is company** — Correct address stored via constructor
3. **Pro-rata interest** — Fair distribution based on funding time
4. **Expiry enforcement** — Timestamp-based
5. **Fee admin** — Only owner can change fee/treasury
6. **Native USDC** — No ERC-20 approvals needed on Arc
