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
    uint256 public targetApyBps;
    string public poolMetadata;
    uint256 public minimumStakePeriod;
    uint256 public redemptionStart;
    uint256 public poolCapacity;
    uint256 public poolTerm;
    bool public countryPolicyEnabled;

    address[] public receivables;
    mapping(address => bool) public isReceivable;
    mapping(address => uint256) public custodiedAmounts;
    mapping(address => uint256) public depositedAt;
    mapping(bytes2 => bool) public allowedCountries;

    event Deposited(address indexed investor, uint256 amount, uint256 shares);
    event Redeemed(address indexed investor, uint256 amount, uint256 shares);
    event ReceivableAdded(address indexed receivable, uint256 amount, uint256 managerShares);
    event DepositsClosed();
    event RedemptionsOpened();
    event CountryPolicyUpdated(bytes2 indexed countryCode, bool allowed);
    event ReceivableRemoved(address indexed receivable);
    event PoolPolicyUpdated(uint256 targetApyBps, string metadata, uint256 minimumStakePeriod);
    event ReceivableFinanced(address indexed receivable, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        address registry_,
        uint8 requiredTier_,
        bytes2[] memory allowedCountries_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        complianceRegistry = IComplianceRegistry(registry_);
        requiredComplianceTier = requiredTier_;
        for (uint256 i = 0; i < allowedCountries_.length; i++) {
            require(allowedCountries_[i] != bytes2(0), "Invalid country");
            allowedCountries[allowedCountries_[i]] = true;
        }
        countryPolicyEnabled = allowedCountries_.length > 0;
    }

    function deposit() external payable returns (uint256 shares) {
        require(depositsOpen, "Deposits closed");
        require(msg.value > 0, "Zero deposit");
        require(poolCapacity == 0 || totalAssets() + msg.value <= poolCapacity, "Pool capacity reached");
        if (address(complianceRegistry) != address(0)) {
            bytes2 country = complianceRegistry.countryOf(msg.sender);
            if (countryPolicyEnabled) require(allowedCountries[country], "Country not allowed");
            require(complianceRegistry.isEligibleForCountry(msg.sender, requiredComplianceTier, country), "Identity not eligible");
        }

        uint256 supply = totalSupply();
        uint256 assets = address(this).balance - msg.value;
        shares = supply == 0 || assets == 0 ? msg.value : (msg.value * supply) / assets;
        _mint(msg.sender, shares);
        if (depositedAt[msg.sender] == 0) depositedAt[msg.sender] = block.timestamp;
        emit Deposited(msg.sender, msg.value, shares);
    }

    function addReceivable(address receivable, uint256 amount) external onlyOwner returns (uint256 managerShares) {
        require(receivable != address(0), "Zero receivable");
        require(amount > 0, "Zero amount");
        uint256 value = _receivableValue(receivable, amount);
        uint256 assetsBefore = totalAssets();
        uint256 supply = totalSupply();
        managerShares = supply == 0 || assetsBefore == 0 ? value : (value * supply) / assetsBefore;
        require(ReceivableToken(receivable).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        if (!isReceivable[receivable]) {
            isReceivable[receivable] = true;
            receivables.push(receivable);
        }
        custodiedAmounts[receivable] += amount;
        _mint(msg.sender, managerShares);
        emit ReceivableAdded(receivable, amount, managerShares);
    }

    function removeReceivable(address receivable, uint256 amount) external onlyOwner {
        require(isReceivable[receivable], "Receivable not added");
        require(depositsOpen, "Deposits closed");
        require(totalSupply() == balanceOf(owner()), "Investor shares exist");
        require(amount > 0 && amount <= custodiedAmounts[receivable], "Invalid amount");
        uint256 shares = (amount * totalSupply()) / totalAssets();
        custodiedAmounts[receivable] -= amount;
        _burn(owner(), shares);
        require(ReceivableToken(receivable).transfer(owner(), amount), "Transfer failed");
        if (custodiedAmounts[receivable] == 0) isReceivable[receivable] = false;
        emit ReceivableRemoved(receivable);
    }

    function financeReceivable(address receivable, uint256 amount) external onlyOwner {
        require(isReceivable[receivable], "Receivable not added");
        require(address(this).balance >= amount, "Insufficient pool cash");
        uint256 balanceBefore = ReceivableToken(receivable).balanceOf(address(this));
        ReceivableToken(receivable).finance{value: amount}();
        custodiedAmounts[receivable] += ReceivableToken(receivable).balanceOf(address(this)) - balanceBefore;
        emit ReceivableFinanced(receivable, amount);
    }

    function redeemReceivable(address receivable) external onlyOwner {
        require(isReceivable[receivable], "Receivable not added");
        uint256 balanceBefore = ReceivableToken(receivable).balanceOf(address(this));
        ReceivableToken(receivable).redeem();
        custodiedAmounts[receivable] -= balanceBefore;
    }

    function closeDeposits() external onlyOwner {
        depositsOpen = false;
        emit DepositsClosed();
    }

    function openRedemptions() external onlyOwner {
        require(!depositsOpen, "Deposits still open");
        for (uint256 i = 0; i < receivables.length; i++) {
            require(custodiedAmounts[receivables[i]] == 0, "Underlying receivables not redeemed");
        }
        redemptionsOpen = true;
        redemptionStart = block.timestamp;
        emit RedemptionsOpened();
    }

    function setAllowedCountry(bytes2 countryCode, bool allowed) external onlyOwner {
        require(countryCode != bytes2(0), "Country required");
        allowedCountries[countryCode] = allowed;
        countryPolicyEnabled = true;
        emit CountryPolicyUpdated(countryCode, allowed);
    }

    function setPoolPolicy(uint256 newTargetApyBps, string calldata metadata, uint256 newMinimumStakePeriod, uint256 newPoolCapacity, uint256 newPoolTerm) external onlyOwner {
        require(newTargetApyBps <= 5000, "APY too high");
        targetApyBps = newTargetApyBps;
        poolMetadata = metadata;
        minimumStakePeriod = newMinimumStakePeriod;
        poolCapacity = newPoolCapacity;
        poolTerm = newPoolTerm;
        emit PoolPolicyUpdated(targetApyBps, metadata, minimumStakePeriod);
    }

    function getReceivables() external view returns (address[] memory) {
        return receivables;
    }

    function isCountryAllowed(bytes2 countryCode) external view returns (bool) {
        return allowedCountries[countryCode];
    }

    function redeem(uint256 shares) external returns (uint256 amount) {
        require(redemptionsOpen, "Redemptions not open");
        require(shares > 0 && balanceOf(msg.sender) >= shares, "Invalid shares");
        require(block.timestamp >= depositedAt[msg.sender] + minimumStakePeriod, "Minimum stake not reached");
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

    function totalAssets() public view returns (uint256 assets) {
        assets = address(this).balance;
        for (uint256 i = 0; i < receivables.length; i++) {
            assets += _receivableValue(receivables[i], custodiedAmounts[receivables[i]]);
        }
    }

    function receivableValue(address receivable) external view returns (uint256) {
        return _receivableValue(receivable, custodiedAmounts[receivable]);
    }

    function _receivableValue(address receivable, uint256 amount) internal view returns (uint256) {
        if (amount == 0) return 0;
        uint256 supply = ReceivableToken(receivable).totalSupply();
        if (supply == 0) return 0;
        return (amount * ReceivableToken(receivable).totalReceivable()) / supply;
    }

    receive() external payable {}
}
