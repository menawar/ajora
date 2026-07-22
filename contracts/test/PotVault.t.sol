// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockStreakSBT } from "./mocks/MockStreakSBT.sol";
import { IStreakSBT } from "../src/interfaces/IStreakSBT.sol";


import { Treasury }
from "../src/Treasury.sol";
import { MockTreasury } from "./mocks/MockTreasury.sol";
import { MockPoolAddressesProvider } from "./mocks/MockPoolAddressesProvider.sol";
contract PotVaultTest is Test {
    Treasury internal treasury;

    PotVault internal vault;
    MockERC20 internal cusd;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    uint256 internal constant MIN = 0.1e18; // 0.10 cUSD

    function setUp() public {
        treasury = Treasury(address(new MockTreasury()));
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);

        cusd.mint(alice, 100e18);
        cusd.mint(bob, 100e18);
    }

    function _contribute(address who, uint256 amount) internal returns (uint256 tickets) {
        vm.startPrank(who);
        cusd.approve(address(vault), amount);
        tickets = vault.contribute(amount);
        vm.stopPrank();
    }

    function test_ContributeMintsTicketsAndTracksPrincipal() public {
        uint256 period = vault.currentPeriod();
        uint256 tickets = _contribute(alice, 1e18); // 1.0 cUSD -> 10 tickets

        assertEq(tickets, 10, "10 tickets for 1.0 cUSD at 0.1 min");
        assertEq(vault.principalOf(alice, period), 1e18);
        assertEq(vault.ticketsOf(alice, period), 10);
        assertEq(cusd.balanceOf(address(vault)), 1e18);
    }

    function test_RevertWhenBelowMinimum() public {
        vm.startPrank(alice);
        cusd.approve(address(vault), 1e18);
        vm.expectRevert(PotVault.BelowMinimum.selector);
        vault.contribute(0.05e18);
        vm.stopPrank();
    }

    /// @notice No-loss guarantee: principal is always fully redeemable once the period closes.
    function test_NoLoss_ClaimPrincipalReturnsExactly() public {
        uint256 period = vault.currentPeriod();
        _contribute(alice, 2e18);
        vm.warp(block.timestamp + 1 days); // period closes

        uint256 before = cusd.balanceOf(alice);
        vm.prank(alice);
        uint256 got = vault.claimPrincipal(period);

        assertEq(got, 2e18, "reclaim exactly what was contributed");
        assertEq(cusd.balanceOf(alice), before + 2e18);
        assertEq(vault.principalOf(alice, period), 0);
    }

    /// @notice Regression for #28: principal can't exit while its tickets are in the live draw.
    function test_RevertClaimPrincipalWhilePeriodOpen() public {
        uint256 period = vault.currentPeriod();
        _contribute(alice, 1e18);

        vm.prank(alice);
        vm.expectRevert(PotVault.PeriodStillOpen.selector);
        vault.claimPrincipal(period);

        // Unlocks the moment the period closes.
        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        assertEq(vault.claimPrincipal(period), 1e18);
    }

    function test_RevertClaimPrincipalTwice() public {
        uint256 period = vault.currentPeriod();
        _contribute(alice, 1e18);
        vm.warp(block.timestamp + 1 days);

        vm.startPrank(alice);
        vault.claimPrincipal(period);
        vm.expectRevert(PotVault.NothingToClaim.selector);
        vault.claimPrincipal(period);
        vm.stopPrank();
    }

    /// @notice Winnings are settled from the jaraPot only — never from anyone's principal.
    function test_SettleWinnings_PaidFromJaraNotPrincipal() public {
        uint256 period = vault.currentPeriod();
        _contribute(alice, 1e18);

        // Sponsor funds the jara pot for this period.
        cusd.mint(address(this), 5e18);
        cusd.approve(address(vault), 5e18);
        vault.fundJara(period, 5e18);

        // Admin (this test) wires a DrawManager, then settles a prize for Bob.
        vault.setDrawManager(address(this));
        vault.settleWinnings(bob, period, 3e18);

        vm.prank(bob);
        uint256 won = vault.claimWinnings(period);
        assertEq(won, 3e18);

        // Alice's principal is untouched and still fully redeemable after close.
        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        assertEq(vault.claimPrincipal(period), 1e18);
    }

    function test_TicketsScaleWithStreakMultiplier() public {
        MockStreakSBT streak = new MockStreakSBT();
        streak.setMultiplier(alice, 15); // 1.5x
        vault.setStreakSBT(IStreakSBT(address(streak)));

        uint256 period = vault.currentPeriod();
        uint256 tickets = _contribute(alice, 1e18); // base 10 * 1.5 = 15

        assertEq(tickets, 15, "1.5x streak multiplier applied");
        assertEq(vault.ticketsOf(alice, period), 15);
    }

    function test_MultiplierClampedToOneWhenBelowScale() public {
        MockStreakSBT streak = new MockStreakSBT();
        streak.setMultiplier(alice, 3); // < 10 → must clamp to 1.0x, never reduce tickets
        vault.setStreakSBT(IStreakSBT(address(streak)));

        uint256 tickets = _contribute(alice, 1e18);
        assertEq(tickets, 10, "multiplier below 1.0x is clamped up to 1.0x");
    }

    function test_NoStreakSBT_DefaultsToOneX() public {
        uint256 tickets = _contribute(alice, 1e18);
        assertEq(tickets, 10, "flat 1.0x when no StreakSBT wired");
    }

    function test_CreditTickets_WelcomeTicketHasNoPrincipal() public {
        address faucet = address(0xFA);
        vault.setSprayFaucet(faucet);

        uint256 period = vault.currentPeriod();
        vm.prank(faucet);
        vault.creditTickets(bob, period, 1); // one sponsor-funded welcome ticket

        assertEq(vault.ticketsOf(bob, period), 1, "welcome ticket minted");
        assertEq(vault.principalOf(bob, period), 0, "no principal created");

        // Bob never deposited, so there is nothing to reclaim (no-loss unaffected).
        vm.warp(block.timestamp + 1 days);
        vm.prank(bob);
        vm.expectRevert(PotVault.NothingToClaim.selector);
        vault.claimPrincipal(period);
    }

    function test_RevertCreditTicketsFromNonFaucet() public {
        uint256 period = vault.currentPeriod();
        vault.setSprayFaucet(address(0xFA));
        vm.expectRevert(PotVault.NotSprayFaucet.selector);
        vault.creditTickets(bob, period, 1);
    }

    function test_RollJaraMovesPotBetweenPeriods_DrawManagerOnly() public {
        uint256 period = vault.currentPeriod();
        cusd.mint(address(this), 5e18);
        cusd.approve(address(vault), 5e18);
        vault.fundJara(period, 5e18);
        vault.setDrawManager(address(this));

        vault.rollJara(period, period + 1, 5e18);
        assertEq(vault.periodInfo(period).jaraPot, 0);
        assertEq(vault.periodInfo(period + 1).jaraPot, 5e18);

        vm.prank(alice);
        vm.expectRevert(PotVault.NotDrawManager.selector);
        vault.rollJara(period + 1, period, 1e18);
    }

    function test_RevertSetSprayFaucetTwice() public {
        vault.setSprayFaucet(address(0xFA));
        vm.expectRevert(PotVault.AlreadySet.selector);
        vault.setSprayFaucet(address(0xFB));
    }

    function testFuzz_PrincipalRoundTrip(uint256 amount) public {
        amount = bound(amount, MIN, 100e18);
        uint256 period = vault.currentPeriod();
        _contribute(alice, amount);
        vm.warp(block.timestamp + 1 days);

        vm.prank(alice);
        assertEq(vault.claimPrincipal(period), amount);
    }

    /// @notice The streak multiplier may only help: tickets are never below the un-weighted base.
    function testFuzz_MultiplierNeverReducesTickets(uint8 multX10, uint256 amount) public {
        amount = bound(amount, MIN, 1000e18);
        cusd.mint(alice, amount); // ensure alice can cover the fuzzed amount
        MockStreakSBT streak = new MockStreakSBT();
        streak.setMultiplier(alice, multX10);
        vault.setStreakSBT(IStreakSBT(address(streak)));

        uint256 base = amount / MIN;
        uint256 tickets = _contribute(alice, amount);
        assertGe(tickets, base, "multiplier must never reduce tickets below base");
    }
}
