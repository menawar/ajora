// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IStreakSBT } from "../../src/interfaces/IStreakSBT.sol";

/// @notice Test double for IStreakSBT with a settable multiplier (scaled by 10).
contract MockStreakSBT is IStreakSBT {
    mapping(address => uint256) public mult;
    mapping(address => uint256) public streak;

    function setMultiplier(address user, uint256 multiplierX10) external {
        mult[user] = multiplierX10;
    }

    function checkIn() external {
        streak[msg.sender] += 1;
        emit CheckedIn(msg.sender, streak[msg.sender], mult[msg.sender]);
    }

    function streakOf(address user) external view returns (uint256) {
        return streak[user];
    }

    function multiplierOf(address user) external view returns (uint256) {
        return mult[user];
    }

    function hasBadge(address, uint256) external pure returns (bool) {
        return false;
    }
}
