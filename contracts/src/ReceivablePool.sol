// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReceivableToken.sol";

/// @title ReceivablePool
/// @notice A simple pooled-financing vault for multiple receivables.
/// @dev Pool shares represent a pro-rata claim on native USDC held by the pool.
contract ReceivablePool is ERC20, Ownable {
    IComplianceRegistry public immutable complianceRegistry;
    uint8 public immutable requiredComplianceTier;
    bool public depositsOpen = true;
    bool public redemptionsOpen;

    address[] public receivables;
    mapping(address => bool) public isReceivable;
    mapping(bytes2 => bool) public allowedCountries;

    event Deposited(address indexed investor, uint256 amount, uint256 shares);
    event Redeemed(address indexed investor, uint256 amount, uint256 shares);
    event ReceivableAdded(address indexed receivable);
    event DepositsClosed();
    event RedemptionsOpened();
    event CountryPolicyUpdated(bytes2 indexed countryCode, bool allowed);

    constructor(
        string memory name_,
        string memory symbol_,
        address registry_,
        uint8 requiredTier_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        complianceRegistry = IComplianceRegistry(registry_);
        requiredComplianceTier = requiredTier_;
    }

    function deposit() external payable returns (uint256 shares) {
        require(depositsOpen, "Deposits closed");
        require(msg.value > 0, "Zero deposit");
        if (address(complianceRegistry) != address(0)) {
            bytes2 country = complianceRegistry.countryOf(msg.sender);
            require(allowedCountries[country], "Country not allowed");
            require(complianceRegistry.isEligibleForCountry(msg.sender, requiredComplianceTier, country), "Identity not eligible");
        }

        uint256 supply = totalSupply();
        uint256 assets = address(this).balance - msg.value;
        shares = supply == 0 || assets == 0 ? msg.value : (msg.value * supply) / assets;
        _mint(msg.sender, shares);
        emit Deposited(msg.sender, msg.value, shares);
    }

    function addReceivable(address receivable) external onlyOwner {
        require(receivable != address(0), "Zero receivable");
        require(!isReceivable[receivable], "Receivable already added");
        isReceivable[receivable] = true;
        receivables.push(receivable);
        emit ReceivableAdded(receivable);
    }

    function financeReceivable(address receivable, uint256 amount) external onlyOwner {
        require(isReceivable[receivable], "Receivable not added");
        ReceivableToken(receivable).finance{value: amount}();
    }

    function redeemReceivable(address receivable) external onlyOwner {
        require(isReceivable[receivable], "Receivable not added");
        ReceivableToken(receivable).redeem();
    }

    function closeDeposits() external onlyOwner {
        depositsOpen = false;
        emit DepositsClosed();
    }

    function openRedemptions() external onlyOwner {
        require(!depositsOpen, "Deposits still open");
        redemptionsOpen = true;
        emit RedemptionsOpened();
    }

    function setAllowedCountry(bytes2 countryCode, bool allowed) external onlyOwner {
        require(countryCode != bytes2(0), "Country required");
        allowedCountries[countryCode] = allowed;
        emit CountryPolicyUpdated(countryCode, allowed);
    }

    function isCountryAllowed(bytes2 countryCode) external view returns (bool) {
        return allowedCountries[countryCode];
    }

    function redeem(uint256 shares) external returns (uint256 amount) {
        require(redemptionsOpen, "Redemptions not open");
        require(shares > 0 && balanceOf(msg.sender) >= shares, "Invalid shares");
        uint256 supply = totalSupply();
        amount = (address(this).balance * shares) / supply;
        _burn(msg.sender, shares);
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit Redeemed(msg.sender, amount, shares);
    }

    function receivableCount() external view returns (uint256) {
        return receivables.length;
    }

    receive() external payable {}
}
