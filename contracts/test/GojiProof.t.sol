// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GojiProof.sol";

contract GojiProofTest is Test {
    GojiProof public proof;
    address public owner;

    // Generate real Merkle roots from field data
    function _hashFields(string memory amount, string memory recipient, string memory date) internal pure returns (bytes32) {
        bytes32 h1 = keccak256(abi.encodePacked(amount));
        bytes32 h2 = keccak256(abi.encodePacked(recipient));
        bytes32 h3 = keccak256(abi.encodePacked(date));
        return keccak256(abi.encodePacked(h1, h2, h3));
    }

    bytes32 public ROOT_1;
    bytes32 public ROOT_2;
    bytes32 public CONNECTION_1 = keccak256("connection1");
    bytes32 public CONNECTION_2 = keccak256("connection2");

    function setUp() public {
        owner = address(this);
        proof = new GojiProof();
        // Generate real Merkle roots from field data
        ROOT_1 = _hashFields("1000", "John Doe", "2026-01-15");
        ROOT_2 = _hashFields("2500", "Jane Smith", "2026-01-20");
    }

    function test_anchorRoot() public {
        uint256 timestamp = proof.anchorRoot(ROOT_1, CONNECTION_1);
        assertTrue(timestamp > 0, "Timestamp should be set");
        assertTrue(proof.isAnchored(ROOT_1), "Root should be anchored");
    }

    function test_getDocument() public {
        proof.anchorRoot(ROOT_1, CONNECTION_1);
        GojiProof.DocumentRecord memory doc = proof.getDocument(ROOT_1);
        
        assertEq(doc.merkleRoot, ROOT_1, "Merkle root mismatch");
        assertEq(doc.connectionId, CONNECTION_1, "Connection ID mismatch");
        assertEq(doc.submitter, owner, "Submitter mismatch");
        assertTrue(doc.timestamp > 0, "Timestamp should be set");
    }

    function test_getRootByConnection() public {
        proof.anchorRoot(ROOT_1, CONNECTION_1);
        bytes32 root = proof.getRootByConnection(CONNECTION_1);
        assertEq(root, ROOT_1, "Root mismatch");
    }

    function test_isAnchored() public {
        assertFalse(proof.isAnchored(ROOT_1), "Should not be anchored");
        proof.anchorRoot(ROOT_1, CONNECTION_1);
        assertTrue(proof.isAnchored(ROOT_1), "Should be anchored");
    }

    function test_hasDocument() public {
        assertFalse(proof.hasDocument(CONNECTION_1), "Should not have document");
        proof.anchorRoot(ROOT_1, CONNECTION_1);
        assertTrue(proof.hasDocument(CONNECTION_1), "Should have document");
    }

    function test_revertOnDuplicateRoot() public {
        proof.anchorRoot(ROOT_1, CONNECTION_1);
        vm.expectRevert("Root already anchored");
        proof.anchorRoot(ROOT_1, CONNECTION_2);
    }

    function test_revertOnZeroRoot() public {
        vm.expectRevert("Zero merkle root");
        proof.anchorRoot(bytes32(0), CONNECTION_1);
    }

    function test_revertOnZeroConnection() public {
        vm.expectRevert("Zero connection ID");
        proof.anchorRoot(ROOT_1, bytes32(0));
    }

    function test_revertOnNonExistentRoot() public {
        vm.expectRevert("Document not found");
        proof.getDocument(ROOT_1);
    }

    function test_revertOnNonExistentConnection() public {
        vm.expectRevert("No document for this connection");
        proof.getRootByConnection(CONNECTION_1);
    }

    function test_multipleDocuments() public {
        proof.anchorRoot(ROOT_1, CONNECTION_1);
        proof.anchorRoot(ROOT_2, CONNECTION_2);
        
        assertTrue(proof.isAnchored(ROOT_1));
        assertTrue(proof.isAnchored(ROOT_2));
        assertEq(proof.getRootByConnection(CONNECTION_1), ROOT_1);
        assertEq(proof.getRootByConnection(CONNECTION_2), ROOT_2);
    }
}
