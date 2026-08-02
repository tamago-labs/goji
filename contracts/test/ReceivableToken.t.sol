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

    uint256 constant TOTAL = 10_000 * 1e6;       // $10,000 USDC
    uint256 constant MAX_SUPPLY = 1_000_000 * 1e6; // 1M tokens
    uint256 constant MIN_INV = 100 * 1e6;        // $100 USDC
    uint256 constant RATE = 2000;                 // 20%
    uint256 constant REPAYMENT = 12_000 * 1e6;    // $12,000

    function setUp() public {
        issuer = makeAddr("issuer");
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");

        proofHashes.push(keccak256("proof-1"));
        proofHashes.push(keccak256("proof-2"));
        proofHashes.push(keccak256("proof-3"));

        vm.deal(investor1, 100_000 * 1e6);
        vm.deal(investor2, 100_000 * 1e6);
        vm.deal(issuer, 100_000 * 1e6);

        vm.prank(issuer);
        token = new ReceivableToken(
            "Invoice #123",
            "invoice",
            TOTAL,
            RATE,
            MIN_INV,
            block.timestamp + 90 days,
            proofHashes
        );
    }

    // ── Helpers ──────────────────────────────────────────────

    function _fundFull() internal {
        vm.prank(investor1);
        token.finance{value: TOTAL}();
    }

    function _expire() internal {
        vm.warp(block.timestamp + 90 days);
    }

    function _repay() internal {
        vm.prank(issuer);
        token.claimRepayment{value: REPAYMENT}();
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
        assertEq(token.maxSupply(), MAX_SUPPLY);
    }

    // ── Finance ──────────────────────────────────────────────

    function test_finance() public {
        uint256 investAmt = 5000 * 1e6;
        uint256 issuerBalBefore = issuer.balance;
        vm.prank(investor1);
        token.finance{value: investAmt}();

        assertEq(token.fundedAmount(), investAmt);
        // tokens = (5000e6 * 1e12) / 10000e6 = 500e6
        uint256 expectedTokens = (investAmt * MAX_SUPPLY) / TOTAL;
        assertEq(token.balanceOf(investor1), expectedTokens);
        assertEq(uint8(token.status()), uint8(ReceivableToken.Status.Active));
        // Issuer receives the funds
        assertEq(issuer.balance - issuerBalBefore, investAmt);
    }

    function test_finance_multipleInvestors() public {
        uint256 amt1 = 3000 * 1e6;
        uint256 amt2 = 2000 * 1e6;

        vm.prank(investor1);
        token.finance{value: amt1}();
        vm.prank(investor2);
        token.finance{value: amt2}();

        assertEq(token.fundedAmount(), amt1 + amt2);
        assertEq(token.balanceOf(investor1), (amt1 * MAX_SUPPLY) / TOTAL);
        assertEq(token.balanceOf(investor2), (amt2 * MAX_SUPPLY) / TOTAL);
    }

    function test_finance_fullyFunded() public {
        _fundFull();
        assertEq(token.fundedAmount(), TOTAL);
        assertEq(uint8(token.status()), uint8(ReceivableToken.Status.Funded));
    }

    function test_finance_belowMinimum() public {
        vm.prank(investor1);
        vm.expectRevert("Below minimum investment");
        token.finance{value: 50 * 1e6}();
    }

    function test_finance_notActive() public {
        _fundFull();
        vm.prank(investor2);
        vm.expectRevert("Not active");
        token.finance{value: MIN_INV}();
    }

    function test_finance_exceedsTotal() public {
        vm.prank(investor1);
        vm.expectRevert("Exceeds total");
        token.finance{value: TOTAL + 1}();
    }

    // ── Claim repayment ─────────────────────────────────────

    function test_claimRepayment() public {
        _fundFull();
        _expire();
        _repay();
        assertEq(uint8(token.status()), uint8(ReceivableToken.Status.Redeemed));
    }

    function test_claimRepayment_notExpired() public {
        _fundFull();
        vm.prank(issuer);
        vm.expectRevert("Not expired yet");
        token.claimRepayment{value: REPAYMENT}();
    }

    function test_claimRepayment_insufficient() public {
        _fundFull();
        _expire();
        vm.prank(issuer);
        vm.expectRevert("Insufficient repayment");
        token.claimRepayment{value: 11_000 * 1e6}();
    }

    // ── Redeem ──────────────────────────────────────────────

    function test_redeem_full() public {
        _fundFull();
        _expire();
        _repay();

        uint256 balBefore = address(investor1).balance;
        vm.prank(investor1);
        token.redeem();
        uint256 balAfter = address(investor1).balance;

        // investor1 has 100% of tokens → gets 100% of repayment
        // Contract only has: 12k (repayment), funds were sent to issuer
        assertEq(balAfter - balBefore, REPAYMENT);
        assertEq(token.balanceOf(investor1), 0);
    }

    function test_redeem_proportional() public {
        uint256 amt1 = 5000 * 1e6;
        uint256 amt2 = 5000 * 1e6;

        vm.prank(investor1);
        token.finance{value: amt1}();
        vm.prank(investor2);
        token.finance{value: amt2}();

        _expire();
        _repay();

        uint256 bal1Before = address(investor1).balance;
        vm.prank(investor1);
        token.redeem();
        uint256 bal1After = address(investor1).balance;

        uint256 bal2Before = address(investor2).balance;
        vm.prank(investor2);
        token.redeem();
        uint256 bal2After = address(investor2).balance;

        // Contract has: 12k (repayment only)
        // Each has 50% → gets 6k each
        assertEq(bal1After - bal1Before, 6_000 * 1e6);
        assertEq(bal2After - bal2Before, 6_000 * 1e6);
    }

    function test_redeem_notReady() public {
        _fundFull();
        vm.prank(investor1);
        vm.expectRevert("Not ready for redemption");
        token.redeem();
    }

    function test_redeem_noTokens() public {
        _fundFull();
        _expire();
        _repay();

        vm.prank(investor2);
        vm.expectRevert("No tokens to redeem");
        token.redeem();
    }

    // ── View functions ───────────────────────────────────────

    function test_getRepaymentAmount() public view {
        assertEq(token.getRepaymentAmount(), REPAYMENT);
    }

    function test_getShare() public {
        uint256 amt = 5000 * 1e6;
        vm.prank(investor1);
        token.finance{value: amt}();

        // Before repayment, totalRedeemable is 0 → share is 0
        assertEq(token.getShare(investor1), 0);

        // After repayment, share is calculated
        _expire();
        _repay();

        uint256 tokens = token.balanceOf(investor1);
        // totalRedeemable = 12k (repayment only, funds sent to issuer)
        uint256 totalRedeemable = REPAYMENT;
        uint256 expected = (tokens * totalRedeemable) / MAX_SUPPLY;
        assertEq(token.getShare(investor1), expected);
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
