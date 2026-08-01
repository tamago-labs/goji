// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReceivableToken
/// @notice ERC-20 token representing a verified receivable from Goji
/// @dev Each token represents a claim on a settled payment
contract ReceivableToken is ERC20, Ownable {
    // ──────────────────────────── Events ────────────────────────────────
    event ReceivableIssued(address indexed to, uint256 amount, bytes32 proofHash);
    event ReceivableFunded(address indexed investor, uint256 amount);
    event ReceivableRedeemed(address indexed redeemer, uint256 amount);

    // ──────────────────────────── Storage ───────────────────────────────
    string public receivableType;  // "invoice", "payroll", "contractor"
    bytes32 public proofHash;      // Merkle root from GojiProof
    uint256 public issuedAt;
    uint256 public expiresAt;
    
    // Financing
    address public financier;
    uint256 public financedAt;
    bool public isFinanced;
    
    // Configuration
    uint256 public constant EXPIRY_PERIOD = 90 days;
    uint256 public constant MIN_INVESTMENT = 100 * 1e18; // $100

    // ──────────────────────────── Constructor ───────────────────────────
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _receivableType,
        uint256 _amount,
        bytes32 _proofHash
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        receivableType = _receivableType;
        proofHash = _proofHash;
        issuedAt = block.timestamp;
        expiresAt = block.timestamp + EXPIRY_PERIOD;
        
        // Mint tokens to issuer
        _mint(msg.sender, _amount);
    }

    // ──────────────────────────── Core Functions ────────────────────────

    /// @notice Finance this receivable
    function finance() external payable {
        require(!isFinanced, "Already financed");
        require(block.timestamp < expiresAt, "Receivable expired");
        require(msg.value >= MIN_INVESTMENT, "Below minimum investment");
        
        financier = msg.sender;
        financedAt = block.timestamp;
        isFinanced = true;
        
        emit ReceivableFunded(msg.sender, msg.value);
    }

    /// @notice Redeem tokens after payment settles
    function redeem() external {
        require(isFinanced, "Not financed");
        require(msg.sender == financier, "Not financier");
        
        isFinanced = false;
        
        // Transfer tokens back to financier
        _transfer(owner(), msg.sender, balanceOf(owner()));
        
        emit ReceivableRedeemed(msg.sender, balanceOf(msg.sender));
    }

    // ──────────────────────────── View Functions ────────────────────────

    function getReceivableInfo() external view returns (
        string memory _type,
        bytes32 _proofHash,
        uint256 _amount,
        uint256 _issuedAt,
        uint256 _expiresAt,
        bool _isFinanced
    ) {
        _type = receivableType;
        _proofHash = proofHash;
        _amount = totalSupply();
        _issuedAt = issuedAt;
        _expiresAt = expiresAt;
        _isFinanced = isFinanced;
    }
}
