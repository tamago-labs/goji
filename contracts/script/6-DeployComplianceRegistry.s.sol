// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";

contract DeployComplianceRegistry is Script {
    function run() external {
        uint256 deployerPrivateKey = _parsePrivateKey(vm.envString("PRIVATE_KEY"));
        address identityPass = vm.envAddress("IDENTITY_PASS_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);
        ComplianceRegistry registry = new ComplianceRegistry(identityPass);
        vm.stopBroadcast();

        console.log("ComplianceRegistry deployed at:", address(registry));
        console.log("Identity pass:", identityPass);
        console.log("Chain ID:", block.chainid);
    }

    function _parsePrivateKey(string memory value) internal pure returns (uint256) {
        bytes memory raw = bytes(value);
        if (raw.length >= 2 && raw[0] == "0" && raw[1] == "x") return vm.parseUint(value);
        return vm.parseUint(string.concat("0x", value));
    }
}
