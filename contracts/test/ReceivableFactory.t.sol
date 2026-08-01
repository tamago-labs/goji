// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ReceivableFactory.sol";

contract ReceivableFactoryTest is Test {
    ReceivableFactory public factory;
    address public issuer;
    bytes32 public proofHash;

    function setUp() public {
        issuer = makeAddr("issuer");
        proofHash = keccak256("test-proof");
        factory = new ReceivableFactory();
    }

    function test_createReceivable() public {
        vm.prank(issuer);
        address token = factory.createReceivable(
            "Invoice #123",
            "invoice",
            10000 * 1e18,
            proofHash
        );
        
        assertTrue(factory.isReceivable(token));
        assertEq(factory.getReceivablesCount(issuer), 1);
    }

    function test_getReceivables() public {
        vm.startPrank(issuer);
        factory.createReceivable("Invoice #1", "invoice", 5000 * 1e18, proofHash);
        factory.createReceivable("Invoice #2", "invoice", 3000 * 1e18, proofHash);
        vm.stopPrank();
        
        address[] memory receivables = factory.getReceivables(issuer);
        assertEq(receivables.length, 2);
    }

    function test_revertZeroAmount() public {
        vm.prank(issuer);
        vm.expectRevert("Zero amount");
        factory.createReceivable("Invoice #123", "invoice", 0, proofHash);
    }

    function test_receivableTypes() public {
        vm.startPrank(issuer);
        address invoice = factory.createReceivable("Invoice", "invoice", 1000 * 1e18, proofHash);
        address payroll = factory.createReceivable("Payroll", "payroll", 2000 * 1e18, proofHash);
        address contractor = factory.createReceivable("Contractor", "contractor", 3000 * 1e18, proofHash);
        vm.stopPrank();
        
        assertTrue(factory.isReceivable(invoice));
        assertTrue(factory.isReceivable(payroll));
        assertTrue(factory.isReceivable(contractor));
        assertEq(factory.getReceivablesCount(issuer), 3);
    }
}
