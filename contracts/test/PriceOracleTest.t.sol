// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PriceOracle.sol";


contract PriceOracleTest is Test {

    PriceOracle oracle;

    address loanToken = makeAddr("USDT");
    address collateralToken = makeAddr("KUB");
    address nonWhitelisted = makeAddr("stranger");
    address newUser = makeAddr("newUser");

    // Using 18 decimals for both tokens (mock tokens are 18 dec)
    uint8 constant LOAN_DEC = 18;
    uint8 constant COLL_DEC = 18;

    // KUB = $0.85, USDT = $1
    uint256 constant KUB_USD = 85e16; // 0.85 * 1e18
    uint256 constant USDT_USD = 1e18;

    event PriceUpdated(uint256 collateralUsdPrice, uint256 loanUsdPrice);
    event WhitelistUpdated(address indexed user, bool whitelisted);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    function setUp() public {
        oracle = new PriceOracle(
            loanToken,
            collateralToken,
            KUB_USD,
            USDT_USD,
            LOAN_DEC,
            COLL_DEC
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // BASIC PRICE TESTS
    // ═══════════════════════════════════════════════════════════════════

    function test_price_basic() public view {
        // price = (KUB_USD / USDT_USD) * 10^(loanDec + 36 - collateralDec)
        // = (85e16 / 1e18) * 10^(18+36-18) = 0.85 * 1e36 = 85e34
        uint256 p = oracle.price();
        assertEq(p, 85e34, "KUB/USDT price mismatch");
    }

    function test_price_withDifferentDecimals() public {
        // Test with 6-decimal loan token (real USDT)
        address usdt6 = makeAddr("USDT6");
        PriceOracle oracle6 =
            new PriceOracle(usdt6, collateralToken, KUB_USD, USDT_USD, 6, 18);
        // price = (85e16 / 1e18) * 10^(6+36-18) = 0.85 * 1e24 = 85e22
        uint256 p = oracle6.price();
        assertEq(p, 85e22, "6/18 decimal price mismatch");
    }

    function test_price_equalPrices() public {
        // Both tokens = $1
        PriceOracle oracleEq =
            new PriceOracle(loanToken, collateralToken, 1e18, 1e18, 18, 18);
        // price = (1e18 / 1e18) * 10^36 = 1e36
        uint256 p = oracleEq.price();
        assertEq(p, 1e36, "Equal price should be 1e36");
    }

    function test_price_collateralMoreValuable() public {
        // Collateral = $3000 (ETH), Loan = $1 (USDT)
        PriceOracle oracleEth =
            new PriceOracle(loanToken, collateralToken, 3000e18, 1e18, 18, 18);
        // price = (3000e18 / 1e18) * 1e36 = 3000e36
        uint256 p = oracleEth.price();
        assertEq(p, 3000e36, "ETH/USDT price mismatch");
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRICE INFO
    // ═══════════════════════════════════════════════════════════════════

    function test_getPriceInfo() public view {
        (uint8 collMode, uint8 lnMode, uint256 collUsd, uint256 lnUsd, uint256 morphoPrice) =
            oracle.getPriceInfo();
        assertEq(collMode, 0, "default collateral mode");
        assertEq(lnMode, 0, "default loan mode");
        assertEq(collUsd, KUB_USD, "collateral USD price");
        assertEq(lnUsd, USDT_USD, "loan USD price");
        assertEq(morphoPrice, 85e34, "morpho price");
    }

    // ═══════════════════════════════════════════════════════════════════
    // SET PRICE (FALLBACK MODE)
    // ═══════════════════════════════════════════════════════════════════

    function test_setCustomPrice_onlyWhitelisted() public {
        vm.warp(block.timestamp + 2 hours);
        vm.prank(nonWhitelisted);
        vm.expectRevert(PriceOracle.NotWhitelisted.selector);
        oracle.setCustomPrice(2e18, USDT_USD);
    }

    function test_setCustomPrice_success() public {
        vm.warp(block.timestamp + 2 hours);
        oracle.setCustomPrice(90e16, USDT_USD); // $0.90
        assertEq(oracle.collateralUsdPrice(), 90e16);
        assertEq(oracle.loanUsdPrice(), USDT_USD);
    }

    function test_setCustomPrice_zeroReverts() public {
        vm.warp(block.timestamp + 2 hours);
        vm.expectRevert(PriceOracle.ZeroPrice.selector);
        oracle.setCustomPrice(0, USDT_USD);
    }

    function test_setCustomPrice_zeroLoanReverts() public {
        vm.warp(block.timestamp + 2 hours);
        vm.expectRevert(PriceOracle.ZeroPrice.selector);
        oracle.setCustomPrice(KUB_USD, 0);
    }

    function test_setCustomPrice_updateDelay() public {
        // Attempting to update immediately should fail
        vm.expectRevert(PriceOracle.UpdateTooFrequent.selector);
        oracle.setCustomPrice(90e16, USDT_USD);
    }

    function test_setCustomPrice_afterDelay() public {
        vm.warp(block.timestamp + 2 hours);
        oracle.setCustomPrice(90e16, USDT_USD);
        assertEq(oracle.collateralUsdPrice(), 90e16);
    }

    function test_setCustomPrice_event() public {
        vm.warp(block.timestamp + 2 hours);
        vm.expectEmit(true, true, true, true);
        emit PriceUpdated(90e16, USDT_USD);
        oracle.setCustomPrice(90e16, USDT_USD);
    }

    // ═══════════════════════════════════════════════════════════════════
    // WHITELIST MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════

    function test_addToWhitelist() public {
        oracle.addToWhitelist(newUser);
        assertTrue(oracle.whitelist(newUser));
    }

    function test_removeFromWhitelist() public {
        oracle.addToWhitelist(newUser);
        oracle.removeFromWhitelist(newUser);
        assertFalse(oracle.whitelist(newUser));
    }

    function test_whitelist_onlyOwner() public {
        vm.prank(nonWhitelisted);
        vm.expectRevert(PriceOracle.NotOwner.selector);
        oracle.addToWhitelist(newUser);
    }

    function test_removeWhitelist_onlyOwner() public {
        vm.prank(nonWhitelisted);
        vm.expectRevert(PriceOracle.NotOwner.selector);
        oracle.removeFromWhitelist(newUser);
    }

    function test_whitelistedCanSetPrice() public {
        oracle.addToWhitelist(newUser);
        vm.warp(block.timestamp + 2 hours);
        vm.prank(newUser);
        oracle.setCustomPrice(90e16, USDT_USD);
        assertEq(oracle.collateralUsdPrice(), 90e16);
    }

    // ═══════════════════════════════════════════════════════════════════
    // OWNERSHIP
    // ═══════════════════════════════════════════════════════════════════

    function test_transferOwnership() public {
        address newOwner = makeAddr("newOwner");
        oracle.transferOwnership(newOwner);
        assertEq(oracle.owner(), newOwner);
    }

    function test_transferOwnership_onlyOwner() public {
        vm.prank(nonWhitelisted);
        vm.expectRevert(PriceOracle.NotOwner.selector);
        oracle.transferOwnership(makeAddr("newOwner"));
    }

    function test_transferOwnership_event() public {
        address newOwner = makeAddr("newOwner");
        vm.expectEmit(true, true, true, true);
        emit OwnershipTransferred(address(this), newOwner);
        oracle.transferOwnership(newOwner);
    }

    // ═══════════════════════════════════════════════════════════════════
    // IMMUTABLES
    // ═══════════════════════════════════════════════════════════════════

    function test_immutables() public view {
        assertEq(oracle.LOAN_TOKEN(), loanToken);
        assertEq(oracle.COLLATERAL_TOKEN(), collateralToken);
        assertEq(oracle.LOAN_TOKEN_DECIMALS(), LOAN_DEC);
        assertEq(oracle.COLLATERAL_TOKEN_DECIMALS(), COLL_DEC);
    }


}
