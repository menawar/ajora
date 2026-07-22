// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IPoolAddressesProvider } from "../../src/interfaces/IPoolAddressesProvider.sol";

contract MockPoolAddressesProvider is IPoolAddressesProvider {
    address public pool;

    constructor(address _pool) {
        pool = _pool;
    }

    function getPool() external view returns (address) {
        return pool;
    }
}
