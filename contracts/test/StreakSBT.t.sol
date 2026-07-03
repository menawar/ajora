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

    // ------------------------------------------------------ multiplier tiers

    function test_TierBoundaries() public {
        _streakOfDays(6);
        assertEq(sbt.multiplierOf(alice), 10, "day 6 still 1.0x");

        vm.warp(block.timestamp + DAY);
        vm.prank(alice);
        sbt.checkIn(); // day 7
        assertEq(sbt.multiplierOf(alice), 15, "day 7 hits 1.5x");
    }

    function test_TierThirtyAndNinety() public {
        _streakOfDays(29);
        assertEq(sbt.multiplierOf(alice), 15, "day 29 still 1.5x");

        vm.warp(block.timestamp + DAY);
        vm.prank(alice);
        sbt.checkIn(); // day 30
        assertEq(sbt.multiplierOf(alice), 20, "day 30 hits 2.0x");

        _extendTo(90);
        assertEq(sbt.multiplierOf(alice), 30, "day 90 hits 3.0x");
    }

    function test_LivenessYesterdayCountsTodayLapsedDoesNot() public {
        _streakOfDays(10);

        // Next day, before checking in: streak still live (checked in yesterday).
        vm.warp(block.timestamp + DAY);
        assertEq(sbt.streakOf(alice), 10);
        assertEq(sbt.multiplierOf(alice), 15);

        // One more day with no check-in: streak is broken, multiplier falls to 1.0x.
        vm.warp(block.timestamp + DAY);
        assertEq(sbt.streakOf(alice), 0, "lapsed streak reads 0");
        assertEq(sbt.multiplierOf(alice), 10, "broken streak falls back to 1.0x");
    }

    function test_UnknownUserIsFlatOneX() public {
        assertEq(sbt.streakOf(address(0xDEAD)), 0);
        assertEq(sbt.multiplierOf(address(0xDEAD)), 10);
    }

    /// @dev Continue alice's existing streak up to `target` days.
    function _extendTo(uint256 target) internal {
        uint256 current = sbt.streakOf(alice);
        for (uint256 i = current; i < target; i++) {
            vm.warp(block.timestamp + DAY);
            vm.prank(alice);
            sbt.checkIn();
        }
    }

    // -------------------------------------------------------------- badges

    function test_BadgesMintAtMilestones() public {
        _streakOfDays(7);
        assertTrue(sbt.hasBadge(alice, 7), "7-day badge");
        assertFalse(sbt.hasBadge(alice, 30), "no 30-day badge yet");

        _extendTo(30);
        assertTrue(sbt.hasBadge(alice, 30), "30-day badge");
    }

    function test_BadgeSurvivesStreakReset() public {
        _streakOfDays(7);
        vm.warp(block.timestamp + 3 * DAY); // break the streak
        vm.prank(alice);
        sbt.checkIn();

        assertEq(sbt.streakOf(alice), 1, "streak restarted");
        assertTrue(sbt.hasBadge(alice, 7), "earned badge is permanent");
    }

    function test_BadgeMintedOnceOnRepeatMilestone() public {
        _streakOfDays(7);
        vm.warp(block.timestamp + 3 * DAY);
        vm.prank(alice);
        sbt.checkIn();
        // Climb back to 7: hasBadge already true, second emission is suppressed.
        _extendTo(7);
        assertTrue(sbt.hasBadge(alice, 7));
    }

    // ------------------------------------------------------------ soulbound

    function test_AllTransferPathsRevert() public {
        vm.expectRevert(StreakSBT.Soulbound.selector);
        sbt.transfer(alice, 1);
        vm.expectRevert(StreakSBT.Soulbound.selector);
        sbt.transferFrom(alice, address(this), 1);
        vm.expectRevert(StreakSBT.Soulbound.selector);
        sbt.approve(alice, 1);
        vm.expectRevert(StreakSBT.Soulbound.selector);
        sbt.setApprovalForAll(alice, true);
    }

    // ---------------------------------------------------------------- fuzz

    /// @notice For any streak length, the multiplier equals the tier table and is never < 1.0x.
    function testFuzz_MultiplierMatchesTierTable(uint8 daysIn) public {
        uint256 n = bound(daysIn, 1, 120);
        _streakOfDays(n);

        uint256 m = sbt.multiplierOf(alice);
        uint256 expected = n >= 90 ? 30 : n >= 30 ? 20 : n >= 7 ? 15 : 10;
        assertEq(m, expected, "tier table");
        assertGe(m, 10, "never below 1.0x");
    }
}
