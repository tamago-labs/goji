// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SoulboundIdentityPass} from "../src/SoulboundIdentityPass.sol";

contract DeployIdentityPass is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.parseUint(vm.envString("PRIVATE_KEY"));

        vm.startBroadcast(deployerPrivateKey);
        SoulboundIdentityPass pass = new SoulboundIdentityPass();
        vm.stopBroadcast();

        console.log("SoulboundIdentityPass deployed at:", address(pass));
        console.log("Chain ID:", block.chainid);
    }
}
