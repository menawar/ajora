// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { YieldAdapter } from "../src/YieldAdapter.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IAaveV3Pool } from "../src/interfaces/IAaveV3Pool.sol";
import { IYieldAdapter } from "../src/interfaces/IYieldAdapter.sol";
import { IPotVault } from "../src/interfaces/IPotVault.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockAaveV3Pool } from "./mocks/MockAaveV3Pool.sol";

import { Treasury }
from "../src/Treasury.sol";
import { MockTreasury } from "./mocks/MockTreasury.sol";
import { MockPoolAddressesProvider } from "./mocks/MockPoolAddressesProvider.sol";


contract PotVaultYieldIntegrationTest is Test {
    Treasury internal treasury;
    MockPoolAddressesProvider internal provider;

    PotVault internal vault;
    MockERC20 internal cusd;
    MockAaveV3Pool internal pool;
    YieldAdapter internal adapter;

    address internal alice = address(0xA11CE);
    address internal drawManager = address(0xD3A3);

    uint256 internal constant MIN = 0.1e18;

    function setUp() public {
        vm.warp(20_000 days + 12 hours);
        cusd = new MockERC20("Mento Dollar", "USDm", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        
        treasury = Treasury(address(new MockTreasury()));

        vault.setDrawManager(drawManager);
        pool = new MockAaveV3Pool(cusd);
        provider = new MockPoolAddressesProvider(address(pool));
        adapter = new YieldAdapter(
            IERC20(address(cusd)),
            vault,
            provider,
            IERC20(address(pool.aToken())),
            treasury,
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

        // Sponsor funds a 10 USDm pot, then everything idle gets deployed.
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

        // Yield became jara (90%); principal claim still pays out exactly 100.
        assertEq(vault.periodInfo(periodId).jaraPot, 4.5e18);
        assertEq(treasury.totalYieldFees(), 0.5e18);
        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        uint256 got = vault.claimPrincipal(periodId);
        assertEq(got, 100e18);
    }

    // ------------------------------------------------- withdrawal queue

    /// @notice When Aave is completely illiquid (pool drained), claimPrincipal must NOT revert.
    ///         Instead it queues the withdrawal and emits WithdrawalQueued. Principal accounting
    ///         stays consistent: totalPrincipalOutstanding decremented, totalQueued incremented.
    function test_ClaimPrincipalQueuesWhenVenueDry() public {
        _wireAdapter();
        uint256 periodId = vault.currentPeriod();
        _contribute(alice, 100e18);
        vault.deployIdle(80e18); // 20 stays liquid

        // Drain the mock pool so Aave cannot fulfill any withdrawal.
        uint256 poolBal = cusd.balanceOf(address(pool));
        vm.prank(address(pool));
        cusd.transfer(address(0xDEAD), poolBal);

        // Also drain the in-vault balance so even the 20 liquid won't cover 100.
        // (alice contributed 100; 80 deployed, 20 in vault)
        // The 20 covers only 20 of alice's 100 — the remaining 80 cannot be recalled.
        // Actually the vault has 20 liquid but alice needs 100, so it tries to recall 80 from
        // Aave (gets 0), then tries treasury (none set), returns false → queue.

        vm.warp(block.timestamp + 1 days);
        vm.expectEmit(true, true, false, true);
        emit IPotVault.WithdrawalQueued(alice, periodId, 100e18);

        vm.prank(alice);
        uint256 queued = vault.claimPrincipal(periodId);
        assertEq(queued, 100e18, "amount returned even when queued");

        assertEq(vault.pendingWithdrawalOf(alice), 100e18, "alice queued");
        assertEq(vault.totalQueued(), 100e18, "totalQueued updated");
        // Principal mapping zeroed out; outstanding decremented.
        assertEq(vault.principalOf(alice, periodId), 0, "principal zeroed");
        // Alice has NOT received tokens yet.
        assertEq(cusd.balanceOf(alice), 1_000e18 - 100e18, "alice has not been paid yet");
    }

    /// @notice After Aave liquidity is restored, drainQueue pays all queued users in a
    ///         single transaction (one Aave withdrawal call, N token transfers).
    function test_DrainQueuePaysAllUsersInOneTx() public {
        address bob = address(0xB0B);
        cusd.mint(bob, 1_000e18);

        _wireAdapter();
        uint256 periodId = vault.currentPeriod();

        _contribute(alice, 100e18);
        _contribute(bob, 50e18);
        vault.deployIdle(120e18); // buffer: 20% of 150 = 30; max deploy = 120

        // Drain Aave so both claims queue.
        uint256 poolBal = cusd.balanceOf(address(pool));
        vm.prank(address(pool));
        cusd.transfer(address(0xDEAD), poolBal);

        vm.warp(block.timestamp + 1 days);

        vm.prank(alice);
        vault.claimPrincipal(periodId);

        vm.prank(bob);
        vault.claimPrincipal(periodId);

        assertEq(vault.totalQueued(), 150e18, "both queued");

        // Restore Aave liquidity: re-mint underlying back to the pool.
        cusd.mint(address(pool), 120e18);

        // Keeper drains the queue — one bulk Aave recall, then pays both users.
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = bob;

        vm.expectEmit(false, false, false, true);
        emit IPotVault.QueueDrained(150e18);

        vault.drainQueue(users);

        assertEq(vault.totalQueued(), 0, "queue empty");
        assertEq(vault.pendingWithdrawalOf(alice), 0, "alice cleared");
        assertEq(vault.pendingWithdrawalOf(bob), 0, "bob cleared");
        assertEq(cusd.balanceOf(alice), 1_000e18, "alice made whole");
        assertEq(cusd.balanceOf(bob), 1_000e18, "bob made whole");
    }

    /// @notice When Aave is partially dry, the Treasury backstop covers the gap so the
    ///         user is paid immediately without needing to queue.
    function test_TreasuryCoversShortfall() public {
        MockTreasury mockT = MockTreasury(address(treasury));

        _wireAdapter();
        uint256 periodId = vault.currentPeriod();
        _contribute(alice, 100e18);
        vault.deployIdle(80e18); // 20 liquid in vault

        // Wire treasury backstop to the vault.
        vault.setTreasury(treasury);

        // Seed treasury with 80 USDm (enough to cover the Aave shortfall).
        cusd.mint(address(this), 80e18);
        cusd.approve(address(mockT), 80e18);
        mockT.seed(IERC20(address(cusd)), address(vault), 80e18);

        // Drain Aave (treasury should cover).
        uint256 poolBal = cusd.balanceOf(address(pool));
        vm.prank(address(pool));
        cusd.transfer(address(0xDEAD), poolBal);

        vm.warp(block.timestamp + 1 days);

        // Alice claims — Aave gives 0, Treasury covers 80, vault had 20 → total 100 ✓.
        vm.prank(alice);
        uint256 got = vault.claimPrincipal(periodId);

        assertEq(got, 100e18, "alice paid in full");
        assertEq(cusd.balanceOf(alice), 1_000e18, "alice made whole via treasury backstop");
        assertEq(vault.pendingWithdrawalOf(alice), 0, "nothing queued");
        assertEq(mockT.totalShortfallCovered(), 80e18, "treasury absorbed the gap");
    }
}
