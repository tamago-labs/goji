// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IComplianceRegistry {
    function isEligible(address wallet, uint8 requiredTier) external view returns (bool);
    function countryOf(address wallet) external view returns (bytes2);
    function isEligibleForCountry(address wallet, uint8 requiredTier, bytes2 countryCode) external view returns (bool);
}

/// @title ReceivableToken
/// @notice ERC-20 token representing a verified receivable from Goji
/// @dev Fractional ownership token for invoice/payment financing
/// @dev Interest is calculated pro-rata based on actual funding duration
contract ReceivableToken is ERC20, Ownable {
    // ──────────────────────────── Events ────────────────────────────────
    event ReceivableFunded(address indexed investor, uint256 amount, uint256 tokens);
    event RepaymentClaimed(address indexed company, uint256 amount);
    event Redeemed(address indexed investor, uint256 amount);
    event CompliancePolicyUpdated(address indexed registry, uint8 requiredTier, bytes2[] allowedCountries);

    // ──────────────────────────── Enums ─────────────────────────────────
    enum Status { Active, Funded, Expired, Redeemed, Defaulted }

    // ──────────────────────────── Storage ───────────────────────────────
    string public receivableType;
    address public issuer;
    bytes32[] public proofHashes;

    // Terms
    uint256 public totalReceivable;
    uint256 public interestRate;      // Basis points (2000 = 20% APR)
    uint256 public minInvestment;
    uint256 public maxSupply;
    uint256 public issuedAt;
    uint256 public expiresAt;
    address public complianceRegistry;
    uint8 public requiredComplianceTier;
    bytes2[] public allowedCountries;

    // Funding
    uint256 public fundedAmount;
    uint256 public totalRedeemable;   // snapshot of balance at repayment time

    // Pro-rata interest tracking
    mapping(address => uint256) public fundingDate;   // investor → timestamp they funded
    mapping(address => uint256) public investedAmount; // investor → USDC amount invested

    // State
    Status public status;

    // ──────────────────────────── Constructor ───────────────────────────
    constructor(
        string memory _name,
        string memory _receivableType,
        uint256 _totalReceivable,
        uint256 _interestRate,
        uint256 _minInvestment,
        uint256 _expiresAt,
        bytes32[] memory _proofHashes,
        address _issuer
    ) ERC20(_name, _generateSymbol(_receivableType)) Ownable(msg.sender) {
        require(_totalReceivable > 0, "Zero amount");
        require(_interestRate <= 5000, "Interest too high");
        require(_expiresAt > block.timestamp, "Invalid expiry");
        require(_proofHashes.length > 0, "No proofs");
        require(_issuer != address(0), "Zero issuer");

        issuer = _issuer;
        receivableType = _receivableType;
        totalReceivable = _totalReceivable;
        interestRate = _interestRate;
        minInvestment = _minInvestment;
        expiresAt = _expiresAt;
        proofHashes = _proofHashes;
        issuedAt = block.timestamp;
        maxSupply = 1_000_000 * 1e6;
        status = Status.Active;
    }

    // ──────────────────────────── Core Functions ────────────────────────

    /// @notice Finance this receivable (investor sends native USDC on Arc)
    /// @dev Funds are sent directly to the issuer (company)
    function finance() external payable {
        require(status == Status.Active, "Not active");
        require(block.timestamp < expiresAt, "Receivable expired");
        require(msg.value >= minInvestment, "Below minimum investment");
        require(fundedAmount + msg.value <= totalReceivable, "Exceeds total");
        if (complianceRegistry != address(0)) {
            require(IComplianceRegistry(complianceRegistry).isEligible(msg.sender, requiredComplianceTier), "Identity not eligible");
            if (allowedCountries.length > 0) {
                require(isCountryAllowed(IComplianceRegistry(complianceRegistry).countryOf(msg.sender)), "Country not eligible");
            }
        }

        uint256 tokens = (msg.value * maxSupply) / totalReceivable;

        fundedAmount += msg.value;
        _mint(msg.sender, tokens);

        // Track funding date and amount for pro-rata interest
        fundingDate[msg.sender] = block.timestamp;
        investedAmount[msg.sender] += msg.value;

        if (fundedAmount >= totalReceivable) {
            status = Status.Funded;
        }

        // Send funds to issuer (company receives the money)
        (bool success, ) = payable(issuer).call{value: msg.value}("");
        require(success, "Transfer to issuer failed");

        emit ReceivableFunded(msg.sender, msg.value, tokens);
    }

    /// @notice Set optional identity eligibility requirements for investors.
    /// @dev The factory is the owner for factory-created receivables.
    function setCompliancePolicy(address registry, uint8 tier, bytes2[] memory countries) external onlyOwner {
        complianceRegistry = registry;
        requiredComplianceTier = tier;
        delete allowedCountries;
        for (uint256 i = 0; i < countries.length; i++) {
            require(countries[i] != bytes2(0), "Invalid country");
            allowedCountries.push(countries[i]);
        }
        emit CompliancePolicyUpdated(registry, tier, countries);
    }

    function getAllowedCountries() external view returns (bytes2[] memory) {
        return allowedCountries;
    }

    function isCountryAllowed(bytes2 countryCode) public view returns (bool) {
        if (allowedCountries.length == 0) return true;
        for (uint256 i = 0; i < allowedCountries.length; i++) {
            if (allowedCountries[i] == countryCode) return true;
        }
        return false;
    }

    /// @notice Company claims repayment (deposits principal + pro-rata interest)
    function claimRepayment() external payable {
        require(msg.sender == issuer, "Only issuer");
        require(status == Status.Active || status == Status.Funded, "Not claimable");
        require(block.timestamp >= expiresAt, "Not expired yet");

        uint256 repaymentNeeded = getTotalRepayment();
        require(msg.value >= repaymentNeeded, "Insufficient repayment");

        totalRedeemable = address(this).balance;
        status = Status.Redeemed;

        emit RepaymentClaimed(msg.sender, msg.value);
    }

    /// @notice Investor redeems tokens for pro-rata share
    function redeem() external {
        require(status == Status.Redeemed, "Not ready for redemption");
        require(balanceOf(msg.sender) > 0, "No tokens to redeem");

        uint256 tokens = balanceOf(msg.sender);
        uint256 share = calculateShare(msg.sender);

        _burn(msg.sender, tokens);

        (bool success, ) = payable(msg.sender).call{value: share}("");
        require(success, "Transfer failed");

        emit Redeemed(msg.sender, share);
    }

    // ──────────────────────────── View Functions ────────────────────────

    /// @notice Calculate pro-rata share for an investor
    /// @dev Returns: principal portion (based on tokens) + interest portion (based on time invested)
    function calculateShare(address investor) public view returns (uint256) {
        if (balanceOf(investor) == 0 || totalRedeemable == 0) return 0;

        // Principal portion: proportional to tokens held
        uint256 principal = (balanceOf(investor) * totalReceivable) / maxSupply;

        // Interest portion: based on actual days invested
        uint256 interest = calculateInvestorInterest(investor);

        return principal + interest;
    }

    /// @notice Calculate interest earned by a specific investor
    function calculateInvestorInterest(address investor) public view returns (uint256) {
        if (fundingDate[investor] == 0 || investedAmount[investor] == 0) return 0;

        uint256 invested = investedAmount[investor];
        uint256 fundingTime = fundingDate[investor];
        uint256 endTime = block.timestamp < expiresAt ? block.timestamp : expiresAt;
        uint256 daysInvested = (endTime - fundingTime) / 1 days;
        if (daysInvested == 0) daysInvested = 1;

        uint256 totalDays = (expiresAt - issuedAt) / 1 days;

        // interest = invested * daysInvested * interestRate / (totalDays * 10000)
        return (invested * daysInvested * interestRate) / (totalDays * 10000);
    }

    /// @notice Get total interest that should be paid
    function getTotalInterest() public view returns (uint256) {
        return (totalReceivable * interestRate) / 10000;
    }

    /// @notice Get total repayment needed (principal + total interest)
    function getTotalRepayment() public view returns (uint256) {
        return totalReceivable + getTotalInterest();
    }

    /// @notice Get number of proof hashes
    function getProofCount() external view returns (uint256) {
        return proofHashes.length;
    }

    /// @notice Get all proof hashes
    function getProofHashes() external view returns (bytes32[] memory) {
        return proofHashes;
    }

    /// @notice Get full receivable info
    function getReceivableInfo() external view returns (
        string memory _type,
        address _issuer,
        uint256 _totalReceivable,
        uint256 _interestRate,
        uint256 _minInvestment,
        uint256 _issuedAt,
        uint256 _expiresAt,
        uint256 _fundedAmount,
        Status _status
    ) {
        _type = receivableType;
        _issuer = issuer;
        _totalReceivable = totalReceivable;
        _interestRate = interestRate;
        _minInvestment = minInvestment;
        _issuedAt = issuedAt;
        _expiresAt = expiresAt;
        _fundedAmount = fundedAmount;
        _status = status;
    }

    // ──────────────────────────── Internal ──────────────────────────────

    function _generateSymbol(string memory _type) internal pure returns (string memory) {
        if (keccak256(bytes(_type)) == keccak256(bytes("invoice"))) {
            return "GOJINV";
        } else if (keccak256(bytes(_type)) == keccak256(bytes("payment"))) {
            return "GOJPAY";
        }
        return "GOJRWA";
    }
}
