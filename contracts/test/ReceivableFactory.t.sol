// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ReceivableFactory.sol";

contract ReceivableFactoryTest is Test {
    ReceivableFactory public factory;
    address public issuer;
    address public treasury;
    address public owner;
    bytes32[] public proofHashes;
    bytes2[] public allowedCountries;

    uint256 constant FEE = 1e18; // 1 USDC (18 decimals on Arc)

    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeesWithdrawn(address indexed treasury, uint256 amount);

    function setUp() public {
        owner = address(this);
        issuer = makeAddr("issuer");
        treasury = makeAddr("treasury");
        proofHashes.push(keccak256("proof-1"));
        proofHashes.push(keccak256("proof-2"));
        allowedCountries.push(bytes2("US"));

        vm.deal(issuer, 100_000 * 1e18);
        vm.deal(treasury, 0);

        factory = new ReceivableFactory(treasury, FEE);
    }

    // ── Helpers ──────────────────────────────────────────────

    function _createReceivable() internal returns (address) {
        vm.prank(issuer);
        return factory.createReceivable{value: FEE}(
            "Invoice #123",
            "invoice",
            10000 * 1e6,
            2000,
            100 * 1e6,
            block.timestamp + 90 days,
            proofHashes
        );
    }

    // ── Initial state ────────────────────────────────────────

    function test_initialState() public view {
        assertEq(factory.owner(), owner);
        assertEq(factory.treasury(), treasury);
        assertEq(factory.feeAmount(), FEE);
        assertEq(factory.getCollectedFees(), 0);
    }

    // ── Create with fee ──────────────────────────────────────

    function test_createReceivable() public {
        address token = _createReceivable();

        assertTrue(factory.isReceivable(token));
        assertEq(factory.getReceivablesCount(issuer), 1);
        assertEq(factory.getTotalValue(issuer), 10000 * 1e6);
        assertEq(factory.getCollectedFees(), FEE);
    }

    function test_createReceivableWithComplianceStoresCountries() public {
        bytes2[] memory countries = new bytes2[](2);
        countries[0] = bytes2("US");
        countries[1] = bytes2("TH");

        vm.prank(issuer);
        address tokenAddress = factory.createReceivableWithCompliance{value: FEE}(
            "Compliant invoice",
            "invoice",
            10000 * 1e6,
            2000,
            100 * 1e6,
            block.timestamp + 90 days,
            proofHashes,
            address(1),
            2,
            countries
        );

        ReceivableToken token = ReceivableToken(tokenAddress);
        assertEq(token.complianceRegistry(), address(1));
        assertEq(token.requiredComplianceTier(), 2);
        assertTrue(token.isCountryAllowed(bytes2("US")));
        assertTrue(token.isCountryAllowed(bytes2("TH")));
        assertFalse(token.isCountryAllowed(bytes2("VN")));
    }

    function test_createReceivable_insufficientFee() public {
        vm.prank(issuer);
        vm.expectRevert("Insufficient fee");
        factory.createReceivable(
            "Invoice #123",
            "invoice",
            10000 * 1e6,
            2000,
            100 * 1e6,
            block.timestamp + 90 days,
            proofHashes
        );
    }

    function test_createReceivable_extraFee() public {
        vm.prank(issuer);
        factory.createReceivable{value: FEE * 2}(
            "Invoice #123",
            "invoice",
            10000 * 1e6,
            2000,
            100 * 1e6,
            block.timestamp + 90 days,
            proofHashes
        );

        // Extra fee stays in contract, only feeAmount counted
        assertEq(factory.getCollectedFees(), FEE);
    }

    function test_createReceivable_multiple() public {
        vm.startPrank(issuer);
        factory.createReceivable{value: FEE}("Invoice #1", "invoice", 5000 * 1e6, 2000, 100 * 1e6, block.timestamp + 90 days, proofHashes);
        factory.createReceivable{value: FEE}("Invoice #2", "invoice", 3000 * 1e6, 1500, 100 * 1e6, block.timestamp + 60 days, proofHashes);
        vm.stopPrank();

        assertEq(factory.getCollectedFees(), FEE * 2);
        assertEq(factory.getReceivablesCount(issuer), 2);
        assertEq(factory.getTotalValue(issuer), 8000 * 1e6);
    }

    // ── Admin: set fee ──────────────────────────────────────

    function test_setFee() public {
        factory.setFee(2e18);
        assertEq(factory.feeAmount(), 2e18);
    }

    function test_setFee_onlyOwner() public {
        vm.prank(issuer);
        vm.expectRevert("Not owner");
        factory.setFee(2e18);
    }

    function test_setFee_event() public {
        vm.expectEmit(false, false, false, true);
        emit FeeUpdated(FEE, 2e18);
        factory.setFee(2e18);
    }

    function test_setFee_zero() public {
        factory.setFee(0);
        assertEq(factory.feeAmount(), 0);

        // Can create for free now
        vm.prank(issuer);
        factory.createReceivable("Free", "invoice", 1000 * 1e6, 2000, 100 * 1e6, block.timestamp + 90 days, proofHashes);
        assertEq(factory.getCollectedFees(), 0);
    }

    // ── Admin: set treasury ──────────────────────────────────

    function test_setTreasury() public {
        address newTreasury = makeAddr("newTreasury");
        factory.setTreasury(newTreasury);
        assertEq(factory.treasury(), newTreasury);
    }

    function test_setTreasury_onlyOwner() public {
        vm.prank(issuer);
        vm.expectRevert("Not owner");
        factory.setTreasury(makeAddr("newTreasury"));
    }

    function test_setTreasury_zeroAddress() public {
        vm.expectRevert("Zero address");
        factory.setTreasury(address(0));
    }

    // ── Admin: withdraw fees ─────────────────────────────────

    function test_withdrawFees() public {
        _createReceivable();
        assertEq(factory.getCollectedFees(), FEE);

        uint256 treasuryBefore = treasury.balance;
        factory.withdrawFees();
        uint256 treasuryAfter = treasury.balance;

        assertEq(factory.getCollectedFees(), 0);
        assertEq(treasuryAfter - treasuryBefore, FEE);
    }

    function test_withdrawFees_onlyOwner() public {
        _createReceivable();

        vm.prank(issuer);
        vm.expectRevert("Not owner");
        factory.withdrawFees();
    }

    function test_withdrawFees_noFees() public {
        vm.expectRevert("No fees to withdraw");
        factory.withdrawFees();
    }

    function test_withdrawFees_multiple() public {
        _createReceivable();
        _createReceivable();

        factory.setFee(2e18);

        // Third one costs 2e18
        vm.prank(issuer);
        factory.createReceivable{value: 2e18}("Invoice #3", "invoice", 1000 * 1e6, 2000, 100 * 1e6, block.timestamp + 90 days, proofHashes);

        // Total fees: 1 + 1 + 2 = 4 USDC
        assertEq(factory.getCollectedFees(), 4e18);

        uint256 treasuryBefore = treasury.balance;
        factory.withdrawFees();
        uint256 treasuryAfter = treasury.balance;

        assertEq(factory.getCollectedFees(), 0);
        assertEq(treasuryAfter - treasuryBefore, 4e18);
    }

    // ── Existing tests (updated) ────────────────────────────

    function test_getReceivables() public {
        vm.startPrank(issuer);
        factory.createReceivable{value: FEE}("Invoice #1", "invoice", 5000 * 1e6, 2000, 100 * 1e6, block.timestamp + 90 days, proofHashes);
        factory.createReceivable{value: FEE}("Invoice #2", "invoice", 3000 * 1e6, 1500, 100 * 1e6, block.timestamp + 60 days, proofHashes);
        vm.stopPrank();

        address[] memory receivables = factory.getReceivables(issuer);
        assertEq(receivables.length, 2);
        assertEq(factory.getTotalValue(issuer), 8000 * 1e6);
    }

    function test_revertZeroAmount() public {
        vm.prank(issuer);
        vm.expectRevert("Zero amount");
        factory.createReceivable{value: FEE}("Invoice #123", "invoice", 0, 2000, 100 * 1e6, block.timestamp + 90 days, proofHashes);
    }

    function test_revertNoProofs() public {
        bytes32[] memory emptyProofs = new bytes32[](0);
        vm.prank(issuer);
        vm.expectRevert("No proofs");
        factory.createReceivable{value: FEE}("Invoice #123", "invoice", 10000 * 1e6, 2000, 100 * 1e6, block.timestamp + 90 days, emptyProofs);
    }

    function test_receivableTypes() public {
        vm.startPrank(issuer);
        address invoice = factory.createReceivable{value: FEE}("Invoice", "invoice", 1000 * 1e6, 2000, 100 * 1e6, block.timestamp + 90 days, proofHashes);
        address payroll = factory.createReceivable{value: FEE}("Payroll", "payroll", 2000 * 1e6, 1500, 100 * 1e6, block.timestamp + 60 days, proofHashes);
        address contractor = factory.createReceivable{value: FEE}("Contractor", "contractor", 3000 * 1e6, 2500, 100 * 1e6, block.timestamp + 30 days, proofHashes);
        vm.stopPrank();

        assertTrue(factory.isReceivable(invoice));
        assertTrue(factory.isReceivable(payroll));
        assertTrue(factory.isReceivable(contractor));
        assertEq(factory.getReceivablesCount(issuer), 3);
        assertEq(factory.getTotalValue(issuer), 6000 * 1e6);
    }

    function test_differentInterestRates() public {
        vm.startPrank(issuer);
        address low = factory.createReceivable{value: FEE}("Low", "invoice", 1000 * 1e6, 1000, 100 * 1e6, block.timestamp + 90 days, proofHashes);
        address mid = factory.createReceivable{value: FEE}("Mid", "invoice", 1000 * 1e6, 2000, 100 * 1e6, block.timestamp + 90 days, proofHashes);
        address high = factory.createReceivable{value: FEE}("High", "invoice", 1000 * 1e6, 3000, 100 * 1e6, block.timestamp + 90 days, proofHashes);
        vm.stopPrank();

        assertTrue(factory.isReceivable(low));
        assertTrue(factory.isReceivable(mid));
        assertTrue(factory.isReceivable(high));
    }

    function test_differentExpiryDates() public {
        vm.startPrank(issuer);
        address short = factory.createReceivable{value: FEE}("Short", "invoice", 1000 * 1e6, 2000, 100 * 1e6, block.timestamp + 30 days, proofHashes);
        address medium = factory.createReceivable{value: FEE}("Medium", "invoice", 1000 * 1e6, 2000, 100 * 1e6, block.timestamp + 90 days, proofHashes);
        address long = factory.createReceivable{value: FEE}("Long", "invoice", 1000 * 1e6, 2000, 100 * 1e6, block.timestamp + 180 days, proofHashes);
        vm.stopPrank();

        assertTrue(factory.isReceivable(short));
        assertTrue(factory.isReceivable(medium));
        assertTrue(factory.isReceivable(long));
    }
}
