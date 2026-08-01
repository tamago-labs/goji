// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ReceivableToken.sol";

/// @title ReceivableFactory
/// @notice Factory for creating ReceivableToken contracts
/// @dev Only the proof submitter can create receivables
contract ReceivableFactory {
    // ──────────────────────────── Events ────────────────────────────────
    event ReceivableCreated(address indexed token, address indexed issuer, string name, uint256 amount);

    // ──────────────────────────── Storage ───────────────────────────────
    address public owner;
    mapping(address => address[]) public issuers; // issuer => tokens[]
    mapping(address => bool) public isReceivable;

    // ──────────────────────────── Constructor ───────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ──────────────────────────── Core Functions ────────────────────────

    /// @notice Create a new receivable token
    /// @param name Token name (e.g., "Invoice #123")
    /// @param receivableType Type of receivable ("invoice", "payroll", "contractor")
    /// @param amount Token amount (1:1 with USD)
    /// @param proofHash Merkle root from GojiProof
    function createReceivable(
        string memory name,
        string memory receivableType,
        uint256 amount,
        bytes32 proofHash
    ) external returns (address) {
        require(amount > 0, "Zero amount");
        
        // Create token
        ReceivableToken token = new ReceivableToken(
            name,
            _generateSymbol(receivableType),
            receivableType,
            amount,
            proofHash
        );
        
        address tokenAddress = address(token);
        issuers[msg.sender].push(tokenAddress);
        isReceivable[tokenAddress] = true;
        
        emit ReceivableCreated(tokenAddress, msg.sender, name, amount);
        
        return tokenAddress;
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

    // ──────────────────────────── Internal Functions ───────────────────

    function _generateSymbol(string memory receivableType) internal pure returns (string memory) {
        if (keccak256(bytes(receivableType)) == keccak256(bytes("invoice"))) {
            return "GOJINV";
        } else if (keccak256(bytes(receivableType)) == keccak256(bytes("payroll"))) {
            return "GOJPAY";
        } else if (keccak256(bytes(receivableType)) == keccak256(bytes("contractor"))) {
            return "GOJCONT";
        }
        return "GOJRWA";
    }
}
