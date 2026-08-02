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
| Fee Amount | 1 USDC | Configurable by admin |
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
| ReceivableFactory | `0xE175A675875c083f57CFAe12171b9F1C1374EC84` |
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
4. Deploy to Arc Testnet
5. Create ABI files in `frontend/lib/`
6. Implement company receivables pages
7. Implement partner pages
8. Implement public RWA Explorer
