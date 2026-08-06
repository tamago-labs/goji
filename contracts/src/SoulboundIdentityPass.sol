// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SoulboundIdentityPass
/// @notice One non-transferable identity pass per wallet.
/// @dev Compliance data is kept in the private Goji workspace. The NFT only
/// binds a wallet to a generated pass and token id.
contract SoulboundIdentityPass is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    mapping(address => uint256) private _walletTokens;
    mapping(uint256 => bytes32) private _tokenPassIds;
    mapping(uint256 => uint64) private _expiresAt;
    mapping(uint256 => bool) private _revoked;

    event IdentityPassMinted(address indexed wallet, uint256 indexed tokenId, bytes32 indexed passId);
    event IdentityPassExpirationUpdated(uint256 indexed tokenId, uint64 expiresAt);
    event IdentityPassRevoked(uint256 indexed tokenId, bool revoked);

    constructor() ERC721("Goji Identity Pass", "GOJI-ID") Ownable(msg.sender) {}

    function mint() external returns (uint256 tokenId, bytes32 passId) {
        require(_walletTokens[msg.sender] == 0, "Wallet already has a pass");

        tokenId = _nextTokenId++;
        passId = keccak256(abi.encodePacked(address(this), block.chainid, msg.sender, tokenId));
        _walletTokens[msg.sender] = tokenId;
        _tokenPassIds[tokenId] = passId;
        _safeMint(msg.sender, tokenId);

        emit IdentityPassMinted(msg.sender, tokenId, passId);
    }

    function hasPass(address wallet) external view returns (bool) {
        return _walletTokens[wallet] != 0;
    }

    function tokenIdOf(address wallet) external view returns (uint256) {
        uint256 tokenId = _walletTokens[wallet];
        require(tokenId != 0, "Wallet has no pass");
        return tokenId;
    }

    function passIdOf(address wallet) external view returns (bytes32) {
        uint256 tokenId = _walletTokens[wallet];
        require(tokenId != 0, "Wallet has no pass");
        return _tokenPassIds[tokenId];
    }

    function passIdByToken(uint256 tokenId) external view returns (bytes32) {
        require(_ownerOf(tokenId) != address(0), "Pass does not exist");
        return _tokenPassIds[tokenId];
    }

    function expirationOf(uint256 tokenId) external view returns (uint64) {
        require(_ownerOf(tokenId) != address(0), "Pass does not exist");
        return _expiresAt[tokenId];
    }

    function revoked(uint256 tokenId) external view returns (bool) {
        return _revoked[tokenId];
    }

    function isValid(address wallet) public view returns (bool) {
        uint256 tokenId = _walletTokens[wallet];
        if (tokenId == 0 || _revoked[tokenId]) return false;
        return _expiresAt[tokenId] == 0 || block.timestamp <= _expiresAt[tokenId];
    }

    function setExpiration(uint256 tokenId, uint64 expiresAt) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Pass does not exist");
        _expiresAt[tokenId] = expiresAt;
        emit IdentityPassExpirationUpdated(tokenId, expiresAt);
    }

    function setRevoked(uint256 tokenId, bool value) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Pass does not exist");
        _revoked[tokenId] = value;
        emit IdentityPassRevoked(tokenId, value);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = super._update(to, tokenId, auth);
        if (from != address(0) && to != address(0)) revert("Soulbound: non-transferable");
        return from;
    }
}
