// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract PotVaultTest is Test {
    PotVault internal vault;
    MockERC20 internal cusd;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    uint256 internal constant MIN = 0.1e18; // 0.10 cUSD

    function setUp() public {
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

    /// @notice No-loss guarantee: principal is always fully redeemable.
    function test_NoLoss_ClaimPrincipalReturnsExactly() public {
        uint256 period = vault.currentPeriod();
        _contribute(alice, 2e18);

        uint256 before = cusd.balanceOf(alice);
        vm.prank(alice);
        uint256 got = vault.claimPrincipal(period);

        assertEq(got, 2e18, "reclaim exactly what was contributed");
        assertEq(cusd.balanceOf(alice), before + 2e18);
        assertEq(vault.principalOf(alice, period), 0);
    }

    function test_RevertClaimPrincipalTwice() public {
        uint256 period = vault.currentPeriod();
        _contribute(alice, 1e18);

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

        // Alice's principal is untouched and still fully redeemable.
        vm.prank(alice);
        assertEq(vault.claimPrincipal(period), 1e18);
    }

    function testFuzz_PrincipalRoundTrip(uint256 amount) public {
        amount = bound(amount, MIN, 100e18);
        uint256 period = vault.currentPeriod();
        _contribute(alice, amount);

        vm.prank(alice);
        assertEq(vault.claimPrincipal(period), amount);
    }
}
