// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.20;

import {IOracle} from "./interfaces/IOracle.sol";
import {IPyth} from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/// @title PriceOracle
/// @notice Simplified price oracle supporting custom values and Pyth
/// @dev Each instance is bound to one collateral/loan pair at construction
contract PriceOracle is IOracle {
    // ──────────────────────────── Immutables ────────────────────────────
    address public immutable LOAN_TOKEN;
    address public immutable COLLATERAL_TOKEN;
    uint8 public immutable LOAN_TOKEN_DECIMALS;
    uint8 public immutable COLLATERAL_TOKEN_DECIMALS;

    // ──────────────────────────── Storage ───────────────────────────────
    address public owner;

    // Custom USD prices (scaled by 1e18)
    uint256 public collateralUsdPrice;
    uint256 public loanUsdPrice;
    uint256 public lastPriceUpdateTime;

    // Oracle mode: 0=custom, 1=pyth
    uint8 public collateralOracleMode;
    uint8 public loanOracleMode;

    // Pyth oracle
    IPyth public pyth;
    bytes32 public collateralPythFeedId;
    bytes32 public loanPythFeedId;

    // Configuration
    uint256 public stalenessThreshold;
    uint256 public constant PRICE_UPDATE_DELAY = 1 hours;

    // Access control
    mapping(address => bool) public whitelist;

    // ──────────────────────────── Events ────────────────────────────────
    event PriceUpdated(uint256 collateralUsdPrice, uint256 loanUsdPrice);
    event OracleModeSet(uint8 collateralMode, uint8 loanMode);
    event PythFeedSet(bytes32 collateralFeedId, bytes32 loanFeedId);
    event PythContractSet(address indexed pythContract);
    event WhitelistUpdated(address indexed user, bool whitelisted);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ──────────────────────────── Errors ────────────────────────────────
    error NotWhitelisted();
    error NotOwner();
    error ZeroPrice();
    error UpdateTooFrequent();
    error InvalidOracleMode();
    error FeedNotConfigured();
    error OracleContractNotSet();

    // ──────────────────────────── Constructor ───────────────────────────
    constructor(
        address loanToken,
        address collateralToken,
        uint256 initialCollateralUsdPrice,
        uint256 initialLoanUsdPrice,
        uint8 loanTokenDecimals,
        uint8 collateralTokenDecimals
    ) {
        owner = msg.sender;
        whitelist[msg.sender] = true;
        LOAN_TOKEN = loanToken;
        COLLATERAL_TOKEN = collateralToken;
        LOAN_TOKEN_DECIMALS = loanTokenDecimals;
        COLLATERAL_TOKEN_DECIMALS = collateralTokenDecimals;
        collateralUsdPrice = initialCollateralUsdPrice;
        loanUsdPrice = initialLoanUsdPrice;
        lastPriceUpdateTime = block.timestamp;
        stalenessThreshold = 3600;
    }

    // ──────────────────────────── Price Feed ────────────────────────────

    function price() external view returns (uint256) {
        uint256 collUsd = _getCollateralUsdPrice();
        uint256 loanUsd = _getLoanUsdPrice();
        require(collUsd > 0, "collateral price not set");
        require(loanUsd > 0, "loan price not set");

        uint256 priceScale = 10 ** (uint256(LOAN_TOKEN_DECIMALS) + 36 - uint256(COLLATERAL_TOKEN_DECIMALS));
        return (collUsd * priceScale) / loanUsd;
    }

    function _getCollateralUsdPrice() internal view returns (uint256) {
        if (collateralOracleMode == 0) {
            return collateralUsdPrice;
        } else {
            return _getPythPrice(collateralPythFeedId);
        }
    }

    function _getLoanUsdPrice() internal view returns (uint256) {
        if (loanOracleMode == 0) {
            return loanUsdPrice;
        } else {
            return _getPythPrice(loanPythFeedId);
        }
    }

    function _getPythPrice(bytes32 feedId) internal view returns (uint256) {
        if (address(pyth) == address(0)) revert OracleContractNotSet();
        if (feedId == bytes32(0)) revert FeedNotConfigured();

        PythStructs.Price memory pythPrice = pyth.getPriceNoOlderThan(feedId, stalenessThreshold);
        require(pythPrice.price > 0, "Invalid Pyth price");

        int64 price = pythPrice.price;
        int32 expo = pythPrice.expo;

        uint256 adjustedPrice = uint256(uint64(price));
        if (expo >= 0) {
            adjustedPrice = adjustedPrice * (10 ** uint32(expo));
        } else {
            adjustedPrice = adjustedPrice / (10 ** uint32(-expo));
        }
        return adjustedPrice * 1e18 / 1e8;
    }

    // ──────────────────────────── Admin Functions ───────────────────────

    function setCustomPrice(uint256 newCollateralUsdPrice, uint256 newLoanUsdPrice) external {
        if (!whitelist[msg.sender]) revert NotWhitelisted();
        if (newCollateralUsdPrice == 0 || newLoanUsdPrice == 0) revert ZeroPrice();
        if (block.timestamp < lastPriceUpdateTime + PRICE_UPDATE_DELAY) revert UpdateTooFrequent();

        collateralUsdPrice = newCollateralUsdPrice;
        loanUsdPrice = newLoanUsdPrice;
        lastPriceUpdateTime = block.timestamp;
        collateralOracleMode = 0;
        loanOracleMode = 0;

        emit PriceUpdated(newCollateralUsdPrice, newLoanUsdPrice);
    }

    function setPythFeed(bytes32 collateralFeedId, bytes32 loanFeedId) external {
        if (msg.sender != owner) revert NotOwner();
        collateralPythFeedId = collateralFeedId;
        loanPythFeedId = loanFeedId;
        collateralOracleMode = 1;
        loanOracleMode = 1;
        emit PythFeedSet(collateralFeedId, loanFeedId);
        emit OracleModeSet(1, 1);
    }

    function setPyth(address _pyth) external {
        if (msg.sender != owner) revert NotOwner();
        pyth = IPyth(_pyth);
        emit PythContractSet(_pyth);
    }

    function setStalenessThreshold(uint256 newThreshold) external {
        if (msg.sender != owner) revert NotOwner();
        stalenessThreshold = newThreshold;
    }

    function addToWhitelist(address user) external {
        if (msg.sender != owner) revert NotOwner();
        whitelist[user] = true;
        emit WhitelistUpdated(user, true);
    }

    function removeFromWhitelist(address user) external {
        if (msg.sender != owner) revert NotOwner();
        whitelist[user] = false;
        emit WhitelistUpdated(user, false);
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert NotOwner();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ──────────────────────────── View Helpers ──────────────────────────

    function getCollateralUsdPrice() external view returns (uint256) {
        return _getCollateralUsdPrice();
    }

    function getLoanUsdPrice() external view returns (uint256) {
        return _getLoanUsdPrice();
    }

    function getPriceInfo() external view returns (
        uint8 collMode,
        uint8 lnMode,
        uint256 collUsd,
        uint256 lnUsd,
        uint256 morphoPrice
    ) {
        collMode = collateralOracleMode;
        lnMode = loanOracleMode;
        collUsd = _getCollateralUsdPrice();
        lnUsd = _getLoanUsdPrice();
        uint256 priceScale = 10 ** (uint256(LOAN_TOKEN_DECIMALS) + 36 - uint256(COLLATERAL_TOKEN_DECIMALS));
        morphoPrice = (collUsd * priceScale) / lnUsd;
    }
}
