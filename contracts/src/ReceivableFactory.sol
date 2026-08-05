// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ReceivableToken.sol";

/// @title ReceivableFactory
/// @notice Factory for creating ReceivableToken contracts
/// @dev Companies create receivables using their verified payment proofs
contract ReceivableFactory {
    // ──────────────────────────── Events ────────────────────────────────
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

    // ──────────────────────────── Storage ───────────────────────────────
    address public owner;
    address public treasury;          // Fee collection address
    uint256 public feeAmount;         // Flat fee in USDC (1 USDC = 1e6)

    mapping(address => address[]) public issuers;      // issuer => tokens[]
    mapping(address => bool) public isReceivable;      // token => is valid
    mapping(address => uint256) public totalValue;     // issuer => total receivable value
    uint256 public collectedFees;                      // Total fees collected in contract

    // ──────────────────────────── Constructor ───────────────────────────
    constructor(address _treasury, uint256 _feeAmount) {
        owner = msg.sender;
        treasury = _treasury;
        feeAmount = _feeAmount;
    }

    // ──────────────────────────── Core Functions ────────────────────────

    /// @notice Create a new receivable token
    /// @param name Token name (e.g., "Invoice #123")
    /// @param receivableType Type of receivable ("invoice", "payroll", "contractor")
    /// @param amount Receivable amount in USDC (e.g., 10000e6 for $10,000)
    /// @param interestRate Interest rate in basis points (2000 = 20%)
    /// @param minInvestment Minimum investment per investor (USDC)
    /// @param expiresAt Expiration timestamp
    /// @param proofs Array of merkle roots from GojiProof
    function createReceivable(
        string memory name,
        string memory receivableType,
        uint256 amount,
        uint256 interestRate,
        uint256 minInvestment,
        uint256 expiresAt,
        bytes32[] memory proofs
    ) external payable returns (address) {
        require(amount > 0, "Zero amount");
        require(proofs.length > 0, "No proofs");
        require(msg.value >= feeAmount, "Insufficient fee");

        // Create token
        ReceivableToken token = new ReceivableToken(
            name,
            receivableType,
            amount,
            interestRate,
            minInvestment,
            expiresAt,
            proofs,
            msg.sender  // Pass company address as issuer
        );

        address tokenAddress = address(token);
        issuers[msg.sender].push(tokenAddress);
        isReceivable[tokenAddress] = true;
        totalValue[msg.sender] += amount;
        collectedFees += feeAmount;

        emit ReceivableCreated(tokenAddress, msg.sender, name, amount, interestRate, expiresAt);

        return tokenAddress;
    }

    /// @notice Create a receivable with optional identity eligibility checks.
    function createReceivableWithCompliance(
        string memory name,
        string memory receivableType,
        uint256 amount,
        uint256 interestRate,
        uint256 minInvestment,
        uint256 expiresAt,
        bytes32[] memory proofs,
        address complianceRegistry,
        uint8 requiredTier
    ) external payable returns (address) {
        require(amount > 0, "Zero amount");
        require(proofs.length > 0, "No proofs");
        require(msg.value >= feeAmount, "Insufficient fee");

        ReceivableToken token = new ReceivableToken(
            name,
            receivableType,
            amount,
            interestRate,
            minInvestment,
            expiresAt,
            proofs,
            msg.sender
        );
        token.setCompliancePolicy(complianceRegistry, requiredTier);

        address tokenAddress = address(token);
        issuers[msg.sender].push(tokenAddress);
        isReceivable[tokenAddress] = true;
        totalValue[msg.sender] += amount;
        collectedFees += feeAmount;

        emit ReceivableCreated(tokenAddress, msg.sender, name, amount, interestRate, expiresAt);
        return tokenAddress;
    }

    // ──────────────────────────── Admin Functions ───────────────────────

    /// @notice Set the flat fee amount
    function setFee(uint256 _feeAmount) external {
        require(msg.sender == owner, "Not owner");
        emit FeeUpdated(feeAmount, _feeAmount);
        feeAmount = _feeAmount;
    }

    /// @notice Set the treasury address
    function setTreasury(address _treasury) external {
        require(msg.sender == owner, "Not owner");
        require(_treasury != address(0), "Zero address");
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    /// @notice Withdraw collected fees to treasury
    function withdrawFees() external {
        require(msg.sender == owner, "Not owner");
        uint256 amount = collectedFees;
        require(amount > 0, "No fees to withdraw");

        collectedFees = 0;
        (bool success, ) = treasury.call{value: amount}("");
        require(success, "Transfer failed");

        emit FeesWithdrawn(treasury, amount);
    }

    // ──────────────────────────── View Functions ────────────────────────

    /// @notice Get all receivables for an issuer
    function getReceivables(address issuer) external view returns (address[] memory) {
        return issuers[issuer];
    }

    /// @notice Check if address is a receivable token
    function isReceivableToken(address token) external view returns (bool) {
        return isReceivable[token];
    }

    /// @notice Get total receivables count for an issuer
    function getReceivablesCount(address issuer) external view returns (uint256) {
        return issuers[issuer].length;
    }

    /// @notice Get total receivable value for an issuer
    function getTotalValue(address issuer) external view returns (uint256) {
        return totalValue[issuer];
    }

    /// @notice Get total fees collected
    function getCollectedFees() external view returns (uint256) {
        return collectedFees;
    }
}
