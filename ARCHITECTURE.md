# Goji Smart Contract Architecture: RWA Issuance & Distribution

## Overview

Goji transforms verified payment records into real-world assets (RWAs) that can be financed, traded, or used as collateral. This document outlines the smart contract architecture for RWA issuance and distribution using a hybrid approach with fractional financing.

---

## The Pipeline

```
Payment Activity
      ↓
Private Workspace (P2P)
      ↓
Settlement on Arc
      ↓
Proof Generation (GojiProof)
      ↓
Receivable Token Issuance
      ↓
Financial Partners Fund
      ↓
Returns on Settlement
```

---

## Smart Contracts

### 1. GojiProof (Existing)

**Purpose:** Store Merkle roots for payment verification.

```solidity
contract GojiProof {
    mapping(bytes32 => DocumentRecord) public documents;
    mapping(bytes32 => bytes32) public connectionToRoot;
    
    function anchorRoot(bytes32 merkleRoot, bytes32 connectionId) external;
    function getDocument(bytes32 merkleRoot) external view returns (DocumentRecord memory);
    function getRootByConnection(bytes32 connectionId) external view returns (bytes32);
}
```

### 2. GojiProof → ReceivableToken Relationship

**Ownership Model: Submitter-Based**

The person who anchors the proof (submitter) can issue tokens from that proof.

```
Company submits proof → Company can issue tokens
Financial partner verifies → Cannot issue tokens
```

**Flow:**
```
1. Company calls GojiProof.anchorRoot(merkleRoot, connectionId)
2. Proof stored with submitter = company address
3. Company calls ReceivableFactory.createReceivable()
4. Factory checks: submitter == msg.sender?
5. If yes → ReceivableToken minted
6. If no → revert
```

**Security:**
- Only the proof submitter can issue tokens
- Financial partners can verify but cannot issue
- Clear separation of concerns

### 3. ReceivableToken (New)

**Purpose:** ERC-20 token representing a verified receivable.

```solidity
contract ReceivableToken {
    // Token metadata
    string public name;
    string public symbol;
    uint8 public decimals;
    
    // Receivable data
    address public issuer;
    string public receivableType;  // "invoice", "payroll", "contractor"
    bytes32 public proofHash;      // Merkle root from GojiProof
    uint256 public amount;
    uint256 public issuedAt;
    uint256 public expiresAt;
    
    // Financing
    address public financier;
    uint256 public financedAt;
    bool public isFinanced;
    
    // Functions
    function issue(address to, uint256 amount, bytes32 proofHash) external;
    function finance(address financier) external;
    function redeem() external;
}
```

### 3. ReceivableFactory (New)

**Purpose:** Create new receivable tokens.

```solidity
contract ReceivableFactory {
    function createReceivable(
        string memory name,
        string memory receivableType,
        uint256 amount,
        bytes32 proofHash
    ) external returns (address);
    
    function getReceivables(address issuer) external view returns (address[]);
}
```

---

## Flow: Company Receives Payment

```
Month 1: Invoice → $10k → Settled on Arc
Month 2: Invoice → $10k → Settled on Arc
Month 3: Invoice → $10k → Settled on Arc
         ↓
Company has 3 settled invoices ($30k total)
         ↓
Company calls ReceivableFactory.createReceivable()
         ↓
ReceivableToken minted ($30k receivable)
         ↓
Token stored on Arc with proof
```

---

## Flow: Financial Partner Funds

```
Financial partner sees receivable token
         ↓
Reviews proof (GojiProof.verifyRoot)
         ↓
Evaluates receivable risk
         ↓
Calls ReceivableToken.finance()
         ↓
Funds transferred to company
         ↓
When payments settle, partner receives returns
```

---

## Financing Terms

### Investment Parameters

| Term | Value | Notes |
|------|-------|-------|
| Minimum investment | $100 | Accessible to small investors |
| Maximum investment | Invoice amount | No over-funding |
| Interest rate | 0-20% | Set by company per invoice |
| Duration | 30-90 days | Set by company |
| Early redemption | Allowed | With penalty (5-10%) |

### Example: $10,000 Invoice

| Stage | Action | Amount |
|-------|--------|--------|
| Creation | Company creates invoice | $10,000 |
| Financing | Investor A funds | $3,000 (30%) |
| Financing | Investor B funds | $2,000 (20%) |
| Total funded | — | $5,000 (50%) |
| Settlement | Client pays | $10,000 |
| Returns | Investor A gets back | $3,240 ($3,000 + 8%) |
| Returns | Investor B gets back | $2,160 ($2,000 + 8%) |

### Token Economics

| Parameter | Value |
|-----------|-------|
| Token ratio | 1:1 with USD |
| Minimum purchase | $100 |
| Maximum purchase | Invoice amount |
| Interest rate | 0-20% (set by company) |
| Duration | 30-90 days |
| Early redemption | Allowed with 5-10% penalty |

---

## Integration with Canvas

```
Company creates invoice on canvas
        ↓
Invoice template selected
        ↓
Amount, recipient, documents filled
        ↓
Connection saved with template
        ↓
When flow runs:
  1. Payment settled on Arc
  2. GojiProof stores Merkle root
  3. ReceivableToken minted (if threshold met)
  4. Token available for financing
```

---

## Deployment

### Contracts

| Contract | Purpose |
|----------|---------|
| GojiProof | Store Merkle roots |
| ReceivableToken | ERC-20 for receivables |
| ReceivableFactory | Create receivables |

### Scripts

| Script | Purpose |
|--------|---------|
| 1-DeployTokens.sol | Deploy RWA tokens |
| 2-DeployOracles.sol | Deploy price oracles |
| 3-DeployProof.sol | Deploy GojiProof |
| 4-DeployReceivable.sol | Deploy ReceivableToken + Factory |

---

## Security

1. **Proof verification** — Verify Merkle roots before financing
2. **Role-based access** — Only companies create receivables
3. **Expiry** — Receivables expire after 90 days
4. **Audit trail** — All actions logged on-chain
5. **Early redemption penalty** — 5-10% penalty for early exit

---

## Next Steps

1. Implement ReceivableToken contract
2. Implement ReceivableFactory contract
3. Add deployment script
4. Integrate with frontend
5. Add financing flow UI
