// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { DrawManager } from "../src/DrawManager.sol";
import { SprayFaucet } from "../src/SprayFaucet.sol";
import { StreakSBT } from "../src/StreakSBT.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IStreakSBT } from "../src/interfaces/IStreakSBT.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @notice The complete Ajora daily loop across all four core contracts (AJORA_SPEC.md §4):
///         save -> check in -> pick -> 8 PM resolve -> claim winnings -> principal always
///         withdrawable. Runs two consecutive days including a no-winner rollover.
contract CoreLoopIntegrationTest is Test {
    PotVault internal vault;
    DrawManager internal draw;
    SprayFaucet internal faucet;
    StreakSBT internal sbt;
    MockERC20 internal cusd;

    address internal keeper = address(0x33E3);
    address internal verifier = address(0xFEED);
    address internal sponsor = address(0x5075);
    address internal amara = address(0xA3a);
    address internal kevin = address(0xE1);

    uint256 internal constant MIN = 0.1e18;
    uint256 internal constant DAY = 1 days;

    function setUp() public {
        vm.warp(20_000 * DAY + 9 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        sbt = new StreakSBT();
        faucet = new SprayFaucet(vault, verifier);
        draw = new DrawManager(vault, keeper);
        vault.setStreakSBT(IStreakSBT(address(sbt)));
        vault.setSprayFaucet(address(faucet));
        vault.setDrawManager(address(draw));

        cusd.mint(amara, 100e18);
        cusd.mint(kevin, 100e18);
        cusd.mint(sponsor, 100e18);

        vm.startPrank(sponsor);
        cusd.approve(address(faucet), 100e18);
        faucet.fundSponsorPool(50e18, "launch");
        vm.stopPrank();

        vm.startPrank(verifier);
        faucet.setVerified(amara, true);
        faucet.setVerified(kevin, true);
        vm.stopPrank();
    }

    bytes32 internal constant ANCHOR_HASH = keccak256("test-anchor");

    /// @dev Resolve via the real commit->reveal flow so that `target` wins.
    function _resolveWithNumber(uint256 periodId, uint8 target) internal {
        uint256 periodEnd = (periodId + 1) * DAY;
        bytes32 secret;
        for (uint256 i = 0;; i++) {
            secret = bytes32(i);
            uint256 seed = uint256(keccak256(abi.encode(secret, ANCHOR_HASH)));
            if (uint8(seed % 9) + 1 == target) break;
        }
        vm.warp(periodEnd - 5 minutes);
        vm.prank(keeper);
        draw.commitSeed(periodId, keccak256(abi.encode(secret)));
        (, uint64 anchor) = draw.seedCommits(periodId);
        vm.warp(periodEnd + 1 hours);
        vm.roll(uint256(anchor) + 10);
        vm.setBlockhash(anchor, ANCHOR_HASH);
        draw.revealAndResolve(periodId, secret);
    }

    /// @dev One user session: check in, save, pick — the 40-second loop.
    function _session(address who, uint256 amount, uint8 number) internal {
        vm.startPrank(who);
        sbt.checkIn();
        cusd.approve(address(vault), amount);
        vault.contribute(amount);
        draw.pickNumber(number);
        vm.stopPrank();
    }

    function test_TwoDayLoop_WinThenRollover() public {
        // ---------- Day 1 ----------
        uint256 day1 = vault.currentPeriod();
        _session(amara, 1e18, 4); // 10 tickets on 4
        _session(kevin, 2e18, 9); // 20 tickets on 9

        // Amara sprays Kevin a bonus ticket (sponsor-backed).
        vm.prank(amara);
        faucet.spray(kevin);
        assertEq(vault.ticketsOf(kevin, day1), 21);

        // Sponsor tops up the day-1 pot directly too.
        vm.startPrank(sponsor);
        cusd.approve(address(vault), 9e18);
        vault.fundJara(day1, 9e18);
        vm.stopPrank();
        uint256 day1Pot = 9e18 + MIN; // sponsor top-up + spray backing

        // ---------- Day 2: keeper's committed seed reveals — Kevin's 9 hits ----------
        _resolveWithNumber(day1, 9);

        assertTrue(draw.isWinner(kevin, day1));
        assertFalse(draw.isWinner(amara, day1));

        vm.prank(kevin);
        uint256 prize = draw.claimPrize(day1);
        assertEq(prize, day1Pot, "sole winner takes the whole pot");
        vm.prank(kevin);
        assertEq(vault.claimWinnings(day1), day1Pot);

        // ---------- Day 2 sessions: streaks extended ----------
        uint256 day2 = vault.currentPeriod();
        _session(amara, 1e18, 5);
        assertEq(sbt.streakOf(amara), 2, "day-2 streak");

        vm.startPrank(sponsor);
        cusd.approve(address(vault), 5e18);
        vault.fundJara(day2, 5e18);
        vm.stopPrank();

        // ---------- Day 3: nobody picked 7 -> pot rolls into day 3 ----------
        _resolveWithNumber(day2, 7); // 7 unpicked
        uint256 day3 = vault.currentPeriod();

        assertEq(vault.periodInfo(day2).jaraPot, 0);
        assertEq(vault.periodInfo(day3).jaraPot, 5e18, "unwon pot fuels tomorrow");

        // ---------- No-loss: every deposit remains fully redeemable ----------
        vm.startPrank(amara);
        assertEq(vault.claimPrincipal(day1), 1e18);
        assertEq(vault.claimPrincipal(day2), 1e18);
        vm.stopPrank();
        vm.prank(kevin);
        assertEq(vault.claimPrincipal(day1), 2e18);
    }
}
