// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ReceivableToken} from "../src/ReceivableToken.sol";
import {ReceivableFactory} from "../src/ReceivableFactory.sol";

/**
 * @title DeployReceivable
 * @notice Deploy ReceivableFactory for creating RWA tokens
 * @dev Usage:
 *   forge script script/4-DeployReceivable.s.sol --rpc-url $RPC_URL --broadcast
 *
 *   Environment variables:
 *   - PRIVATE_KEY: Deployer private key
 */
contract DeployReceivable is Script {

    function run() external {
        string memory privateKeyString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = _parsePrivateKey(privateKeyString);
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("Deploy ReceivableFactory");
        console.log("===========================================");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Block number:", block.number);

        uint256 balance = deployer.balance;
        console.log("Deployer balance:", balance / 1e18, "native tokens");
        require(balance > 0.01 ether, "Insufficient balance for deployment");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ReceivableFactory
        // TODO: Set your treasury address and fee amount
        address treasury = deployer; // Temporary: deployer as treasury
        uint256 feeAmount = 1e6;    // 1 USDC flat fee
        ReceivableFactory factory = new ReceivableFactory(treasury, feeAmount);
        console.log("\n[1/1] ReceivableFactory deployed at:", address(factory));

        vm.stopBroadcast();

        // Verification
        console.log("\n===========================================");
        console.log("Deployment Results");
        console.log("===========================================");
        console.log("ReceivableFactory:", address(factory));

        // Sanity checks
        require(address(factory) != address(0), "ReceivableFactory deployment failed");

        console.log("\n[OK] ReceivableFactory deployed successfully!");

        console.log("\n===========================================");
        console.log("Update your .env with:");
        console.log("===========================================");
        console.log("RECEIVABLE_FACTORY_ADDRESS=%s", address(factory));
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
