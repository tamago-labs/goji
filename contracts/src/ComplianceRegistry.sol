// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SoulboundIdentityPass.sol";

/// @title ComplianceRegistry
/// @notice Company or pool-specific eligibility policy for Goji identity passes.
/// @dev It stores no passport, bank, or KYC payload. Those remain in the P2P workspace.
contract ComplianceRegistry {
    struct Approval {
        bool approved;
        uint8 tier;
        bytes2 countryCode;
        uint64 expiresAt;
        address approver;
    }

    SoulboundIdentityPass public immutable identityPass;
    address public owner;
    mapping(address => bool) public reviewers;
    mapping(bytes32 => Approval) public approvals;

    event ReviewerUpdated(address indexed reviewer, bool enabled);
    event IdentityApproved(bytes32 indexed passId, address indexed wallet, uint8 tier, bytes2 countryCode, uint64 expiresAt, address approver);
    event IdentityRevoked(bytes32 indexed passId, address indexed wallet, address revoker);

    modifier onlyReviewer() {
        require(msg.sender == owner || reviewers[msg.sender], "Not a reviewer");
        _;
    }

    constructor(address identityPassAddress) {
        require(identityPassAddress != address(0), "Zero identity pass");
        identityPass = SoulboundIdentityPass(identityPassAddress);
        owner = msg.sender;
    }

    function setReviewer(address reviewer, bool enabled) external {
        require(msg.sender == owner, "Not owner");
        reviewers[reviewer] = enabled;
        emit ReviewerUpdated(reviewer, enabled);
    }

    function approveIdentity(address wallet, uint8 tier, bytes2 countryCode, uint64 expiresAt) external onlyReviewer {
        require(identityPass.isValid(wallet), "Invalid identity pass");
        require(countryCode != bytes2(0), "Country required");
        bytes32 passId = identityPass.passIdOf(wallet);
        approvals[passId] = Approval(true, tier, countryCode, expiresAt, msg.sender);
        emit IdentityApproved(passId, wallet, tier, countryCode, expiresAt, msg.sender);
    }

    function revokeIdentity(address wallet) external onlyReviewer {
        bytes32 passId = identityPass.passIdOf(wallet);
        approvals[passId].approved = false;
        emit IdentityRevoked(passId, wallet, msg.sender);
    }

    function isEligible(address wallet, uint8 requiredTier) public view returns (bool) {
        if (!identityPass.isValid(wallet)) return false;
        bytes32 passId = identityPass.passIdOf(wallet);
        Approval memory approval = approvals[passId];
        if (!approval.approved || approval.tier < requiredTier) return false;
        return approval.expiresAt == 0 || block.timestamp <= approval.expiresAt;
    }

    function countryOf(address wallet) external view returns (bytes2) {
        return approvals[identityPass.passIdOf(wallet)].countryCode;
    }

    function isEligibleForCountry(address wallet, uint8 requiredTier, bytes2 countryCode) external view returns (bool) {
        if (!isEligible(wallet, requiredTier)) return false;
        return approvals[identityPass.passIdOf(wallet)].countryCode == countryCode;
    }

    function getApproval(address wallet) external view returns (Approval memory) {
        return approvals[identityPass.passIdOf(wallet)];
    }
}
