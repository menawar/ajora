// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ITreasury
/// @notice Collects rake from paid Big Pots, holds protocol funds, and recycles unclaimed
///         prizes back into the jara flywheel (AJORA_SPEC.md §8.7, §6 sinks).
interface ITreasury {
    event RakeCollected(uint256 amount, uint256 indexed periodId);
    event FeeWithdrawn(address indexed to, uint256 amount);
    event JaraFunded(uint256 amount, uint256 indexed periodId);

    /// @notice Pull `amount` of rake from the caller (a paid Big Pot) and account it.
    function collectRake(uint256 amount, uint256 periodId) external;

    /// @notice Recycle a resolved period's unclaimed prize remainder forward. Permissionless
    ///         once the claim window has passed.
    function sweepUnclaimed(uint256 periodId) external;
}
