// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IStreakSBT
/// @notice Source of a user's ticket multiplier, derived from their savings streak.
/// @dev The returned value is scaled by 10: 10 = 1.0x, 15 = 1.5x, 20 = 2.0x, 30 = 3.0x.
///      Full implementation lands in issue #2 (see AJORA_SPEC.md §8.5).
interface IStreakSBT {
    /// @param user account to read.
    /// @return multiplierX10 streak multiplier scaled by 10 (expected >= 10).
    function multiplierOf(address user) external view returns (uint256 multiplierX10);
}
