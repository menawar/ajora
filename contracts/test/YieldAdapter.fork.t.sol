// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { YieldAdapter } from "../src/YieldAdapter.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IAaveV3Pool } from "../src/interfaces/IAaveV3Pool.sol";
import { IYieldAdapter } from "../src/interfaces/IYieldAdapter.sol";

/// @notice Fork tests against the live Aave v3 cUSD reserve on Celo mainnet — the venue
///         chosen for launch (audited, instant-liquidity, cUSD-native).
/// @dev Skipped unless CELO_FORK_RPC is set, e.g.:
///      CELO_FORK_RPC=https://forno.celo.org forge test --match-contract Fork

import { Treasury }
from "../src/Treasury.sol";
import { MockTreasury } from "./mocks/MockTreasury.sol";
import { IPoolAddressesProvider } from "../src/interfaces/IPoolAddressesProvider.sol";
import { MockPoolAddressesProvider } from "./mocks/MockPoolAddressesProvider.sol";
contract YieldAdapterForkTest is Test {
    Treasury internal treasury;

    // Celo mainnet (bgd-labs address book / verified on-chain).
    address internal constant CUSD = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address internal constant AAVE_POOL = 0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402;
    address internal constant A_CUSD = 0xBba98352628B0B0c4b40583F593fFCb630935a45;

    PotVault internal vault;
    YieldAdapter internal adapter;

    address internal alice = address(0xA11CE);
    bool internal forked;

    function setUp() public {
        treasury = Treasury(address(new MockTreasury()));
        string memory rpc = vm.envOr("CELO_FORK_RPC", string(""));
        if (bytes(rpc).length == 0) return;
        vm.createSelectFork(rpc);
        forked = true;

        vault = new PotVault(IERC20(CUSD), 0.1e18);
        adapter = new YieldAdapter(
            IERC20(CUSD), vault, IPoolAddressesProvider(address(new MockPoolAddressesProvider(address(IAaveV3Pool(AAVE_POOL))))), IERC20(A_CUSD), treasury, 1_000e18
        );
        vault.proposeYieldAdapter(IYieldAdapter(address(adapter)));
        vm.warp(block.timestamp + vault.ADAPTER_TIMELOCK());
        vault.applyYieldAdapter();

        deal(CUSD, alice, 100e18);
    }

    modifier onlyFork() {
        vm.skip(!forked);
        _;
    }

    function _contribute(uint256 amount) internal {
        vm.startPrank(alice);
        IERC20(CUSD).approve(address(vault), amount);
        vault.contribute(amount);
        vm.stopPrank();
    }

    function test_fork_DeployIdleSuppliesRealAave() public onlyFork {
        _contribute(100e18);
        vault.deployIdle(80e18);

        assertEq(adapter.totalDeployed(), 80e18);
        // Aave scaled-balance rounding can be off by a wei.
        assertApproxEqAbs(IERC20(A_CUSD).balanceOf(address(adapter)), 80e18, 1);
        assertEq(IERC20(CUSD).balanceOf(address(vault)), 20e18);
    }

    function test_fork_InterestAccruesAndHarvestFundsJara() public onlyFork {
        _contribute(100e18);
        vault.deployIdle(80e18);

        vm.warp(block.timestamp + 30 days);
        uint256 balance = IERC20(A_CUSD).balanceOf(address(adapter));
        assertGt(balance, 80e18, "cUSD reserve accrues interest over 30 days");

        uint256 periodId = vault.currentPeriod();
        uint256 harvested = adapter.harvest(periodId);
        assertGt(harvested, 0);
        assertEq(vault.periodInfo(periodId).jaraPot, harvested);
        assertApproxEqAbs(adapter.totalDeployed(), 80e18, 0, "principal untouched");
    }

    function test_fork_ClaimPrincipalAutoRecallsFromAave() public onlyFork {
        uint256 periodId = vault.currentPeriod();
        _contribute(100e18);
        vault.deployIdle(80e18);

        vm.warp(block.timestamp + 1 days);
        vm.prank(alice);
        uint256 got = vault.claimPrincipal(periodId);

        assertEq(got, 100e18);
        assertEq(IERC20(CUSD).balanceOf(alice), 100e18, "made whole from the venue");
    }
}
