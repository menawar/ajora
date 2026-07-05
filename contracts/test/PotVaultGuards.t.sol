// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { YieldAdapter } from "../src/YieldAdapter.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IAaveV3Pool } from "../src/interfaces/IAaveV3Pool.sol";
import { IYieldAdapter } from "../src/interfaces/IYieldAdapter.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockAaveV3Pool } from "./mocks/MockAaveV3Pool.sol";

/// @notice Circuit breaker + deposit caps (spec §13): pause stops money-in instantly but
///         never money-out; unpause waits a day; caps bound month-1 blast radius.
contract PotVaultGuardsTest is Test {
    PotVault internal vault;
    MockERC20 internal cusd;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal drawManager = address(0xD3A3);

    uint256 internal constant MIN = 0.1e18;

    function setUp() public {
        vm.warp(20_000 days + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        vault.setDrawManager(drawManager);
        cusd.mint(alice, 1_000e18);
        cusd.mint(bob, 1_000e18);
    }

    function _contribute(address who, uint256 amount) internal {
        vm.startPrank(who);
        cusd.approve(address(vault), amount);
        vault.contribute(amount);
        vm.stopPrank();
    }

    // ------------------------------------------------------------------ pause

    function test_PauseBlocksContribute() public {
        vault.pause();
        vm.startPrank(alice);
        cusd.approve(address(vault), 1e18);
        vm.expectRevert(PotVault.IsPaused.selector);
        vault.contribute(1e18);
        vm.stopPrank();
    }

    function test_PauseBlocksDeployIdle() public {
        MockAaveV3Pool pool = new MockAaveV3Pool(cusd);
        YieldAdapter adapter = new YieldAdapter(
            IERC20(address(cusd)),
            vault,
            IAaveV3Pool(address(pool)),
            IERC20(address(pool.aToken())),
            1_000e18
        );
        vault.proposeYieldAdapter(IYieldAdapter(address(adapter)));
        vm.warp(block.timestamp + vault.ADAPTER_TIMELOCK());
        vault.applyYieldAdapter();
        _contribute(alice, 100e18);

        vault.pause();
        vm.expectRevert(PotVault.IsPaused.selector);
        vault.deployIdle(10e18);
    }

    function test_ClaimsStillWorkWhilePaused() public {
        uint256 periodId = vault.currentPeriod();
        _contribute(alice, 10e18);

        // Sponsor pot + a settled win, then the breaker trips.
        cusd.mint(address(this), 5e18);
        cusd.approve(address(vault), 5e18);
        vault.fundJara(periodId, 5e18);
        vm.prank(drawManager);
        vault.settleWinnings(alice, periodId, 5e18);

        vault.pause();
        vm.warp(block.timestamp + 1 days);

        vm.startPrank(alice);
        assertEq(vault.claimPrincipal(periodId), 10e18, "principal exits during pause");
        assertEq(vault.claimWinnings(periodId), 5e18, "winnings exit during pause");
        vm.stopPrank();
    }

    function test_UnpauseWaitsForTimelock() public {
        vault.pause();
        vm.expectRevert(PotVault.UnpauseTimelocked.selector);
        vault.unpause();

        vm.warp(block.timestamp + vault.UNPAUSE_TIMELOCK());
        vault.unpause();
        assertEq(vault.pausedAt(), 0);

        _contribute(alice, 1e18); // deposits flow again
    }

    function test_RevertWhenUnpauseNotPaused() public {
        vm.expectRevert(PotVault.NotPaused.selector);
        vault.unpause();
    }

    function test_RevertWhenPauseNotAdmin() public {
        vm.prank(alice);
        vm.expectRevert(PotVault.NotAdmin.selector);
        vault.pause();
    }

    // ------------------------------------------------------------------- caps

    function test_UserPeriodCapEnforcedAcrossTopUps() public {
        vault.setDepositCaps(5e18, 0);
        _contribute(alice, 3e18);

        vm.startPrank(alice);
        cusd.approve(address(vault), 3e18);
        vm.expectRevert(PotVault.UserCapExceeded.selector);
        vault.contribute(3e18); // 3 + 3 > 5
        vm.stopPrank();

        _contribute(alice, 2e18); // exactly at the cap is fine

        // A new period resets the per-period headroom.
        vm.warp(block.timestamp + 1 days);
        _contribute(alice, 5e18);
    }

    function test_TvlCapCountsOutstandingNotLifetime() public {
        vault.setDepositCaps(0, 10e18);
        _contribute(alice, 6e18);

        vm.startPrank(bob);
        cusd.approve(address(vault), 5e18);
        vm.expectRevert(PotVault.TvlCapExceeded.selector);
        vault.contribute(5e18); // 6 + 5 > 10
        vm.stopPrank();

        // Alice redeems -> headroom returns (outstanding, not lifetime).
        uint256 periodId = vault.currentPeriod();
        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        vault.claimPrincipal(periodId);
        _contribute(bob, 5e18);
        assertEq(vault.totalPrincipalOutstanding(), 5e18);
    }

    function test_ZeroCapsMeanUncapped() public {
        _contribute(alice, 500e18);
        assertEq(vault.totalPrincipalOutstanding(), 500e18);
    }

    function test_RevertWhenSetCapsNotAdmin() public {
        vm.prank(alice);
        vm.expectRevert(PotVault.NotAdmin.selector);
        vault.setDepositCaps(1, 1);
    }
}
