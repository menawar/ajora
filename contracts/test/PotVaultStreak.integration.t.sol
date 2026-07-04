// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { StreakSBT } from "../src/StreakSBT.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IStreakSBT } from "../src/interfaces/IStreakSBT.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @notice End-to-end: the real StreakSBT drives PotVault ticket weighting (no mocks).
contract PotVaultStreakIntegrationTest is Test {
    PotVault internal vault;
    StreakSBT internal sbt;
    MockERC20 internal cusd;

    address internal amara = address(0xA3a); // 7-day saver
    address internal kevin = address(0xE1); // day-one saver

    uint256 internal constant MIN = 0.1e18;
    uint256 internal constant DAY = 1 days;

    function setUp() public {
        vm.warp(20_000 * DAY + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        sbt = new StreakSBT();
        vault.setStreakSBT(IStreakSBT(address(sbt)));

        cusd.mint(amara, 100e18);
        cusd.mint(kevin, 100e18);
    }

    function _saveAndCheckIn(address who, uint256 amount) internal returns (uint256 tickets) {
        vm.startPrank(who);
        sbt.checkIn();
        cusd.approve(address(vault), amount);
        tickets = vault.contribute(amount);
        vm.stopPrank();
    }

    function test_SevenDaySaverEarnsBoostedTickets() public {
        // Amara saves + checks in daily for 6 days; Kevin does nothing.
        for (uint256 i = 0; i < 6; i++) {
            _saveAndCheckIn(amara, 1e18);
            vm.warp(block.timestamp + DAY);
        }

        // Day 7: same 1.0 cUSD save, different multipliers.
        uint256 amaraTickets = _saveAndCheckIn(amara, 1e18); // streak 7 -> 1.5x
        uint256 kevinTickets = _saveAndCheckIn(kevin, 1e18); // streak 1 -> 1.0x

        assertEq(kevinTickets, 10, "day-one saver gets base tickets");
        assertEq(amaraTickets, 15, "7-day streak earns 1.5x tickets");
    }

    function test_BrokenStreakDropsBackToBase_PrincipalUnaffected() public {
        for (uint256 i = 0; i < 7; i++) {
            _saveAndCheckIn(amara, 1e18);
            vm.warp(block.timestamp + DAY);
        }

        // Amara misses two full days: multiplier resets, principal untouched.
        vm.warp(block.timestamp + 2 * DAY);
        uint256 periodAfterBreak = vault.currentPeriod();
        uint256 tickets = _saveAndCheckIn(amara, 1e18);
        assertEq(tickets, 10, "broken streak mints base tickets");

        // No-loss: that day's principal is fully redeemable once its period closes.
        vm.warp(block.timestamp + DAY);
        vm.prank(amara);
        assertEq(vault.claimPrincipal(periodAfterBreak), 1e18);
    }
}
