// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { DrawManager } from "../src/DrawManager.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { Treasury }
from "../src/Treasury.sol";
import { MockTreasury } from "./mocks/MockTreasury.sol";
import { VRFCoordinatorV2Mock } from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";

contract DrawVRFTest is Test {
    VRFCoordinatorV2Mock internal vrfMock;
    Treasury internal treasury;
    PotVault internal vault;
    DrawManager internal draw;
    MockERC20 internal cusd;

    address internal keeper = address(0x33E3);
    address internal amara = address(0xA3a);

    uint256 internal constant MIN = 0.1e18;
    uint256 internal constant DAY = 1 days;

    uint256 internal period;
    uint256 internal periodEnd;

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

        period = vault.currentPeriod();
        periodEnd = (period + 1) * DAY;

        cusd.mint(amara, 10e18);
        vm.startPrank(amara);
        cusd.approve(address(vault), 10e18);
        vault.contribute(1e18);
        draw.pickNumber(5);
        vm.stopPrank();
    }

    function test_ResolveDrawRequestsRandomness() public {
        vm.warp(periodEnd + 1);
        vm.prank(keeper);
        draw.resolveDraw(period);
        uint256 requestId = 1;
        assertGt(requestId, 0, "request ID is non-zero");
    }

    function test_RevertResolveBeforePeriodOver() public {
        vm.warp(periodEnd - 1 minutes);
        vm.prank(keeper);
        vm.expectRevert(DrawManager.PeriodNotOver.selector);
        draw.resolveDraw(period);
    }

    function test_RevertDoubleResolve() public {
        vm.warp(periodEnd + 1);
        vm.prank(keeper);
        uint256 reqId = 1; // mock next id
        draw.resolveDraw(period);
        
        uint256[] memory words = new uint256[](1);
        vrfMock.fulfillRandomWordsWithOverride(reqId, address(draw), words);

        vm.prank(keeper);
        vm.expectRevert(DrawManager.AlreadyResolved.selector);
        draw.resolveDraw(period);
    }

    function test_FulfillDerivesWinningNumber() public {
        vm.warp(periodEnd + 1);
        vm.prank(keeper);
        draw.resolveDraw(period);
        uint256 requestId = 1;

        uint256[] memory words = new uint256[](1);
        words[0] = 4; // 4 % 9 + 1 = 5
        vrfMock.fulfillRandomWordsWithOverride(requestId, address(draw), words);

        DrawManager.Draw memory d = draw.drawOf(period);
        assertTrue(d.resolved);
        assertEq(d.winningNumber, 5);
        assertTrue(draw.isWinner(amara, period));
    }

    function test_RevertFulfillFromNonCoordinator() public {
        vm.warp(periodEnd + 1);
        vm.prank(keeper);
        draw.resolveDraw(period);

        uint256[] memory words = new uint256[](1);
        vm.expectRevert();
        draw.rawFulfillRandomWords(1, words);
    }
}
