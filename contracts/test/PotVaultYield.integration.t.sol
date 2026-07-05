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

/// @notice End-to-end vault<->adapter routing: timelocked wiring, buffer-gated deployment,
///         and the no-loss guarantee holding while principal sits in the venue.
contract PotVaultYieldIntegrationTest is Test {
    PotVault internal vault;
    MockERC20 internal cusd;
    MockAaveV3Pool internal pool;
    YieldAdapter internal adapter;

    address internal alice = address(0xA11CE);
    address internal drawManager = address(0xD3A3);

    uint256 internal constant MIN = 0.1e18;

    function setUp() public {
        vm.warp(20_000 days + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        vault.setDrawManager(drawManager);
        pool = new MockAaveV3Pool(cusd);
        adapter = new YieldAdapter(
            IERC20(address(cusd)),
            vault,
            IAaveV3Pool(address(pool)),
            IERC20(address(pool.aToken())),
            1_000e18
        );

        cusd.mint(alice, 1_000e18);
    }

    function _wireAdapter() internal {
        vault.proposeYieldAdapter(IYieldAdapter(address(adapter)));
        vm.warp(block.timestamp + vault.ADAPTER_TIMELOCK());
        vault.applyYieldAdapter();
    }

    function _contribute(address who, uint256 amount) internal {
        vm.startPrank(who);
        cusd.approve(address(vault), amount);
        vault.contribute(amount);
        vm.stopPrank();
    }

    // ---------------------------------------------------------------- wiring

    function test_AdapterWiringWaitsForTimelock() public {
        vault.proposeYieldAdapter(IYieldAdapter(address(adapter)));
        vm.expectRevert(PotVault.TimelockPending.selector);
        vault.applyYieldAdapter();

        vm.warp(block.timestamp + vault.ADAPTER_TIMELOCK());
        vault.applyYieldAdapter();
        assertEq(address(vault.yieldAdapter()), address(adapter));
        assertEq(vault.yieldAdapterEta(), 0, "proposal consumed");
    }

    function test_RevertWhenApplyWithoutProposal() public {
        vm.expectRevert(PotVault.NothingProposed.selector);
        vault.applyYieldAdapter();
    }

    function test_RevertWhenSwitchingWithFundsStillDeployed() public {
        _wireAdapter();
        _contribute(alice, 100e18);
        vault.deployIdle(50e18);

        vault.proposeYieldAdapter(IYieldAdapter(address(0)));
        vm.warp(block.timestamp + vault.ADAPTER_TIMELOCK());
        vm.expectRevert(PotVault.AdapterNotDrained.selector);
        vault.applyYieldAdapter();

        // Drain, then the switch goes through.
        vault.recallDeployed(50e18);
        vault.applyYieldAdapter();
        assertEq(address(vault.yieldAdapter()), address(0));
    }

    function test_RevertWhenProposeNotAdmin() public {
        vm.prank(alice);
        vm.expectRevert(PotVault.NotAdmin.selector);
        vault.proposeYieldAdapter(IYieldAdapter(address(adapter)));
    }

    // ------------------------------------------------------------ deployIdle

    function test_DeployIdleHonorsBuffer() public {
        _wireAdapter();
        _contribute(alice, 100e18);

        // 20% buffer on 100 total assets -> at most 80 may leave.
        vm.expectRevert(PotVault.BufferBreached.selector);
        vault.deployIdle(81e18);

        vault.deployIdle(80e18);
        assertEq(cusd.balanceOf(address(vault)), 20e18);
        assertEq(adapter.totalDeployed(), 80e18);
    }

    function test_BufferCountsDeployedAssetsToo() public {
        _wireAdapter();
        _contribute(alice, 100e18);
        vault.deployIdle(80e18);

        // Still 100 of total assets; the remaining 20 is exactly the buffer.
        vm.expectRevert(PotVault.BufferBreached.selector);
        vault.deployIdle(1);

        // New savings raise total assets to 200 -> buffer 40 -> 60 more may leave.
        _contribute(alice, 100e18);
        vm.expectRevert(PotVault.BufferBreached.selector);
        vault.deployIdle(81e18);
        vault.deployIdle(80e18);
        assertEq(adapter.totalDeployed(), 160e18);
    }

    function test_RevertWhenDeployIdleWithoutAdapter() public {
        _contribute(alice, 100e18);
        vm.expectRevert(PotVault.NoAdapter.selector);
        vault.deployIdle(10e18);
    }

    function test_RevertWhenDeployIdleNotAdmin() public {
        _wireAdapter();
        _contribute(alice, 100e18);
        vm.prank(alice);
        vm.expectRevert(PotVault.NotAdmin.selector);
        vault.deployIdle(10e18);
    }

    function test_SetLiquidityBufferBoundsAndEffect() public {
        _wireAdapter();
        vm.expectRevert(PotVault.InvalidBps.selector);
        vault.setLiquidityBuffer(10_001);

        vault.setLiquidityBuffer(5_000);
        _contribute(alice, 100e18);
        vm.expectRevert(PotVault.BufferBreached.selector);
        vault.deployIdle(51e18);
        vault.deployIdle(50e18);
    }

    // ------------------------------------------------- no-loss while deployed

    function test_ClaimPrincipalAutoRecallsFromVenue() public {
        _wireAdapter();
        uint256 periodId = vault.currentPeriod();
        _contribute(alice, 100e18);
        vault.deployIdle(80e18); // only 20 stays liquid

        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        vault.claimPrincipal(periodId);

        assertEq(cusd.balanceOf(alice), 1_000e18, "alice made whole from the venue");
        assertEq(adapter.totalDeployed(), 0, "shortfall recalled");
    }

    function test_ClaimWinningsAutoRecallsFromVenue() public {
        _wireAdapter();
        uint256 periodId = vault.currentPeriod();
        _contribute(alice, 100e18);

        // Sponsor funds a 10 cUSD pot, then everything idle gets deployed.
        cusd.mint(address(this), 10e18);
        cusd.approve(address(vault), 10e18);
        vault.fundJara(periodId, 10e18);
        vault.deployIdle(88e18); // buffer: 20% of 110 = 22

        vm.prank(drawManager);
        vault.settleWinnings(alice, periodId, 10e18);

        vm.prank(alice);
        uint256 got = vault.claimWinnings(periodId);
        assertEq(got, 10e18);
        assertEq(cusd.balanceOf(alice), 910e18);
    }

    function test_YieldNeverDilutesPrincipalAccounting() public {
        _wireAdapter();
        uint256 periodId = vault.currentPeriod();
        _contribute(alice, 100e18);
        vault.deployIdle(80e18);
        pool.accrue(address(adapter), 5e18);

        adapter.harvest(periodId);

        // Yield became jara; principal claim still pays out exactly 100.
        assertEq(vault.periodInfo(periodId).jaraPot, 5e18);
        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        uint256 got = vault.claimPrincipal(periodId);
        assertEq(got, 100e18);
    }
}
