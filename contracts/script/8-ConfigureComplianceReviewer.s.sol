// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";

/// @notice Grant or revoke ComplianceRegistry reviewer access.
/// @dev Set REGISTRY_ADDRESS, REVIEWER_ADDRESS, and REVIEWER_ENABLED.
contract ConfigureComplianceReviewer is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.parseUint(vm.envString("PRIVATE_KEY"));
        address registryAddress = vm.envAddress("REGISTRY_ADDRESS");
        address reviewer = vm.envAddress("REVIEWER_ADDRESS");
        bool enabled = vm.envBool("REVIEWER_ENABLED");

        vm.startBroadcast(deployerPrivateKey);
        ComplianceRegistry(registryAddress).setReviewer(reviewer, enabled);
        vm.stopBroadcast();

        console.log("ComplianceRegistry:", registryAddress);
        console.log("Reviewer:", reviewer);
        console.log("Enabled:", enabled);
    }
}
