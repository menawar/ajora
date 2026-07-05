// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IAaveV3Pool } from "../../src/interfaces/IAaveV3Pool.sol";
import { MockERC20 } from "./MockERC20.sol";

/// @notice aToken stand-in: non-transferable balance the pool mints/burns 1:1.
contract MockAToken {
    address public immutable pool;
    mapping(address => uint256) public balanceOf;

    constructor() {
        pool = msg.sender;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == pool, "pool only");
        balanceOf[to] += amount;
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == pool, "pool only");
        balanceOf[from] -= amount;
    }
}

/// @notice Minimal Aave v3 pool for tests: 1:1 supply/withdraw plus `accrue` to simulate
///         interest landing on a supplier's aToken balance.
contract MockAaveV3Pool is IAaveV3Pool {
    MockERC20 public immutable underlying;
    MockAToken public immutable aToken;

    constructor(MockERC20 _underlying) {
        underlying = _underlying;
        aToken = new MockAToken();
    }

    function supply(address, uint256 amount, address onBehalfOf, uint16) external {
        underlying.transferFrom(msg.sender, address(this), amount);
        aToken.mint(onBehalfOf, amount);
    }

    function withdraw(address, uint256 amount, address to) external returns (uint256) {
        if (amount == type(uint256).max) amount = aToken.balanceOf(msg.sender);
        aToken.burn(msg.sender, amount);
        underlying.transfer(to, amount);
        return amount;
    }

    /// @notice Simulate interest: grow `to`'s aToken balance, backed by fresh underlying.
    function accrue(address to, uint256 amount) external {
        aToken.mint(to, amount);
        underlying.mint(address(this), amount);
    }
}
