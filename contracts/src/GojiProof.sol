// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title GojiProof
/// @notice Stores Merkle roots for document verification on Arc
/// @dev Each document (invoice, payslip, etc.) is hashed and anchored on-chain
contract GojiProof {
    // ──────────────────────────── Events ────────────────────────────────
    event RootAnchored(bytes32 indexed merkleRoot, bytes32 indexed connectionId, address indexed submitter, uint256 timestamp);

    // ──────────────────────────── Storage ───────────────────────────────
    address public owner;

    struct DocumentRecord {
        bytes32 merkleRoot;
        bytes32 connectionId;
        address submitter;
        uint256 timestamp;
    }

    // Merkle root → Document record (for verification)
    mapping(bytes32 => DocumentRecord) public documents;

    // Connection ID → Merkle root (for lookup)
    mapping(bytes32 => bytes32) public connectionToRoot;

    // ──────────────────────────── Constructor ───────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ──────────────────────────── Core Functions ────────────────────────

    /// @notice Anchor a document's Merkle root on-chain
    /// @param merkleRoot The Merkle root of the document
    /// @param connectionId The connection ID linking to the canvas
    /// @return timestamp When the root was anchored
    function anchorRoot(bytes32 merkleRoot, bytes32 connectionId) external returns (uint256 timestamp) {
        require(merkleRoot != bytes32(0), "Zero merkle root");
        require(connectionId != bytes32(0), "Zero connection ID");
        require(documents[merkleRoot].timestamp == 0, "Root already anchored");

        timestamp = block.timestamp;
        documents[merkleRoot] = DocumentRecord({
            merkleRoot: merkleRoot,
            connectionId: connectionId,
            submitter: msg.sender,
            timestamp: timestamp
        });
        connectionToRoot[connectionId] = merkleRoot;

        emit RootAnchored(merkleRoot, connectionId, msg.sender, timestamp);
    }

    // ──────────────────────────── View Functions ────────────────────────

    /// @notice Check if a Merkle root is anchored
    function isAnchored(bytes32 merkleRoot) external view returns (bool) {
        return documents[merkleRoot].timestamp != 0;
    }

    /// @notice Get document record by Merkle root
    function getDocument(bytes32 merkleRoot) external view returns (DocumentRecord memory) {
        require(documents[merkleRoot].timestamp != 0, "Document not found");
        return documents[merkleRoot];
    }

    /// @notice Get Merkle root by connection ID
    function getRootByConnection(bytes32 connectionId) external view returns (bytes32) {
        bytes32 root = connectionToRoot[connectionId];
        require(root != bytes32(0), "No document for this connection");
        return root;
    }

    /// @notice Check if connection has an anchored document
    function hasDocument(bytes32 connectionId) external view returns (bool) {
        return connectionToRoot[connectionId] != bytes32(0);
    }
}
