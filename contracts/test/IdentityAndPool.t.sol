// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SoulboundIdentityPass.sol";
import "../src/ComplianceRegistry.sol";
import "../src/ReceivablePool.sol";
import "../src/ReceivablePoolFactory.sol";
import "../src/ReceivableToken.sol";

contract IdentityAndPoolTest is Test {
    SoulboundIdentityPass internal pass;
    ComplianceRegistry internal registry;
    address internal user = address(0x1234);
    address internal investor = address(0x5678);

    function setUp() public {
        pass = new SoulboundIdentityPass();
        registry = new ComplianceRegistry(address(pass));
        vm.deal(user, 10 ether);
        vm.deal(investor, 10 ether);
    }

    function test_oneWalletOneSoulboundPass() public {
        vm.prank(user);
        (uint256 tokenId, bytes32 passId) = pass.mint();

        assertEq(pass.ownerOf(tokenId), user);
        assertEq(pass.tokenIdOf(user), tokenId);
        assertEq(pass.passIdOf(user), passId);
        assertTrue(pass.isValid(user));

        vm.prank(user);
        vm.expectRevert("Wallet already has a pass");
        pass.mint();
    }

    function test_soulboundCannotTransfer() public {
        vm.prank(user);
        (uint256 tokenId, ) = pass.mint();
        vm.prank(user);
        vm.expectRevert("Soulbound: non-transferable");
        pass.transferFrom(user, investor, tokenId);
    }

    function test_companyRegistryApprovesTier() public {
        vm.prank(user);
        pass.mint();

        registry.approveIdentity(user, 3, "US", 0);
        assertTrue(registry.isEligible(user, 1));
        assertTrue(registry.isEligible(user, 3));
        assertFalse(registry.isEligible(user, 4));

        registry.revokeIdentity(user);
        assertFalse(registry.isEligible(user, 1));
    }

    function test_identityExpiryAndRevocation() public {
        vm.prank(user);
        (uint256 tokenId, ) = pass.mint();
        pass.setExpiration(tokenId, uint64(block.timestamp + 1 days));
        assertTrue(pass.isValid(user));
        vm.warp(block.timestamp + 2 days);
        assertFalse(pass.isValid(user));
        pass.setRevoked(tokenId, true);
        assertFalse(pass.isValid(user));
    }

    function test_poolAcceptsEligibleInvestor() public {
        vm.prank(investor);
        pass.mint();
        registry.approveIdentity(investor, 1, "SG", 0);

        ReceivablePoolFactory factory = new ReceivablePoolFactory();
        bytes2[] memory countries = new bytes2[](0);
        address poolAddress = factory.createPool("Verified Pool", "GPOOL", address(registry), 1, countries);
        ReceivablePool pool = ReceivablePool(payable(poolAddress));
        pool.setAllowedCountry("SG", true);

        vm.prank(investor);
        uint256 shares = pool.deposit{value: 1 ether}();
        assertEq(shares, 1 ether);
        assertEq(pool.balanceOf(investor), 1 ether);

        pool.closeDeposits();
        vm.expectRevert("Redemptions not open");
        vm.prank(investor);
        pool.redeem(shares);
        pool.openRedemptions();
    }

    function test_poolRejectsDisallowedCountry() public {
        vm.prank(investor);
        pass.mint();
        registry.approveIdentity(investor, 1, "SG", 0);

        ReceivablePoolFactory factory = new ReceivablePoolFactory();
        bytes2[] memory countries = new bytes2[](0);
        ReceivablePool pool = ReceivablePool(payable(factory.createPool("US Pool", "USPOOL", address(registry), 1, countries)));
        pool.setAllowedCountry("US", true);

        vm.prank(investor);
        vm.expectRevert("Country not allowed");
        pool.deposit{value: 1 ether}();
    }

    function test_poolCustodiesPartnerReceivablePosition() public {
        bytes32[] memory proofs = new bytes32[](1);
        proofs[0] = keccak256("proof");
        ReceivableToken receivable = new ReceivableToken(
            "Invoice",
            "invoice",
            10 ether,
            2000,
            1 ether,
            block.timestamp + 30 days,
            proofs,
            user
        );

        vm.prank(user);
        receivable.finance{value: 10 ether}();
        uint256 partnerTokens = receivable.balanceOf(user);

        ReceivablePoolFactory factory = new ReceivablePoolFactory();
        vm.prank(user);
        bytes2[] memory countries = new bytes2[](0);
        ReceivablePool pool = ReceivablePool(payable(factory.createPool("Custodied", "CPOOL", address(0), 0, countries)));

        vm.startPrank(user);
        receivable.approve(address(pool), partnerTokens);
        uint256 managerShares = pool.addReceivable(address(receivable), partnerTokens);
        vm.stopPrank();

        assertGt(managerShares, 0);
        assertEq(receivable.balanceOf(address(pool)), partnerTokens);
        assertEq(pool.balanceOf(user), managerShares);
        assertGt(pool.totalAssets(), 0);
    }
}
