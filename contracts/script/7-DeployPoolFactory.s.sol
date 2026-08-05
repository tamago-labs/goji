// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ReceivablePoolFactory} from "../src/ReceivablePoolFactory.sol";

contract DeployPoolFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = _parsePrivateKey(vm.envString("PRIVATE_KEY"));

        vm.startBroadcast(deployerPrivateKey);
        ReceivablePoolFactory factory = new ReceivablePoolFactory();
        vm.stopBroadcast();

        console.log("ReceivablePoolFactory deployed at:", address(factory));
        console.log("Chain ID:", block.chainid);
    }

    function _parsePrivateKey(string memory value) internal pure returns (uint256) {
        bytes memory raw = bytes(value);
        if (raw.length >= 2 && raw[0] == "0" && raw[1] == "x") return vm.parseUint(value);
        return vm.parseUint(string.concat("0x", value));
    }
}
