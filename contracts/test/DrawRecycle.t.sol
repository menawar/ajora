// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { DrawManager } from "../src/DrawManager.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @notice Claim window + unclaimed-prize recycling (spec §6 sink): winners have
///         CLAIM_WINDOW after resolution; whatever they leave rolls into the live pot.

import { Treasury }
from "../src/Treasury.sol";
import { MockTreasury } from "./mocks/MockTreasury.sol";
import { MockPoolAddressesProvider } from "./mocks/MockPoolAddressesProvider.sol";
import { VRFCoordinatorV2Mock } from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";

contract DrawRecycleTest is Test {
    VRFCoordinatorV2Mock internal vrfMock;
    uint256 internal nextRequestId = 1;

    Treasury internal treasury;

    PotVault internal vault;
    DrawManager internal draw;
    MockERC20 internal cusd;

    address internal keeper = address(0x33E3);
    address internal sponsor = address(0x5075);
    address internal amara = address(0xA3a);
    address internal kevin = address(0xE1);

    uint256 internal constant MIN = 0.1e18;
    uint256 internal constant DAY = 1 days;

    bytes32 internal constant ANCHOR_HASH = keccak256("test-anchor");

    function setUp() public {
        treasury = Treasury(address(new MockTreasury()));
        vm.warp(20_000 * DAY + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        
        vrfMock = new VRFCoordinatorV2Mock(0.1e18, 1e9);
        uint64 subId = vrfMock.createSubscription();
        vrfMock.fundSubscription(subId, 100e18);
        
        draw = new DrawManager(vault, keeper, address(vrfMock), subId, bytes32(0));
        vrfMock.addConsumer(subId, address(draw));
        
        vault.setDrawManager(address(draw));

        cusd.mint(amara, 100e18);
        cusd.mint(kevin, 100e18);
        cusd.mint(sponsor, 100e18);
    }

    function _save(address who, uint256 amount) internal {
        vm.startPrank(who);
        cusd.approve(address(vault), amount);
        vault.contribute(amount);
        vm.stopPrank();
    }

    function _fundJara(uint256 periodId, uint256 amount) internal {
        vm.startPrank(sponsor);
        cusd.approve(address(vault), amount);
        vault.fundJara(periodId, amount);
        vm.stopPrank();
    }

    function _resolveWithNumber(uint256 periodId, uint8 target) internal {
        uint256 periodEnd = (periodId + 1) * DAY;
        vm.warp(periodEnd + 1);

        vm.prank(keeper);
        draw.resolveDraw(periodId);

        uint256[] memory words = new uint256[](1);
        words[0] = target - 1; // target = (word % 9) + 1 => target - 1 gives target
        vrfMock.fulfillRandomWordsWithOverride(nextRequestId++, address(draw), words);
    }

    /// @dev Winning setup: amara and kevin both on 7; 10 cUSD pot.
    function _winningPeriod() internal returns (uint256 periodId) {
        periodId = vault.currentPeriod();
        _save(amara, 1e18);
        _save(kevin, 3e18);
        vm.prank(amara);
        draw.pickNumber(7);
        vm.prank(kevin);
        draw.pickNumber(7);
        _fundJara(periodId, 10e18);
        _resolveWithNumber(periodId, 7);
    }

    function test_ClaimInsideWindowWorks() public {
        uint256 periodId = _winningPeriod();
        vm.warp(block.timestamp + draw.CLAIM_WINDOW() - 1 hours);
        vm.prank(amara);
        uint256 got = draw.claimPrize(periodId);
        assertEq(got, 2.5e18); // 10 * 10/40 tickets
    }

    function test_RevertWhenClaimAfterWindow() public {
        uint256 periodId = _winningPeriod();
        vm.warp(block.timestamp + draw.CLAIM_WINDOW() + 1);
        vm.prank(amara);
        vm.expectRevert(DrawManager.ClaimWindowClosed.selector);
        draw.claimPrize(periodId);
    }

    function test_RecycleSweepsUnclaimedIntoCurrentPot() public {
        uint256 periodId = _winningPeriod();

        // amara claims her 2.5; kevin sleeps on his 7.5.
        vm.prank(amara);
        draw.claimPrize(periodId);

        vm.warp(block.timestamp + draw.CLAIM_WINDOW() + 1);
        uint256 nowPeriod = vault.currentPeriod();
        uint256 recycled = draw.recycleUnclaimed(periodId);

        assertEq(recycled, 7.5e18, "kevin's unclaimed share recycles");
        assertEq(vault.periodInfo(nowPeriod).jaraPot, 7.5e18);
        assertEq(vault.periodInfo(periodId).jaraPot, 0);

        // amara's settled winnings are untouched by the sweep.
        vm.prank(amara);
        assertEq(vault.claimWinnings(periodId), 2.5e18);
    }

    function test_RevertWhenRecycleBeforeWindowClose() public {
        uint256 periodId = _winningPeriod();
        vm.warp(block.timestamp + draw.CLAIM_WINDOW() - 1 hours);
        vm.expectRevert(DrawManager.WindowStillOpen.selector);
        draw.recycleUnclaimed(periodId);
    }

    function test_RevertWhenRecycleUnresolvedPeriod() public {
        uint256 periodId = vault.currentPeriod();
        vm.expectRevert(DrawManager.NotResolved.selector);
        draw.recycleUnclaimed(periodId);
    }

    function test_RevertWhenNothingLeftToRecycle() public {
        uint256 periodId = _winningPeriod();
        vm.prank(amara);
        draw.claimPrize(periodId);
        vm.prank(kevin);
        draw.claimPrize(periodId);

        vm.warp(block.timestamp + draw.CLAIM_WINDOW() + 1);
        vm.expectRevert(DrawManager.NothingToRecycle.selector);
        draw.recycleUnclaimed(periodId);
    }

    function test_RecycleIsPermissionless() public {
        uint256 periodId = _winningPeriod();
        vm.warp(block.timestamp + draw.CLAIM_WINDOW() + 1);
        vm.prank(address(0xFEED));
        uint256 recycled = draw.recycleUnclaimed(periodId);
        assertEq(recycled, 10e18);
    }

    function test_LateResolutionStillGetsFullWindow() public {
        // Period passes with no commit (keeper outage); recommit days later.
        uint256 periodId = vault.currentPeriod();
        _save(amara, 1e18);
        vm.prank(amara);
        draw.pickNumber(7);
        _fundJara(periodId, 5e18);

        vm.warp(block.timestamp + 9 days); // way past periodEnd + CLAIM_WINDOW anchor on periodEnd

        // The window runs from resolution, not from the period end.
        vm.prank(keeper);
        draw.resolveDraw(periodId);
        uint256[] memory words = new uint256[](1);
        words[0] = 6; // 6 % 9 + 1 = 7
        vrfMock.fulfillRandomWordsWithOverride(nextRequestId++, address(draw), words);

        // The window runs from resolution, not from the period end.
        vm.warp(block.timestamp + draw.CLAIM_WINDOW() - 1 hours);
        vm.prank(amara);
        assertEq(draw.claimPrize(periodId), 5e18);
    }
}
