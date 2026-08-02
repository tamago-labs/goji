// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PriceOracle} from "../src/PriceOracle.sol";

/**
 * @title DeployGojiOracles
 * @notice Deploy PriceOracle contracts for RWA token pairs
 *         All oracles use fallback mode (mode 0) with hardcoded USD prices
 *
 * Markets:
 *   1. USDC (loan) <> GOJPAY (collateral)   — USDC=$1.0, GOJPAY=$0.50
 *   2. USDC (loan) <> GOJREC (collateral)   — USDC=$1.0, GOJREC=$0.80
 *   3. USDC (loan) <> GOJFIN (collateral)   — USDC=$1.0, GOJFIN=$1.20
 *
 * @dev Usage:
 *   forge script script/2-DeployGojiOracles.s.sol --rpc-url $RPC_URL --broadcast
 *
 *   Environment variables:
 *   - PRIVATE_KEY: Deployer private key
 */
contract DeployGojiOracles is Script {

    // Token addresses  
    address usdcAddress;
    address gojpayAddress;
    address gojrecAddress;
    address gojfinAddress;

    // Prices in USD, scaled by 1e18
    uint256 constant USDC_USD_PRICE   = 1e18;        // $1.00
    uint256 constant GOJPAY_USD_PRICE = 0.50e18;     // $0.50 (payroll receivable)
    uint256 constant GOJREC_USD_PRICE = 0.80e18;     // $0.80 (invoice receivable)
    uint256 constant GOJFIN_USD_PRICE = 1.20e18;     // $1.20 (financed asset)

    // All tokens have 18 decimals
    uint8 constant DECIMALS_18 = 18;

    function run() external {
        string memory privateKeyString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = _parsePrivateKey(privateKeyString);
        address deployer = vm.addr(deployerPrivateKey);

        // Token addresses (update after deploying tokens)
        usdcAddress   = 0x1c7D4b196cB0C7B01D517171f56dBdA9be05A7e6; // USDC Sepolia
        gojpayAddress = vm.envAddress("GOJPAY_ADDRESS");
        gojrecAddress = vm.envAddress("GOJREC_ADDRESS");
        gojfinAddress = vm.envAddress("GOJFIN_ADDRESS");

        console.log("===========================================");
        console.log("Deploy Goji RWA Oracles (USDC <> RWA)");
        console.log("===========================================");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("USDC  address:", usdcAddress);
        console.log("GOJPAY address:", gojpayAddress);
        console.log("GOJREC address:", gojrecAddress);
        console.log("GOJFIN address:", gojfinAddress);
        console.log("===========================================");

        require(usdcAddress   != address(0), "USDC_ADDRESS not set");
        require(gojpayAddress != address(0), "GOJPAY_ADDRESS not set");
        require(gojrecAddress != address(0), "GOJREC_ADDRESS not set");
        require(gojfinAddress != address(0), "GOJFIN_ADDRESS not set");

        vm.startBroadcast(deployerPrivateKey);

        // Oracle 1: USDC (loan) <> GOJPAY (collateral)
        //   collateralPrice = GOJPAY = $0.50, loanPrice = USDC = $1.0
        PriceOracle oracle1 = new PriceOracle(
            usdcAddress,         // loanToken
            gojpayAddress,       // collateralToken
            GOJPAY_USD_PRICE,    // initialCollateralUsdPrice ($0.50)
            USDC_USD_PRICE,      // initialLoanUsdPrice ($1.0)
            DECIMALS_18,         // loanTokenDecimals (USDC)
            DECIMALS_18          // collateralTokenDecimals (GOJPAY)
        );
        console.log("\n[1/3] Oracle (USDC/GOJPAY) deployed at:", address(oracle1));

        // Oracle 2: USDC (loan) <> GOJREC (collateral)
        //   collateralPrice = GOJREC = $0.80, loanPrice = USDC = $1.0
        PriceOracle oracle2 = new PriceOracle(
            usdcAddress,         // loanToken
            gojrecAddress,       // collateralToken
            GOJREC_USD_PRICE,    // initialCollateralUsdPrice ($0.80)
            USDC_USD_PRICE,      // initialLoanUsdPrice ($1.0)
            DECIMALS_18,         // loanTokenDecimals (USDC)
            DECIMALS_18          // collateralTokenDecimals (GOJREC)
        );
        console.log("[2/3] Oracle (USDC/GOJREC) deployed at:", address(oracle2));

        // Oracle 3: USDC (loan) <> GOJFIN (collateral)
        //   collateralPrice = GOJFIN = $1.20, loanPrice = USDC = $1.0
        PriceOracle oracle3 = new PriceOracle(
            usdcAddress,         // loanToken
            gojfinAddress,       // collateralToken
            GOJFIN_USD_PRICE,    // initialCollateralUsdPrice ($1.20)
            USDC_USD_PRICE,      // initialLoanUsdPrice ($1.0)
            DECIMALS_18,         // loanTokenDecimals (USDC)
            DECIMALS_18          // collateralTokenDecimals (GOJFIN)
        );
        console.log("[3/3] Oracle (USDC/GOJFIN) deployed at:", address(oracle3));

        vm.stopBroadcast();

        // Verification
        console.log("\n===========================================");
        console.log("Oracle Deployment Results");
        console.log("===========================================");
        console.log("Oracle 1 (USDC loan / GOJPAY collateral):", address(oracle1));
        console.log("Oracle 2 (USDC loan / GOJREC collateral):", address(oracle2));
        console.log("Oracle 3 (USDC loan / GOJFIN collateral):", address(oracle3));

        // Sanity checks
        require(address(oracle1) != address(0), "Oracle 1 deployment failed");
        require(address(oracle2) != address(0), "Oracle 2 deployment failed");
        require(address(oracle3) != address(0), "Oracle 3 deployment failed");

        console.log("\n[OK] All 3 oracles deployed successfully!");

        console.log("\n===========================================");
        console.log("Update your .env with:");
        console.log("===========================================");
        console.log("ORACLE_USDC_GOJPAY_ADDRESS=%s", address(oracle1));
        console.log("ORACLE_USDC_GOJREC_ADDRESS=%s", address(oracle2));
        console.log("ORACLE_USDC_GOJFIN_ADDRESS=%s", address(oracle3));
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
