# Goji RWA Architecture

## Overview

Goji transforms verified payment records into real-world assets (RWAs). Companies use their payment history as collateral to receive financing from financial partners.

**Note:** USDC is the native token on Arc (Chain ID: 5042002). USDC funding uses `msg.value`; ERC-20 approval is used when a financial partner transfers receivable-token positions into pool custody.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js Terminal (Port 3001)                  │
├─────────────────────────────────────────────────────────────────┤
│  Embedded Frontend  │  Express API  │  WebSocket  │  P2P Room   │
│  (static files)     │  /api/*       │  Real-time  │  Autobase   │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   P2P Network     │
                    │  (Hyperswarm)     │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                    Smart Contracts (Arc)                         │
├─────────────────────────────────────────────────────────────────┤
│  GojiProof  │  ComplianceRegistry │  ReceivableFactory          │
│  ReceivableToken  │  ReceivablePoolFactory  │  ReceivablePool      │
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
   2. Selects settled proofs → verified payment-history evidence
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
   2. Verifies payment-history proofs on GojiProof contract
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

### Partner Creates a Managed Pool

```
Financial Partner has financed receivables
            ↓
1. Creates a pool through ReceivablePoolFactory
2. Approves the pool to transfer selected ReceivableToken positions
3. Pool takes custody and mints manager pool shares
4. Manager configures APY, term, capacity, stake period, and compliance
5. Public pool investors deposit native USDC and receive pool shares
6. Manager may use pool cash to finance additional receivables
            ↓
Deposits close → underlying receivables are redeemed → redemptions open
```

Pool investors interact with the pool smart contract directly. P2P is used for company and financial-partner coordination, documents, proofs, and workspace metadata; it is not used to settle pool-investor capital.
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

Stores Merkle roots for document verification and links each root to a Goji canvas connection.

```solidity
contract GojiProof {
    address public owner;
    mapping(bytes32 => DocumentRecord) public documents;
    mapping(bytes32 => bytes32) public connectionToRoot;

    event RootAnchored(bytes32 merkleRoot, bytes32 connectionId, address submitter, uint256 timestamp);

    function anchorRoot(bytes32 merkleRoot, bytes32 connectionId) external returns (uint256 timestamp);
    function isAnchored(bytes32 merkleRoot) external view returns (bool);
    function getDocument(bytes32 merkleRoot) external view returns (DocumentRecord memory);
    function getRootByConnection(bytes32 connectionId) external view returns (bytes32);
    function hasDocument(bytes32 connectionId) external view returns (bool);
}
```

### ReceivableFactory

**Address:** `0x53F71eC10939d4aD243903B496E403B3C27784Ae`

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

    function createReceivableWithCompliance(
        string memory name,
        string memory receivableType,
        uint256 amount,
        uint256 interestRate,
        uint256 minInvestment,
        uint256 expiresAt,
        bytes32[] memory proofs,
        address complianceRegistry,
        uint8 requiredTier,
        bytes2[] memory allowedCountries
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
    bytes32[] public proofHashes;    // Verified payment-history references

    uint256 public totalReceivable;
    uint256 public interestRate;     // Basis points (2000 = 20%)
    uint256 public minInvestment;
    uint256 public maxSupply;        // 1,000,000 * 1e6
    uint256 public expiresAt;
    address public complianceRegistry;
    uint8 public requiredComplianceTier;
    bytes2[] public allowedCountries; // Empty means unrestricted

    uint256 public fundedAmount;
    uint256 public totalRedeemable;

    mapping(address => uint256) public fundingDate;
    mapping(address => uint256) public investedAmount;

    enum Status { Active, Funded, Expired, Redeemed, Defaulted }
    Status public status;

    function finance() external payable;
    function getAllowedCountries() external view returns (bytes2[] memory);
    function isCountryAllowed(bytes2 countryCode) public view returns (bool);
    function claimRepayment() external payable;
    function redeem() external;

    function calculateShare(address investor) public view returns (uint256);
    function calculateInvestorInterest(address investor) public view returns (uint256);
    function getTotalRepayment() public view returns (uint256);
}
```

### SoulboundIdentityPass

**Address:** `0x9829724359A49c36B53deB1e059c14d3C2eA5458`

One non-transferable ERC-721 identity pass is minted per wallet. The pass exposes a token ID and separate pass ID, with owner-controlled expiry and revocation. It contains no passport, bank, or KYC payload.

### ComplianceRegistry

**Address:** `0x31289306250CeB6dC5Bb78A32AC2393Dab250b22`

Company or compliance reviewers approve identity passes with a tier, expiry, and ISO country code. This registry is policy-specific; it does not modify the global identity pass. Pools can use the registry and apply an allowlist of multiple countries.

The wallet used by the Identity Review page must be configured with `setReviewer(reviewer, true)` by the registry owner before it can approve identities on-chain. Use `script/8-ConfigureComplianceReviewer.s.sol` for this configuration.

### ReceivablePool

Pools aggregate receivable positions for financial partners. The manager transfers actual `ReceivableToken` positions into the pool and receives manager shares based on their underlying value. Pool investors deposit native USDC and receive ERC-20 pool shares. Pool cash can finance additional receivables selected by the manager. Redemptions open only after the manager has redeemed the underlying receivable positions.

The pool values a custodied position from its token balance and the receivable's `totalReceivable`/`totalSupply`. Pool share issuance uses the current cash plus underlying receivable value. Redemption is blocked until the manager closes deposits and redeems all underlying positions.

### ReceivablePoolFactory

**Address:** `0x839bDD622641bF9b0680F8aC9B2Fd7FC9f44263F`

Creates pools owned by the financial partner that created them. Each pool can configure a compliance registry, minimum tier, and multiple allowed country codes.

---

## Token Economics

### Parameters

| Parameter      | Default         | Notes                |
| -------------- | --------------- | -------------------- |
| Total Supply   | 1,000,000       | Per receivable token |
| Interest Rate  | 20% APR         | Set by company       |
| Min Investment | 1 USDC          | Set by company       |
| Term Options   | 30, 60, 90 days | Fixed options        |
| Platform Fee   | 1 USDC          | Flat fee at creation |

### Pro-Rata Interest

Interest calculated based on **actual days invested**:

```
interest = investedAmount × daysInvested × interestRate / (totalDays × 10000)
```

| Investor  | Funded      | Day | Days Invested | Interest   | Share       |
| --------- | ----------- | --- | ------------- | ---------- | ----------- |
| Partner A | $5,000      | 0   | 60            | $1,000     | $6,000      |
| Partner B | $5,000      | 30  | 30            | $500       | $5,500      |
| **Total** | **$10,000** | —   | —             | **$1,500** | **$11,500** |

### Status Lifecycle

```
Active → Funded → Redeemed
  ↓        ↓
Expired  Defaulted
```

---

## Frontend Architecture

### Pages

| Route                              | Access             | Purpose                          |
| ---------------------------------- | ------------------ | -------------------------------- |
| `/`                                | Public             | Landing page                     |
| `/rwa`                             | Public             | RWA Explorer (on-chain data)     |
| `/rwa`                             | Public             | Public pool listing              |
| `/rwa/pool?address=<pool>`         | Public             | Pool detail, invest, redeem      |
| `/start/overview`                  | Auth               | Dashboard with portfolio         |
| `/start/receivables/*`             | Company            | Create/manage receivables        |
| `/start/available-receivables/*`   | Partner            | Browse and invest                |
| `/start/pools`                     | Partner            | Create and manage pools          |
| `/start/identities`                | Compliance         | Review and on-chain approve IDs  |
| `/start/travel-rule`               | Compliance         | Read-only audit and CSV export   |
| `/start/proof`                     | All                | Verify merkle roots              |
| `/start/knowledge`                 | All assigned roles | Search private P2P knowledge     |
| `/start/organization/ai-assistant` | Company            | Manage local model and documents |

### Data Sources

| Source    | Data                                            |
| --------- | ----------------------------------------------- |
| P2P (API) | Flow details, document previews, workspace data |
| On-chain  | Token info, funding status, investor balances   |

Pool pages read pool inventory, APY, term, capacity, compliance policy, share balances, and redemption state directly from Arc.

### Key Components

| Component         | Purpose                                 |
| ----------------- | --------------------------------------- |
| `Portfolio`       | Shows partner's investments on Overview |
| `DocumentPreview` | Renders invoice/receipt from template   |
| `ProofExplorer`   | Verifies merkle roots on GojiProof      |

---

## Security

1. **Proof verification** — Multiple proofs demonstrate verified payment history
2. **Issuer is company** — Correct address stored via constructor
3. **Pro-rata interest** — Fair distribution based on funding time
4. **Expiry enforcement** — Timestamp-based
5. **Fee admin** — Only owner can change fee/treasury
6. **Native USDC** — USDC funding uses native transfers on Arc
7. **Pool custody** — Receivable positions must be transferred into pool custody before manager shares are issued
8. **Compliance separation** — Identity documents remain workspace-scoped while eligibility enforcement occurs on-chain
