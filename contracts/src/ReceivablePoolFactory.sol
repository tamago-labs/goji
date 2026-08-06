// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ReceivablePool.sol";

/// @title ReceivablePoolFactory
/// @notice Creates pools managed by financial partners.
contract ReceivablePoolFactory {
    address public owner;
    address[] public pools;
    mapping(address => address[]) public managers;

    event PoolCreated(address indexed pool, address indexed manager, address registry, uint8 requiredTier);

    constructor() {
        owner = msg.sender;
    }

    function createPool(
        string memory name,
        string memory symbol,
        address registry,
        uint8 requiredTier,
        bytes2[] memory allowedCountries
    ) external returns (address pool) {
        ReceivablePool created = new ReceivablePool(name, symbol, registry, requiredTier, allowedCountries);
        created.transferOwnership(msg.sender);
        pool = address(created);
        pools.push(pool);
        managers[msg.sender].push(pool);
        emit PoolCreated(pool, msg.sender, registry, requiredTier);
    }

    function poolCount() external view returns (uint256) {
        return pools.length;
    }

    function getPools() external view returns (address[] memory) {
        return pools;
    }

    function getPoolsByManager(address manager) external view returns (address[] memory) {
        return managers[manager];
    }
}
