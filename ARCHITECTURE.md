# Goji RWA Architecture

## Overview

Goji transforms verified payment records into real-world assets (RWAs). Companies use their payment history as collateral to receive financing from financial partners.

**Note:** USDC is the native token on Arc (Chain ID: 5042002). All funding uses `msg.value` (native transfers), not ERC-20 approvals.

---

## Real Flow

```
Month 1: Invoice → $10k → Settled → Proof 1
Month 2: Invoice → $10k → Settled → Proof 2
Month 3: Invoice → $10k → Settled → Proof 3
         ↓
Company wants funding for new $10k invoice
         ↓
Company creates receivable:
  - Uses 3 proofs as collateral
  - Sets terms: 20% interest, 90 days, min $100 investment
  - Token supply: 1,000,000 (default)
         ↓
Financial Partner sees receivable:
  - Reviews proofs on GojiProof
  - Funds $5k (50% of total)
  - Receives 500,000 tokens (50% of supply)
         ↓
At expiry (90 days):
  - Company deposits $12k (principal + interest)
  - Partner redeems 500k tokens → receives $6k
```

---

## Smart Contracts

### 1. ReceivableToken (ERC-20)

**Purpose:** Fractional ownership token for receivables.

```solidity
contract ReceivableToken is ERC20, Ownable {
    // ─── Metadata ───
    string public name;              // "Invoice #123"
    string public symbol;            // "GOJINV"
    string public receivableType;    // "invoice", "payroll", "contractor"
    
    // ─── Issuer ───
    address public issuer;           // Company that created this
    bool public issuerReceivedTokens; // False - issuer doesn't hold tokens
    
    // ─── Proofs (collateral) ───
    bytes32[] public proofHashes;    // Multiple merkle roots from GojiProof
    
    // ─── Terms ───
    uint256 public totalReceivable;  // e.g., 10,000 USDC (actual amount)
    uint256 public interestRate;     // Basis points (2000 = 20%)
    uint256 public minInvestment;    // Minimum per investor (e.g., 100 USDC)
    uint256 public expiresAt;        // Timestamp, not duration
    
    // ─── Funding ───
    uint256 public fundedAmount;     // Total USDC received from investors
    uint256 public totalSupply;      // Max tokens (default 1,000,000)
    mapping(address => uint256) public tokenBalances; // Investor → tokens
    
    // ─── State ───
    enum Status { Active, Funded, Expired, Redeemed, Defaulted }
    Status public status;
    
    // ─── Functions ───
    function finance() external payable;  // Investor funds
    function redeem() external;           // Investor redeems after company pays
    function claimRepayment() external;   // Company deposits repayment
}
```

**Key Changes from Current:**
- `proofHashes[]` instead of single `proofHash`
- `expiresAt` as timestamp (not `EXPIRY_PERIOD` duration)
- `interestRate` as basis points (configurable)
- `minInvestment` configurable
- `totalSupply` configurable (default 1M)
- `issuer` doesn't receive tokens
- `fundedAmount` tracks progress
- `status` enum for lifecycle

### 2. ReceivableFactory

**Purpose:** Create and track receivable tokens.

```solidity
contract ReceivableFactory {
    // ─── Admin ───
    address public owner;
    address public treasury;          // Fee collection address
    uint256 public feeAmount;         // Flat fee in USDC (1 USDC = 1e6)
    
    // ─── Storage ───
    mapping(address => address[]) public issuers;      // issuer → tokens
    mapping(address => bool) public isReceivable;      // token → is valid
    mapping(address => uint256) public totalValue;     // issuer → total receivable value
    uint256 public collectedFees;                      // Total fees in contract
    
    // ─── Events ───
    event ReceivableCreated(
        address indexed token,
        address indexed issuer,
        string name,
        uint256 amount,
        uint256 interestRate,
        uint256 expiresAt
    );
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeesWithdrawn(address indexed treasury, uint256 amount);
    
    // ─── Functions ───
    function createReceivable(
        string memory name,
        string memory receivableType,
        uint256 amount,
        uint256 interestRate,      // Basis points (2000 = 20%)
        uint256 minInvestment,     // Minimum per investor
        uint256 expiresAt,         // Timestamp
        bytes32[] memory proofs    // Multiple merkle roots
    ) external payable returns (address);
    
    // ─── Admin ───
    function setFee(uint256 _feeAmount) external;       // Owner only
    function setTreasury(address _treasury) external;   // Owner only
    function withdrawFees() external;                   // Owner only → treasury
    
    // ─── View ───
    function getReceivables(address issuer) external view returns (address[]);
    function getReceivablesCount(address issuer) external view returns (uint256);
    function getTotalValue(address issuer) external view returns (uint256);
    function isReceivableToken(address token) external view returns (bool);
    function getCollectedFees() external view returns (uint256);
}
```

### 3. GojiProof (Existing)

```solidity
contract GojiProof {
    mapping(bytes32 => DocumentRecord) public documents;
    mapping(bytes32 => bytes32) public connectionToRoot;
    
    function anchorRoot(bytes32 merkleRoot, bytes32 connectionId) external;
    function getDocument(bytes32 merkleRoot) external view returns (DocumentRecord memory);
    function isAnchored(bytes32 merkleRoot) external view returns (bool);
}
```

---

## Funding Flow

### Step 0: Platform Fee (Flat Fee)

```
Company pays flat fee when creating receivable:
  - Default: 1 USDC per receivable
  - Admin configurable via setFee()
  - Fees collected in factory contract
  - Admin withdraws to treasury via withdrawFees()
```

### Step 1: Company Creates Receivable

```
Company calls:
  ReceivableFactory.createReceivable{value: 1e6}(
    name: "Invoice #123",
    type: "invoice",
    amount: 10000 * 1e6,        // 10,000 USDC
    interestRate: 2000,          // 20%
    minInvestment: 100 * 1e6,    // 100 USDC
    expiresAt: block.timestamp + 90 days,
    proofs: [proof1, proof2, proof3]
  )
         ↓
ReceivableToken deployed:
  - 1,000,000 tokens minted (but held by contract)
  - No tokens sent to issuer
  - Fee collected: 1 USDC
  - Status = Active
```

### Step 2: Financial Partner Funds

```
Partner calls:
  ReceivableToken.finance() { value: 5000e6 }  // 5,000 USDC (native on Arc)
         ↓
Logic:
  1. Check status == Active
  2. Check not expired
  3. Check msg.value >= minInvestment
  4. Calculate tokens: (msg.value / totalReceivable) * totalSupply
     - 5000 / 10000 * 1,000,000 = 500,000 tokens
  5. USDC stays in contract (native on Arc)
  6. Update fundedAmount
  7. Update tokenBalances[partner]
  8. If fundedAmount >= totalReceivable → status = Funded
```

### Step 3: Company Repays (At Expiry)

```
Company calls:
  ReceivableToken.claimRepayment() { value: 12000e6 }  // 12,000 USDC (native)
         ↓
Logic:
  1. Check status == Funded or Active
  2. Check block.timestamp >= expiresAt
  3. Calculate repayment needed:
     - totalReceivable + (totalReceivable * interestRate / 10000)
     - 10000 + (10000 * 2000 / 10000) = 12000 USDC
  4. Check msg.value >= repaymentNeeded
  5. USDC stored in contract
  6. Status = Redeemed (ready for partners to claim)
```

### Step 4: Partner Redeems

```
Partner calls:
  ReceivableToken.redeem()
         ↓
Logic:
  1. Check status == Redeemed
  2. Get partner's token balance: 500,000
  3. Calculate share:
     - (tokenBalance / totalSupply) * contractBalance
     - (500,000 / 1,000,000) * 12,000 = 6,000 USDC
  4. Transfer USDC to partner (native on Arc)
  5. Burn tokens
  6. Status = Defaulted if company doesn't pay
```

---

## Fee Model

### Flat Fee (Platform Revenue)

| Parameter | Default | Notes |
|-----------|---------|-------|
| Fee Amount | 1 USDC (18 decimals) | Configurable by admin |
| Fee Payer | Company (Issuer) | Pays when creating receivable |
| Fee Timing | At Creation | Before token is deployed |
| Collection | Factory Contract | Accumulates until withdrawal |
| Treasury | Configurable | Admin sets withdrawal address |

### Admin Functions

```solidity
function setFee(uint256 _feeAmount) external;       // Change fee amount
function setTreasury(address _treasury) external;   // Change fee recipient
function withdrawFees() external;                   // Withdraw to treasury
```

### Fee Flow

```
Company calls createReceivable{value: 1e6}
         ↓
Factory collects 1 USDC fee
         ↓
Fee stays in factory contract
         ↓
Admin calls withdrawFees()
         ↓
USDC sent to treasury address
```

---

## Token Economics

### Default Parameters

| Parameter | Default | Notes |
|-----------|---------|-------|
| Total Supply | 1,000,000 | Per receivable token |
| Interest Rate | 20% (2000 bps) | Set by company |
| Min Investment | 100 USDC | Set by company |
| Expiry | 90 days | Set by company |
| Token Ratio | 1:1 with USD | 1 token = $0.001 |

### Example: $10,000 Invoice at 20% Interest

| Investor | Funded | Tokens | % | At Expiry (12k) |
|----------|--------|--------|---|-----------------|
| Partner A | $5,000 | 500,000 | 50% | $6,000 |
| Partner B | $3,000 | 300,000 | 30% | $3,600 |
| Partner C | $2,000 | 200,000 | 20% | $2,400 |
| **Total** | **$10,000** | **1,000,000** | **100%** | **$12,000** |

---

## Status Lifecycle

```
Active → Funded → Redeemed
  ↓        ↓
Expired  Defaulted (if no repayment)
```

| Status | Description |
|--------|-------------|
| Active | Accepting investments |
| Funded | Fully funded, waiting for repayment |
| Expired | Past expiry date, waiting for company to pay |
| Redeemed | Company paid, partners can redeem |
| Defaulted | Company didn't pay by deadline |

---

## UI Pages

### Company (Employer)

**Sidebar:** Receivables (expandable)
```
/start/receivables
├── /start/receivables/list       — My receivables table
├── /start/receivables/create     — Create from verified payments
└── /start/receivables/[id]       — View details + financing status
```

**Create Flow:**
1. Select verified payments (checkboxes, payments with merkleRoot)
2. Enter name, select type (invoice/payroll/contractor)
3. Set terms: amount, interest rate, min investment, expiry
4. Confirm → calls `createReceivable` with multiple proofs

### Financial Partner

**Sidebar:** 3 separate pages
```
/start/available-receivables — Browse all, filter by type/status
/start/due-diligence         — Verify proofs, check history
/start/funding               — Fund, track portfolio
```

### Public RWA Explorer

**Standalone:** `/rwa` (no wallet required)
```
/rwa           — List all tokens (read-only)
/rwa/[address] — Token details, terms, status
```

---

## Deployment

### Contracts

| Contract | Address |
|----------|---------|
| GojiProof | `0x9465a4C246D44F32F391Ebda165Acb12886746Ca` |
| ReceivableFactory | `0x6F2979De8B541840E2E91321D6772D94Ed91d700` |
| PriceOracle | TBD |

### Scripts

| Script | Purpose |
|--------|---------|
| 1-DeployTokens.sol | Deploy RWA tokens |
| 2-DeployOracles.sol | Deploy price oracles |
| 3-DeployProof.sol | Deploy GojiProof |
| 4-DeployReceivable.sol | Deploy ReceivableFactory |

---

## Security

1. **Proof verification** — Multiple proofs as collateral
2. **Issuer verification** — Only proof submitter can create receivable
3. **Interest accrual** — On-chain calculation, no manipulation
4. **Expiry enforcement** — Timestamp-based, not duration
5. **Default protection** — Partners can claim if company doesn't pay
6. **Proportional redemption** — Based on token balance (snapshot at repayment)
7. **Fee admin** — Only owner can change fee/treasury, preventing unauthorized changes
8. **Fee collection** — Flat fee collected before token creation, guaranteed revenue

---

## Frontend Files

### New Files

| File | Purpose |
|------|---------|
| `frontend/lib/receivableFactory.ts` | ABI for ReceivableFactory |
| `frontend/lib/receivableToken.ts` | ABI for ReceivableToken |
| `frontend/app/start/receivables/layout.tsx` | Sub-menu layout |
| `frontend/app/start/receivables/page.tsx` | Redirect to list |
| `frontend/app/start/receivables/list/page.tsx` | Company's receivables table |
| `frontend/app/start/receivables/create/page.tsx` | Create receivable |
| `frontend/app/start/receivables/[id]/page.tsx` | View details |
| `frontend/app/rwa/layout.tsx` | Public layout |
| `frontend/app/rwa/page.tsx` | Public RWA Explorer |
| `frontend/app/rwa/[address]/page.tsx` | Token details |

### Modified Files

| File | Changes |
|------|---------|
| `frontend/app/start/layout.tsx` | Add Receivables sub-menu, RWA link |
| `frontend/app/start/available-receivables/page.tsx` | Implement browse page |
| `frontend/app/start/due-diligence/page.tsx` | Implement verification |
| `frontend/app/start/funding/page.tsx` | Implement funding + portfolio |

---

## Next Steps

1. ~~Rewrite `ReceivableToken.sol` with new architecture~~ ✓
2. ~~Rewrite `ReceivableFactory.sol` with new parameters~~ ✓
3. ~~Add flat fee model to factory~~ ✓
4. ~~Deploy to Arc Testnet~~ ✓
5. Create ABI files in `frontend/lib/`
6. Implement company receivables pages
7. Implement partner pages
8. Implement public RWA Explorer

---

## 3-Phase UI Implementation Plan

### Data Sources

| Source | Data |
|--------|------|
| **P2P (flow-status API)** | Flow name, route details (from/to card titles, amount, docName), merkleRoot, payslipHtml |
| **On-chain (ReceivableFactory)** | Token addresses per issuer, total value |
| **On-chain (ReceivableToken)** | Token info: type, proofs, terms, status, fundedAmount, investor balances |

**Key Insight:** Company creates receivable from P2P data (flows with merkleRoot). Once token is minted, all data comes from on-chain. Partners combine P2P (details) + on-chain (verification).

---

### Phase 1: Company View

**Goal:** Company sees pending/settled flows, selects proofs, creates receivable tokens.

#### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Receivables Layout | `/start/receivables` | Sidebar sub-menu (List, Create) |
| My Receivables | `/start/receivables/list` | Table of issued tokens |
| Create Receivable | `/start/receivables/create` | Select proofs → set terms → mint |
| Receivable Detail | `/start/receivables/[id]` | View token status, investors, repayment |

#### Create Flow (Step by Step)

```
Step 1: Select Proofs
  - Fetch all boards → fetch flow-status per board
  - Filter: status === 'settled' && merkleRoot exists
  - Show table: Date | Flow Name | Document | From | To | Amount | Proof Hash
  - Checkboxes to select which proofs to include
  - "Select All" button

Step 2: Set Terms
  - Receivable Name: "Invoice #123"
  - Type: dropdown (invoice / payroll / contractor)
  - Amount: USDC input (total receivable value)
  - Interest Rate: % input (default 20%)
  - Min Investment: USDC input (default 100)
  - Expiry: date picker (default 90 days from now)

Step 3: Review & Pay
  - Summary: name, type, proofs count, amount, interest, expiry
  - Fee: 1 USDC
  - Total cost: 1 USDC (fee)
  - "Create Receivable" button → calls createReceivable{value: fee}
  - On success: redirect to /start/receivables/[id]
```

#### My Receivables List

| Column | Source |
|--------|--------|
| Name | token.name() |
| Type | token.receivableType() |
| Amount | token.totalReceivable() |
| Interest | token.interestRate() |
| Funded | token.fundedAmount() / totalReceivable |
| Status | token.status() |
| Expires | token.expiresAt() |
| Action | View |

Status badges:
- Active (blue) — Accepting investments
- Funded (green) — Fully funded
- Expired (amber) — Waiting for repayment
- Redeemed (mint) — Company paid, partners can redeem
- Defaulted (red) — Company didn't pay

#### Receivable Detail

- Header: Name, Type, Status badge
- Terms card: Amount, Interest, Min Investment, Expiry, Proofs
- Proof list: Clickable merkle roots → Proof Explorer
- Funding progress bar: fundedAmount / totalReceivable
- Investors table: Address, Funded Amount, Tokens, % (from on-chain events)
- Actions:
  - If Active/Funded + expired: "Claim Repayment" button (sends USDC)
  - If Redeemed: "Fully Redeemed" badge

#### Files

| File | Action |
|------|--------|
| `frontend/lib/receivableFactory.ts` | **Create** — ABI |
| `frontend/lib/receivableToken.ts` | **Create** — ABI |
| `frontend/app/start/receivables/layout.tsx` | **Create** — Sub-menu |
| `frontend/app/start/receivables/page.tsx` | **Update** — Redirect to list |
| `frontend/app/start/receivables/list/page.tsx` | **Create** — Table |
| `frontend/app/start/receivables/create/page.tsx` | **Create** — 3-step wizard |
| `frontend/app/start/receivables/[id]/page.tsx` | **Create** — Detail view |

---

### Phase 2: Financial Partner View

**Goal:** Partner browses receivables, verifies proofs, funds tokens.

#### Pages

| Page | Route | Purpose |
|------|-------|---------|
| Available Receivables | `/start/available-receivables` | Browse all active/funded tokens |
| Due Diligence | `/start/due-diligence` | Verify proofs, check history |
| Funding | `/start/funding` | Fund receivable, track portfolio |

#### Available Receivables

```
- Fetch all token addresses from ReceivableFactory.getReceivables(issuer)
- For each token, call getReceivableInfo()
- Show table: Name | Type | Amount | Interest | Funded | Expires | Status | Action
- Filter: Type (all/invoice/payroll/contractor), Status (all/active/funded)
- Click row → Due Diligence page
```

#### Due Diligence

```
- Receivable info card (from on-chain)
- Proofs section:
  - List of merkle roots
  - Click to verify on GojiProof contract (isAnchored)
  - Show proof details (submitter, timestamp)
- Company info (issuer address)
- Terms review
- "Fund This Receivable" button → Funding page
```

#### Funding

```
- Receivable summary
- Investment input:
  - Amount (USDC)
  - Shows: tokens to receive, % of total, projected return
- Fund button → calls ReceivableToken.finance{value: amount}()
- Portfolio section (funded receivables):
  - Table: Name | Funded | Tokens | % | Status | Action
  - Action: "Redeem" if status === Redeemed
```

#### Files

| File | Action |
|------|--------|
| `frontend/app/start/available-receivables/page.tsx` | **Update** — Table with filters |
| `frontend/app/start/due-diligence/page.tsx` | **Update** — Proof verification |
| `frontend/app/start/funding/page.tsx` | **Update** — Fund + portfolio |

---

### Phase 3: Public RWA Explorer

**Goal:** Public users view all receivable assets (no wallet required).

#### Pages

| Page | Route | Purpose |
|------|-------|---------|
| RWA Explorer | `/rwa` | List all tokens |
| Token Detail | `/rwa/[address]` | View token details |

#### RWA Explorer

```
- No auth required
- Fetch all token addresses from ReceivableFactory
- Show table: Name | Type | Amount | Interest | Funded | Status | Issuer
- Issuer shown as shortened address (0x36bB...92F5)
- Click row → Token Detail page
```

#### Token Detail

```
- Token info card (all fields from getReceivableInfo)
- Proof hashes list
- Funding progress bar
- Status badge
- Link to Arc Explorer (address)
- No fund/redeem buttons (read-only)
```

#### Files

| File | Action |
|------|--------|
| `frontend/app/rwa/layout.tsx` | **Create** — Public layout (no auth) |
| `frontend/app/rwa/page.tsx` | **Create** — Explorer table |
| `frontend/app/rwa/[address]/page.tsx` | **Create** — Detail view |

---

### Shared Components

| Component | Purpose |
|-----------|---------|
| `ReceivableStatusBadge.tsx` | Status badge (Active/Funded/Expired/Redeemed/Defaulted) |
| `ReceivableProofList.tsx` | List of merkle roots with verify button |
| `ReceivableFundingProgress.tsx` | Progress bar (funded / total) |
| `ReceivableTermsCard.tsx` | Terms display (amount, interest, min, expiry) |

---

### Data Flow Diagram

```
Phase 1 (Company):
  P2P (flow-status) → Select Proofs → Set Terms → ReceivableFactory.createReceivable()
  → ReceivableToken deployed → Listed in My Receivables

Phase 2 (Partner):
  ReceivableFactory.getReceivables() → ReceivableToken.getReceivableInfo()
  + P2P (flow-status for proof details) → Due Diligence → Finance
  → ReceivableToken.finance{value}() → Tokens minted

Phase 3 (Public):
  ReceivableFactory.getReceivables() → ReceivableToken.getReceivableInfo()
  → Read-only display
```

---

### Implementation Order

1. **Create ABI files** (`lib/receivableFactory.ts`, `lib/receivableToken.ts`)
2. **Phase 1: Company** — Layout → Create → List → Detail
3. **Phase 2: Partner** — Available → Due Diligence → Funding
4. **Phase 3: Public** — RWA Explorer → Detail
5. **Shared components** — Extract after Phase 1 is complete
