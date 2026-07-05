// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { DrawManager } from "../src/DrawManager.sol";
import { Treasury } from "../src/Treasury.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract TreasuryTest is Test {
    PotVault internal vault;
    DrawManager internal draw;
    Treasury internal treasury;
    MockERC20 internal cusd;

    address internal keeper = address(0x33E3);
    address internal bigPot = address(0xB16);
    address internal amara = address(0xA3a);

    uint256 internal constant MIN = 0.1e18;
    uint256 internal constant DAY = 1 days;

    bytes32 internal constant ANCHOR_HASH = keccak256("test-anchor");

    function setUp() public {
        vm.warp(20_000 * DAY + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        draw = new DrawManager(vault, keeper);
        vault.setDrawManager(address(draw));
        treasury = new Treasury(IERC20(address(cusd)), vault, draw);

        cusd.mint(bigPot, 100e18);
        cusd.mint(amara, 100e18);
    }

    // ------------------------------------------------------------------ rake

    function test_CollectRakePullsAndAccounts() public {
        uint256 periodId = vault.currentPeriod();
        vm.startPrank(bigPot);
        cusd.approve(address(treasury), 5e18);
        treasury.collectRake(5e18, periodId);
        vm.stopPrank();

        assertEq(cusd.balanceOf(address(treasury)), 5e18);
        assertEq(treasury.rakeOf(periodId), 5e18);
        assertEq(treasury.totalRake(), 5e18);
    }

    function test_CollectRakeAccumulatesAcrossPeriods() public {
        uint256 p1 = vault.currentPeriod();
        vm.startPrank(bigPot);
        cusd.approve(address(treasury), 8e18);
        treasury.collectRake(3e18, p1);
        treasury.collectRake(5e18, p1 + 1);
        vm.stopPrank();

        assertEq(treasury.rakeOf(p1), 3e18);
        assertEq(treasury.rakeOf(p1 + 1), 5e18);
        assertEq(treasury.totalRake(), 8e18);
    }

    // -------------------------------------------------------------- fundJara

    function test_FundJaraRoutesRakeIntoPrizePot() public {
        uint256 periodId = vault.currentPeriod();
        vm.startPrank(bigPot);
        cusd.approve(address(treasury), 5e18);
        treasury.collectRake(5e18, periodId);
        vm.stopPrank();

        treasury.fundJara(periodId, 5e18);
        assertEq(vault.periodInfo(periodId).jaraPot, 5e18);
        assertEq(cusd.balanceOf(address(treasury)), 0);
    }

    function test_RevertWhenFundJaraNotAdmin() public {
        uint256 periodId = vault.currentPeriod();
        vm.prank(amara);
        vm.expectRevert(Treasury.NotAdmin.selector);
        treasury.fundJara(periodId, 1e18);
    }

    // ---------------------------------------------------------------- fees

    function test_WithdrawFeesTransfersOut() public {
        vm.startPrank(bigPot);
        cusd.approve(address(treasury), 5e18);
        treasury.collectRake(5e18, vault.currentPeriod());
        vm.stopPrank();

        treasury.withdrawFees(address(0xFEE5), 2e18);
        assertEq(cusd.balanceOf(address(0xFEE5)), 2e18);
        assertEq(cusd.balanceOf(address(treasury)), 3e18);
    }

    function test_RevertWhenWithdrawFeesNotAdmin() public {
        vm.prank(amara);
        vm.expectRevert(Treasury.NotAdmin.selector);
        treasury.withdrawFees(amara, 1);
    }

    function test_RevertWhenWithdrawFeesToZero() public {
        vm.expectRevert(Treasury.ZeroAddress.selector);
        treasury.withdrawFees(address(0), 1);
    }

    // ----------------------------------------------------------------- sweep

    function test_SweepUnclaimedRecyclesThroughDrawManager() public {
        // Winning period nobody claims: amara on 7 with a 4 cUSD pot.
        uint256 periodId = vault.currentPeriod();
        vm.startPrank(amara);
        cusd.approve(address(vault), 1e18);
        vault.contribute(1e18);
        draw.pickNumber(7);
        cusd.approve(address(vault), 4e18);
        vault.fundJara(periodId, 4e18);
        vm.stopPrank();
        _resolveWithNumber(periodId, 7);

        vm.expectRevert(DrawManager.WindowStillOpen.selector);
        treasury.sweepUnclaimed(periodId);

        vm.warp(block.timestamp + draw.CLAIM_WINDOW() + 1);
        treasury.sweepUnclaimed(periodId);

        assertEq(vault.periodInfo(periodId).jaraPot, 0);
        assertEq(vault.periodInfo(vault.currentPeriod()).jaraPot, 4e18);
    }

    function _resolveWithNumber(uint256 periodId, uint8 target) internal {
        uint256 periodEnd = (periodId + 1) * DAY;

        bytes32 secret;
        for (uint256 i = 0;; i++) {
            secret = bytes32(i);
            if (uint8(uint256(keccak256(abi.encode(secret, ANCHOR_HASH))) % 9) + 1 == target) {
                break;
            }
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
}
