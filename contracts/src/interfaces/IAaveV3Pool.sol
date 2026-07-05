// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The two Aave v3 Pool entrypoints the YieldAdapter uses. Supplying mints aTokens
///         1:1 that rebase with interest; withdrawing burns them back to the underlying.
///         Celo mainnet pool: 0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402.
interface IAaveV3Pool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)
        external;

    /// @dev Pass type(uint256).max as `amount` to withdraw the full aToken balance.
    ///      Returns the amount actually withdrawn.
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}
