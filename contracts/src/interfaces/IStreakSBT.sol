// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IStreakSBT
/// @notice Soulbound record of a user's daily savings streak. Drives the ticket multiplier
///         used by PotVault and mints non-transferable milestone badges.
/// @dev Multipliers are scaled by 10: 10 = 1.0x, 15 = 1.5x, 20 = 2.0x, 30 = 3.0x.
///      See AJORA_SPEC.md §8.5.
interface IStreakSBT {
    event CheckedIn(address indexed user, uint256 streakDays, uint256 multiplierX10);
    event BadgeMinted(address indexed user, uint256 indexed badgeId);

    /// @notice Records a daily check-in; extends the streak or restarts it after a missed day.
    /// @dev Reverts if the user already checked in during the current day window.
    function checkIn() external;

    /// @notice Current live streak in days. 0 if the streak is broken (no check-in yesterday/today).
    function streakOf(address user) external view returns (uint256);

    /// @notice Ticket multiplier from the current live streak, scaled by 10 (expected >= 10).
    function multiplierOf(address user) external view returns (uint256 multiplierX10);

    /// @notice Whether the user holds the milestone badge (badgeId = streak-days milestone).
    function hasBadge(address user, uint256 badgeId) external view returns (bool);
}
