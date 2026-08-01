// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {GojiProof} from "../src/GojiProof.sol";

/**
 * @title DeployGojiProof
 * @notice Deploy the GojiProof contract for document verification on Arc
 * @dev Usage:
 *   forge script script/3-DeployProof.s.sol --rpc-url $RPC_URL --broadcast
 *
 *   Environment variables:
 *   - PRIVATE_KEY: Deployer private key
 */
contract DeployGojiProof is Script {

    function run() external {
        string memory privateKeyString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = _parsePrivateKey(privateKeyString);
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("Deploy GojiProof Contract");
        console.log("===========================================");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Block number:", block.number);

        uint256 balance = deployer.balance;
        console.log("Deployer balance:", balance / 1e18, "native tokens");
        require(balance > 0.01 ether, "Insufficient balance for deployment");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy GojiProof
        GojiProof proof = new GojiProof();
        console.log("\n[1/1] GojiProof deployed at:", address(proof));

        vm.stopBroadcast();

        // Verification
        console.log("\n===========================================");
        console.log("Deployment Results");
        console.log("===========================================");
        console.log("GojiProof:", address(proof));

        // Sanity checks
        require(address(proof) != address(0), "GojiProof deployment failed");

        console.log("\n[OK] GojiProof deployed successfully!");

        console.log("\n===========================================");
        console.log("Update your .env with:");
        console.log("===========================================");
        console.log("GOJIPROOF_ADDRESS=%s", address(proof));
        console.log("===========================================");
    }

    function _parsePrivateKey(string memory privateKeyString) internal pure returns (uint256) {
        if (bytes(privateKeyString)[0] == '0' && bytes(privateKeyString)[1] == 'x') {
            return vm.parseUint(privateKeyString);
        } else {
            return vm.parseUint(string(abi.encodePacked("0x", privateKeyString)));
        }
    }
}
