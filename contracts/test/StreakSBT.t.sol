// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { StreakSBT } from "../src/StreakSBT.sol";

contract StreakSBTTest is Test {
    StreakSBT internal sbt;
    address internal alice = address(0xA11CE);

    uint256 internal constant DAY = 1 days;

    function setUp() public {
        sbt = new StreakSBT();
        // Start at a known, non-zero day so day-index arithmetic is realistic.
        vm.warp(20_000 * DAY + 9 hours);
    }

    /// @dev Check in as alice on `n` consecutive days ending "today".
    function _streakOfDays(uint256 n) internal {
        for (uint256 i = 0; i < n; i++) {
            vm.prank(alice);
            sbt.checkIn();
            if (i < n - 1) vm.warp(block.timestamp + DAY);
        }
    }

    // ------------------------------------------------------------ check-in

    function test_FirstCheckInStartsStreakAtOne() public {
        vm.prank(alice);
        sbt.checkIn();
        assertEq(sbt.streakOf(alice), 1);
    }

    function test_RevertDoubleCheckInSameDay() public {
        vm.startPrank(alice);
        sbt.checkIn();
        vm.expectRevert(StreakSBT.AlreadyCheckedIn.selector);
        sbt.checkIn();
        vm.stopPrank();
    }

    function test_ConsecutiveDaysExtendStreak() public {
        _streakOfDays(3);
        assertEq(sbt.streakOf(alice), 3);
    }

    function test_LateNightThenEarlyMorningStillConsecutive() public {
        // 23:50 on day N, then 00:10 on day N+1 — different windows, consecutive days.
        vm.warp((block.timestamp / DAY) * DAY + 23 hours + 50 minutes);
        vm.prank(alice);
        sbt.checkIn();

        vm.warp(block.timestamp + 20 minutes);
        vm.prank(alice);
        sbt.checkIn();
        assertEq(sbt.streakOf(alice), 2);
    }

    function test_MissedDayRestartsStreakAtOne() public {
        _streakOfDays(5);
        vm.warp(block.timestamp + 2 * DAY); // skip a full day window
        vm.prank(alice);
        sbt.checkIn();
        assertEq(sbt.streakOf(alice), 1, "gap restarts the streak");
    }
}
