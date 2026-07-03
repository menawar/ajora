// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IStreakSBT } from "./interfaces/IStreakSBT.sol";

/// @title StreakSBT
/// @notice Soulbound daily check-in record. A live streak boosts the holder's PotVault ticket
///         multiplier; milestone streaks mint non-transferable badges.
/// @dev Day windows use the same `block.timestamp / 1 days` clock as PotVault periods, so a
///      check-in day maps 1:1 to a savings period. See AJORA_SPEC.md §8.5.
contract StreakSBT is IStreakSBT {
    struct StreakData {
        uint64 lastCheckInDay; // day index of the most recent check-in
        uint64 streakDays; // streak length as of lastCheckInDay
    }

    mapping(address user => StreakData) internal _streaks;

    error AlreadyCheckedIn();

    /// @dev Multiplier scale: 10 = 1.0x.
    uint256 internal constant SCALE = 10;

    /// @notice Day index of the current day window.
    function currentDay() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /// @inheritdoc IStreakSBT
    function checkIn() external {
        uint256 today = currentDay();
        StreakData storage s = _streaks[msg.sender];

        if (s.lastCheckInDay == today && s.streakDays != 0) revert AlreadyCheckedIn();

        // Consecutive day extends the streak; any gap restarts it at 1.
        if (s.lastCheckInDay + 1 == today && s.streakDays != 0) {
            s.streakDays += 1;
        } else {
            s.streakDays = 1;
        }
        s.lastCheckInDay = uint64(today);

        emit CheckedIn(msg.sender, s.streakDays, multiplierOf(msg.sender));
    }

    /// @inheritdoc IStreakSBT
    /// @dev A streak is live if the user checked in today or yesterday; otherwise it reads 0.
    function streakOf(address user) public view returns (uint256) {
        StreakData storage s = _streaks[user];
        if (s.streakDays == 0) return 0;
        uint256 today = currentDay();
        if (s.lastCheckInDay == today || s.lastCheckInDay + 1 == today) return s.streakDays;
        return 0;
    }

    /// @inheritdoc IStreakSBT
    function multiplierOf(address) public view returns (uint256) {
        return SCALE; // flat 1.0x placeholder — tier table lands in the next commit
    }

    /// @inheritdoc IStreakSBT
    function hasBadge(address, uint256) public view returns (bool) {
        return false; // badge minting lands in a later commit
    }
}
