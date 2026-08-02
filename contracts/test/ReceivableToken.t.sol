// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ReceivableToken.sol";

contract ReceivableTokenTest is Test {
    ReceivableToken public token;
    address public issuer;
    address public investor1;
    address public investor2;
    bytes32[] public proofHashes;

    uint256 constant TOTAL = 10_000 * 1e18;       // $10,000 USDC
    uint256 constant MAX_SUPPLY = 1_000_000 * 1e6; // 1M tokens
    uint256 constant MIN_INV = 100 * 1e18;        // $100 USDC
    uint256 constant RATE = 2000;                  // 20% APR
    uint256 constant TERM = 60 days;

    function setUp() public {
        issuer = makeAddr("issuer");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        proofHashes.push(keccak256("proof-1"));
        proofHashes.push(keccak256("proof-2"));
        proofHashes.push(keccak256("proof-3"));

        vm.deal(investor1, 100_000 * 1e18);
        vm.deal(investor2, 100_000 * 1e18);
        vm.deal(issuer, 100_000 * 1e18);

        vm.prank(issuer);
        token = new ReceivableToken(
            "Invoice #123",
            "invoice",
            TOTAL,
            RATE,
            MIN_INV,
            block.timestamp + TERM,
            proofHashes,
            issuer
        );
    }

    // ── Helpers ──────────────────────────────────────────────

    function _fundFull() internal {
        vm.prank(investor1);
        token.finance{value: TOTAL}();
    }

    function _expire() internal {
        vm.warp(block.timestamp + TERM);
    }

    // ── Initial state ────────────────────────────────────────

    function test_initialState() public view {
        assertEq(token.name(), "Invoice #123");
        assertEq(token.symbol(), "GOJINV");
        assertEq(token.receivableType(), "invoice");
        assertEq(token.issuer(), issuer);
        assertEq(token.totalReceivable(), TOTAL);
        assertEq(token.interestRate(), RATE);
        assertEq(token.minInvestment(), MIN_INV);
        assertEq(token.fundedAmount(), 0);
        assertEq(uint8(token.status()), uint8(ReceivableToken.Status.Active));
        assertEq(token.getProofCount(), 3);
    }

    // ── Finance ──────────────────────────────────────────────

    function test_finance() public {
        uint256 investAmt = 5000 * 1e18;
        uint256 issuerBalBefore = issuer.balance;
        vm.prank(investor1);
        token.finance{value: investAmt}();

        assertEq(token.fundedAmount(), investAmt);
        assertEq(token.balanceOf(investor1), (investAmt * MAX_SUPPLY) / TOTAL);
        assertEq(issuer.balance - issuerBalBefore, investAmt);
        assertEq(token.investedAmount(investor1), investAmt);
        assertEq(token.fundingDate(investor1), block.timestamp);
    }

    function test_finance_fullyFunded() public {
        _fundFull();
        assertEq(token.fundedAmount(), TOTAL);
        assertEq(uint8(token.status()), uint8(ReceivableToken.Status.Funded));
    }

    // ── Pro-rata interest ───────────────────────────────────

    function test_proRata_fullTerm() public {
        // Investor funds at day 0, full term
        uint256 investAmt = 10_000 * 1e18;
        vm.prank(investor1);
        token.finance{value: investAmt}();

        _expire();

        // Interest = 10000 * 60 * 20% / 60 = 2000 USDC
        uint256 interest = token.calculateInvestorInterest(investor1);
        assertEq(interest, 2_000 * 1e18);

        // Total repayment = 10000 + 2000 = 12000
        assertEq(token.getTotalRepayment(), 12_000 * 1e18);
    }

    function test_proRata_halfTerm() public {
        // Investor funds at day 0, only half term
        uint256 investAmt = 10_000 * 1e18;
        vm.prank(investor1);
        token.finance{value: investAmt}();

        // Fast forward to day 30
        vm.warp(block.timestamp + 30 days);

        // Interest = 10000 * 30 * 20% / 60 = 1000 USDC
        uint256 interest = token.calculateInvestorInterest(investor1);
        assertEq(interest, 1_000 * 1e18);
    }

    function test_proRata_twoInvestors_sameTime() public {
        // Both invest at day 0
        uint256 amt1 = 5000 * 1e18;
        uint256 amt2 = 5000 * 1e18;

        vm.prank(investor1);
        token.finance{value: amt1}();
        vm.prank(investor2);
        token.finance{value: amt2}();

        _expire();

        // Each gets 50% of principal + 50% of interest
        // Principal: 5000 each
        // Interest: 5000 * 60 * 20% / 60 = 1000 each
        uint256 interest1 = token.calculateInvestorInterest(investor1);
        uint256 interest2 = token.calculateInvestorInterest(investor2);

        assertEq(interest1, 1_000 * 1e18);
        assertEq(interest2, 1_000 * 1e18);
    }

    function test_proRata_twoInvestors_differentTime() public {
        // Investor1 funds 5000 at day 0
        uint256 amt1 = 5000 * 1e18;
        vm.prank(investor1);
        token.finance{value: amt1}();

        // Fast forward to day 30
        vm.warp(block.timestamp + 30 days);

        // Investor2 funds 5000 at day 30
        uint256 amt2 = 5000 * 1e18;
        vm.prank(investor2);
        token.finance{value: amt2}();

        // Fast forward to expiry
        vm.warp(block.timestamp + 30 days);

        // Investor1 interest: 5000 * 60 * 20% / 60 = 1000
        uint256 interest1 = token.calculateInvestorInterest(investor1);
        assertEq(interest1, 1_000 * 1e18);

        // Investor2 interest: 5000 * 30 * 20% / 60 = 500
        uint256 interest2 = token.calculateInvestorInterest(investor2);
        assertEq(interest2, 500 * 1e18);
    }

    // ── Claim repayment ─────────────────────────────────────

    function test_claimRepayment() public {
        _fundFull();
        _expire();

        // Repayment = 10000 + 2000 = 12000
        uint256 repayment = token.getTotalRepayment();
        assertEq(repayment, 12_000 * 1e18);

        vm.prank(issuer);
        token.claimRepayment{value: repayment}();

        assertEq(uint8(token.status()), uint8(ReceivableToken.Status.Redeemed));
    }

    function test_claimRepayment_insufficient() public {
        _fundFull();
        _expire();

        vm.prank(issuer);
        vm.expectRevert("Insufficient repayment");
        token.claimRepayment{value: 11_000 * 1e18}();
    }

    // ── Redeem ──────────────────────────────────────────────

    function test_redeem() public {
        _fundFull();
        _expire();

        uint256 repayment = token.getTotalRepayment();
        vm.prank(issuer);
        token.claimRepayment{value: repayment}();

        uint256 balBefore = address(investor1).balance;
        vm.prank(investor1);
        token.redeem();
        uint256 balAfter = address(investor1).balance;

        // investor1 gets full repayment (12000)
        assertEq(balAfter - balBefore, 12_000 * 1e18);
        assertEq(token.balanceOf(investor1), 0);
    }

    function test_redeem_twoInvestors() public {
        // Both at same time
        vm.prank(investor1);
        token.finance{value: 5000 * 1e18}();
        vm.prank(investor2);
        token.finance{value: 5000 * 1e18}();

        _expire();

        uint256 repayment = token.getTotalRepayment();
        vm.prank(issuer);
        token.claimRepayment{value: repayment}();

        uint256 bal1Before = address(investor1).balance;
        vm.prank(investor1);
        token.redeem();
        uint256 bal1After = address(investor1).balance;

        uint256 bal2Before = address(investor2).balance;
        vm.prank(investor2);
        token.redeem();
        uint256 bal2After = address(investor2).balance;

        // Each gets 6000 (5000 principal + 1000 interest)
        assertEq(bal1After - bal1Before, 6_000 * 1e18);
        assertEq(bal2After - bal2Before, 6_000 * 1e18);
    }

    // ── View functions ───────────────────────────────────────

    function test_getRepaymentAmount() public view {
        // 10000 + 2000 = 12000
        assertEq(token.getTotalRepayment(), 12_000 * 1e18);
    }

    function test_getReceivableInfo() public view {
        (
            string memory _type,
            address _issuer,
            uint256 _totalReceivable,
            uint256 _interestRate,
            uint256 _minInvestment,
            uint256 _issuedAt,
            uint256 _expiresAt,
            uint256 _fundedAmount,
            ReceivableToken.Status _status
        ) = token.getReceivableInfo();

        assertEq(_type, "invoice");
        assertEq(_issuer, issuer);
        assertEq(_totalReceivable, TOTAL);
        assertEq(_interestRate, RATE);
        assertEq(_minInvestment, MIN_INV);
        assertTrue(_issuedAt > 0);
        assertTrue(_expiresAt > _issuedAt);
        assertEq(_fundedAmount, 0);
        assertEq(uint8(_status), uint8(ReceivableToken.Status.Active));
    }

    function test_getProofHashes() public view {
        bytes32[] memory hashes = token.getProofHashes();
        assertEq(hashes.length, 3);
        assertEq(hashes[0], keccak256("proof-1"));
        assertEq(hashes[1], keccak256("proof-2"));
        assertEq(hashes[2], keccak256("proof-3"));
    }
}
