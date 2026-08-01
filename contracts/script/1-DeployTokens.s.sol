// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {ERC20Mock} from "../src/mocks/ERC20Mock.sol";

/**
 * @title DeployGojiTokens
 * @notice Deploy RWA tokens for Goji: Payroll, Receivables, Finance
 * @dev Usage:
 *   forge script script/1-DeployGojiTokens.s.sol --rpc-url $RPC_URL --broadcast
 *
 *   Environment variables:
 *   - PRIVATE_KEY: Deployer private key
 */
contract DeployGojiTokens is Script {

    function run() external {
        string memory privateKeyString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = _parsePrivateKey(privateKeyString);
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("Deploy Goji RWA Tokens");
        console.log("===========================================");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Block number:", block.number);

        uint256 balance = deployer.balance;
        console.log("Deployer balance:", balance / 1e18, "native tokens");
        require(balance > 0.01 ether, "Insufficient balance for deployment");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Payroll Token (18 decimals)
        // Represents verified payroll records
        ERC20Mock payrollToken = new ERC20Mock();
        console.log("\n[1/4] Payroll Token deployed at:", address(payrollToken));

        // Deploy Receivables Token (18 decimals)
        // Represents invoice receivables
        ERC20Mock receivablesToken = new ERC20Mock();
        console.log("[2/4] Receivables Token deployed at:", address(receivablesToken));

        // Deploy Finance Token (18 decimals)
        // Represents financed assets
        ERC20Mock financeToken = new ERC20Mock();
        console.log("[3/4] Finance Token deployed at:", address(financeToken));

        // Deploy Company Token (18 decimals)
        // Represents company receivable assets
        ERC20Mock companyToken = new ERC20Mock();
        console.log("[4/4] Company Token deployed at:", address(companyToken));

        vm.stopBroadcast();

        // Verification
        console.log("\n===========================================");
        console.log("Deployment Results");
        console.log("===========================================");
        console.log("GOJPAY (Payroll Token):", address(payrollToken));
        console.log("GOJREC (Receivables Token):", address(receivablesToken));
        console.log("GOJFIN (Finance Token):", address(financeToken));
        console.log("GOJCO (Company Token):", address(companyToken));

        // Sanity checks
        require(address(payrollToken) != address(0), "Payroll token deployment failed");
        require(address(receivablesToken) != address(0), "Receivables token deployment failed");
        require(address(financeToken) != address(0), "Finance token deployment failed");
        require(address(companyToken) != address(0), "Company token deployment failed");

        console.log("\n[OK] All 4 RWA tokens deployed successfully!");

        console.log("\n===========================================");
        console.log("Update your .env with:");
        console.log("===========================================");
        console.log("GOJPAY_ADDRESS=%s", address(payrollToken));
        console.log("GOJREC_ADDRESS=%s", address(receivablesToken));
        console.log("GOJFIN_ADDRESS=%s", address(financeToken));
        console.log("GOJCO_ADDRESS=%s", address(companyToken));
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
