// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReceivableToken
/// @notice ERC-20 token representing a verified receivable from Goji
/// @dev Fractional ownership token for invoice/payroll financing
contract ReceivableToken is ERC20, Ownable {
    // ──────────────────────────── Events ────────────────────────────────
    event ReceivableFunded(address indexed investor, uint256 amount, uint256 tokens);
    event RepaymentClaimed(address indexed company, uint256 amount);
    event Redeemed(address indexed investor, uint256 amount);

    // ──────────────────────────── Enums ─────────────────────────────────
    enum Status { Active, Funded, Expired, Redeemed, Defaulted }

    // ──────────────────────────── Storage ───────────────────────────────
    string public receivableType;
    address public issuer;
    bytes32[] public proofHashes;

    // Terms
    uint256 public totalReceivable;
    uint256 public interestRate;
    uint256 public minInvestment;
    uint256 public maxSupply;
    uint256 public issuedAt;
    uint256 public expiresAt;

    // Funding
    uint256 public fundedAmount;
    uint256 public totalRedeemable; // snapshot of balance at repayment time

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
        bytes32[] memory _proofHashes
    ) ERC20(_name, _generateSymbol(_receivableType)) Ownable(msg.sender) {
        require(_totalReceivable > 0, "Zero amount");
        require(_interestRate <= 5000, "Interest too high");
        require(_expiresAt > block.timestamp, "Invalid expiry");
        require(_proofHashes.length > 0, "No proofs");

        issuer = msg.sender;
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
    function finance() external payable {
        require(status == Status.Active, "Not active");
        require(block.timestamp < expiresAt, "Receivable expired");
        require(msg.value >= minInvestment, "Below minimum investment");
        require(fundedAmount + msg.value <= totalReceivable, "Exceeds total");

        uint256 tokens = (msg.value * maxSupply) / totalReceivable;

        fundedAmount += msg.value;
        _mint(msg.sender, tokens);

        if (fundedAmount >= totalReceivable) {
            status = Status.Funded;
        }

        emit ReceivableFunded(msg.sender, msg.value, tokens);
    }

    /// @notice Company claims repayment (deposits principal + interest)
    function claimRepayment() external payable {
        require(status == Status.Active || status == Status.Funded, "Not claimable");
        require(block.timestamp >= expiresAt, "Not expired yet");

        uint256 repaymentNeeded = getRepaymentAmount();
        require(msg.value >= repaymentNeeded, "Insufficient repayment");

        totalRedeemable = address(this).balance;
        status = Status.Redeemed;

        emit RepaymentClaimed(msg.sender, msg.value);
    }

    /// @notice Investor redeems tokens for proportional share
    function redeem() external {
        require(status == Status.Redeemed, "Not ready for redemption");
        require(balanceOf(msg.sender) > 0, "No tokens to redeem");

        uint256 tokens = balanceOf(msg.sender);
        uint256 share = (tokens * totalRedeemable) / maxSupply;

        _burn(msg.sender, tokens);

        (bool success, ) = payable(msg.sender).call{value: share}("");
        require(success, "Transfer failed");

        emit Redeemed(msg.sender, share);
    }

    // ──────────────────────────── View Functions ────────────────────────

    /// @notice Get repayment amount (principal + interest)
    function getRepaymentAmount() public view returns (uint256) {
        uint256 interest = (totalReceivable * interestRate) / 10000;
        return totalReceivable + interest;
    }

    /// @notice Get investor's share of repayment
    function getShare(address investor) external view returns (uint256) {
        uint256 tokens = balanceOf(investor);
        if (tokens == 0) return 0;
        if (totalRedeemable == 0) return 0;
        return (tokens * totalRedeemable) / maxSupply;
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
        } else if (keccak256(bytes(_type)) == keccak256(bytes("payroll"))) {
            return "GOJPAY";
        } else if (keccak256(bytes(_type)) == keccak256(bytes("contractor"))) {
            return "GOJCONT";
        }
        return "GOJRWA";
    }
}
