// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { SprayFaucet } from "../src/SprayFaucet.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @notice Per-human free-value caps (spec §13): a verified ring must not be able to
///         funnel unbounded sponsor budget into one account.

import { Treasury }
from "../src/Treasury.sol";
import { MockTreasury } from "./mocks/MockTreasury.sol";
import { MockPoolAddressesProvider } from "./mocks/MockPoolAddressesProvider.sol";
contract SprayFaucetCapsTest is Test {
    Treasury internal treasury;

    PotVault internal vault;
    SprayFaucet internal faucet;
    MockERC20 internal cusd;

    address internal verifier = address(0xE31F);
    address internal sponsor = address(0x5075);
    address internal target = address(0x7A36);

    // A ring of verified senders all pointed at `target`.
    address[4] internal ring = [address(0x31), address(0x32), address(0x33), address(0x34)];

    uint256 internal constant MIN = 0.1e18;

    function setUp() public {
        treasury = Treasury(address(new MockTreasury()));
        vm.warp(20_000 days + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        faucet = new SprayFaucet(vault, verifier, treasury);
        vault.setSprayFaucet(address(faucet));

        cusd.mint(sponsor, 1_000e18);
        vm.startPrank(sponsor);
        cusd.approve(address(faucet), 1_000e18);
        faucet.fundSponsorPool(1_000e18, "launch");
        vm.stopPrank();

        vm.startPrank(verifier);
        faucet.setVerified(target, true);
        for (uint256 i = 0; i < ring.length; i++) {
            faucet.setVerified(ring[i], true);
        }
        vm.stopPrank();
    }

    function test_ReceiverCappedAt3FreeTicketsPerDay() public {
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(ring[i]);
            faucet.spray(target);
        }
        assertEq(faucet.dailyFreeLeft(target), 0);

        vm.prank(ring[3]);
        vm.expectRevert(SprayFaucet.DailyFreeLimitReached.selector);
        faucet.spray(target);
    }

    function test_WelcomeCountsTowardDailyReceiveCap() public {
        faucet.welcomeTicket(target);
        assertEq(faucet.dailyFreeLeft(target), 2);

        vm.prank(ring[0]);
        faucet.spray(target);
        vm.prank(ring[1]);
        faucet.spray(target);

        vm.prank(ring[2]);
        vm.expectRevert(SprayFaucet.DailyFreeLimitReached.selector);
        faucet.spray(target);
    }

    function test_ReceiveCapResetsNextDay() public {
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(ring[i]);
            faucet.spray(target);
        }
        vm.warp(block.timestamp + 1 days);
        assertEq(faucet.dailyFreeLeft(target), 3);
        vm.prank(ring[3]);
        faucet.spray(target); // fresh day, fresh headroom
    }

    function test_LifetimeCapStopsLongRunningFarm() public {
        // Tight cap: 5 tickets lifetime.
        faucet.setFreeValueCap(5 * faucet.ticketValue());

        for (uint256 day = 0; day < 2; day++) {
            for (uint256 i = 0; i < 2; i++) {
                vm.prank(ring[i]);
                faucet.spray(target);
            }
            vm.warp(block.timestamp + 1 days);
        }
        // 4 received; the 6th ever would breach the 5-ticket lifetime cap.
        vm.prank(ring[0]);
        faucet.spray(target); // 5th: exactly at cap
        vm.prank(ring[1]);
        vm.expectRevert(SprayFaucet.LifetimeFreeCapReached.selector);
        faucet.spray(target);

        assertEq(faucet.freeValueOf(target), 5 * faucet.ticketValue());
    }

    function test_DefaultLifetimeCapIs30Tickets() public view {
        assertEq(faucet.maxFreeValuePerUser(), 30 * faucet.ticketValue());
    }

    function test_ZeroCapDisablesLifetimeLimit() public {
        faucet.setFreeValueCap(0);
        // 3/day for 11 days = 33 > 30 default — passes once the lifetime cap is off.
        for (uint256 day = 0; day < 11; day++) {
            for (uint256 i = 0; i < 3; i++) {
                vm.prank(ring[i]);
                faucet.spray(target);
            }
            vm.warp(block.timestamp + 1 days);
        }
        assertEq(faucet.freeValueOf(target), 33 * faucet.ticketValue());
    }

    function test_RevertWhenSetFreeValueCapNotAdmin() public {
        vm.prank(target);
        vm.expectRevert(SprayFaucet.NotAdmin.selector);
        faucet.setFreeValueCap(1);
    }

    function test_ReferralBonusCountsTowardCaps() public {
        // Wire this test contract as the crew registry so it can trigger bonuses.
        faucet.setCrewRegistry(address(this));
        faucet.setFreeValueCap(2 * faucet.ticketValue());

        faucet.referralBonus(target);
        faucet.referralBonus(target);
        vm.expectRevert(SprayFaucet.LifetimeFreeCapReached.selector);
        faucet.referralBonus(target);
    }
}
