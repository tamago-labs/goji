// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ReceivableToken.sol";

contract ReceivableTokenTest is Test {
    ReceivableToken public token;
    address public issuer;
    address public investor;
    bytes32 public proofHash;

    function setUp() public {
        issuer = makeAddr("issuer");
        investor = makeAddr("investor");
        proofHash = keccak256("test-proof");
        
        // Fund the investor with ETH
        vm.deal(investor, 10000 * 1e18);
        
        vm.prank(issuer);
        token = new ReceivableToken(
            "Invoice #123",
            "GOJINV",
            "invoice",
            10000 * 1e18, // $10,000
            proofHash
        );
    }

    function test_initialState() public view {
        assertEq(token.name(), "Invoice #123");
        assertEq(token.symbol(), "GOJINV");
        assertEq(token.receivableType(), "invoice");
        assertEq(token.totalSupply(), 10000 * 1e18);
        assertEq(token.owner(), issuer);
        assertFalse(token.isFinanced());
    }

    function test_finance() public {
        vm.prank(investor);
        token.finance{value: 1000 * 1e18}();
        
        assertTrue(token.isFinanced());
        assertEq(token.financier(), investor);
    }

    function test_finance_belowMinimum() public {
        vm.prank(investor);
        vm.expectRevert("Below minimum investment");
        token.finance{value: 50 * 1e18}(); // $50 < $100 minimum
    }

    function test_finance_alreadyFinanced() public {
        vm.startPrank(investor);
        token.finance{value: 1000 * 1e18}();
        vm.stopPrank();
        
        address anotherInvestor = makeAddr("another");
        vm.deal(anotherInvestor, 10000 * 1e18);
        vm.prank(anotherInvestor);
        vm.expectRevert("Already financed");
        token.finance{value: 1000 * 1e18}();
    }

    function test_redeem() public {
        vm.prank(investor);
        token.finance{value: 1000 * 1e18}();
        
        uint256 balanceBefore = token.balanceOf(investor);
        
        vm.prank(investor);
        token.redeem();
        
        uint256 balanceAfter = token.balanceOf(investor);
        assertEq(balanceAfter, balanceBefore + 10000 * 1e18);
    }

    function test_redeem_notFinancier() public {
        vm.prank(investor);
        token.finance{value: 1000 * 1e18}();
        
        address anotherInvestor = makeAddr("another");
        vm.prank(anotherInvestor);
        vm.expectRevert("Not financier");
        token.redeem();
    }

    function test_getReceivableInfo() public view {
        (string memory _type, bytes32 _proofHash, uint256 _amount, uint256 _issuedAt, uint256 _expiresAt, bool _isFinanced) = token.getReceivableInfo();
        
        assertEq(_type, "invoice");
        assertEq(_proofHash, proofHash);
        assertEq(_amount, 10000 * 1e18);
        assertTrue(_issuedAt > 0);
        assertTrue(_expiresAt > _issuedAt);
        assertFalse(_isFinanced);
    }
}
