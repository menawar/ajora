// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { DrawManager } from "../src/DrawManager.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract DrawManagerTest is Test {
    PotVault internal vault;
    DrawManager internal draw;
    MockERC20 internal cusd;

    address internal keeper = address(0x33E3);
    address internal sponsor = address(0x5075);
    address internal amara = address(0xA3a);
    address internal kevin = address(0xE1);
    address internal kwame = address(0xA33);

    uint256 internal constant MIN = 0.1e18;
    uint256 internal constant DAY = 1 days;

    function setUp() public {
        vm.warp(20_000 * DAY + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        draw = new DrawManager(vault, keeper);
        vault.setDrawManager(address(draw));

        for (uint160 i = 0; i < 3; i++) {
            address u = [amara, kevin, kwame][i];
            cusd.mint(u, 100e18);
        }
        cusd.mint(sponsor, 100e18);
    }

    function _save(address who, uint256 amount) internal returns (uint256 tickets) {
        vm.startPrank(who);
        cusd.approve(address(vault), amount);
        tickets = vault.contribute(amount);
        vm.stopPrank();
    }

    function _fundJara(uint256 periodId, uint256 amount) internal {
        vm.startPrank(sponsor);
        cusd.approve(address(vault), amount);
        vault.fundJara(periodId, amount);
        vm.stopPrank();
    }

    bytes32 internal constant ANCHOR_HASH = keccak256("test-anchor");

    /// @dev Resolve `periodId` so that `target` wins, via the real commit->reveal flow:
    ///      brute-force a secret whose blended seed lands on `target`, commit it inside the
    ///      final window, mine past the anchor, pin the anchor hash, and reveal.
    function _resolveWithNumber(uint256 periodId, uint8 target) internal {
        uint256 periodEnd = (periodId + 1) * DAY;

        bytes32 secret;
        for (uint256 i = 0;; i++) {
            secret = bytes32(i);
            uint256 seed = uint256(keccak256(abi.encode(secret, ANCHOR_HASH)));
            if (uint8(seed % 9) + 1 == target) break;
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

    // ----------------------------------------------------------------- picks

    function test_PickSnapshotsTicketWeight() public {
        uint256 period = vault.currentPeriod();
        _save(amara, 1e18); // 10 tickets

        vm.prank(amara);
        draw.pickNumber(7);

        (uint8 number, uint256 weight) = draw.pickOf(amara, period);
        assertEq(number, 7);
        assertEq(weight, 10);
        assertEq(draw.weightOnNumber(period, 7), 10);
    }

    function test_RevertPickWithoutTickets() public {
        vm.prank(amara);
        vm.expectRevert(DrawManager.NoTickets.selector);
        draw.pickNumber(5);
    }

    function test_RevertPickInvalidNumber() public {
        _save(amara, 1e18);
        vm.startPrank(amara);
        vm.expectRevert(DrawManager.InvalidNumber.selector);
        draw.pickNumber(0);
        vm.expectRevert(DrawManager.InvalidNumber.selector);
        draw.pickNumber(10);
        vm.stopPrank();
    }

    function test_RepickAfterTopUpRefreshesWeightAndMovesBucket() public {
        uint256 period = vault.currentPeriod();
        _save(amara, 1e18); // 10 tickets
        vm.prank(amara);
        draw.pickNumber(3);

        _save(amara, 1e18); // now 20 tickets total this period
        vm.prank(amara);
        draw.pickNumber(8); // re-pick: move to 8 with refreshed weight

        (uint8 number, uint256 weight) = draw.pickOf(amara, period);
        assertEq(number, 8);
        assertEq(weight, 20);
        assertEq(draw.weightOnNumber(period, 3), 0, "old bucket backed out");
        assertEq(draw.weightOnNumber(period, 8), 20);
    }

    // ------------------------------------------------------------ resolution

    function test_ResolveDerivesWinningNumberAndSnapshotsPot() public {
        uint256 period = vault.currentPeriod();
        _save(amara, 1e18);
        vm.prank(amara);
        draw.pickNumber(4);
        _fundJara(period, 9e18);

        _resolveWithNumber(period, 4);

        DrawManager.Draw memory d = draw.drawOf(period);
        assertTrue(d.resolved);
        assertEq(d.winningNumber, 4);
        assertEq(d.pot, 9e18, "pot snapshotted");
        assertEq(d.totalWinningWeight, 10);
        assertTrue(draw.isWinner(amara, period));
    }

    function test_RevertRevealBeforePeriodOver() public {
        // Defense in depth: even a mined anchor can't resolve a period still in flight.
        uint256 period = vault.currentPeriod();
        uint256 periodEnd = (period + 1) * DAY;
        vm.warp(periodEnd - 5 minutes);
        bytes32 secret = bytes32(uint256(42));
        vm.prank(keeper);
        draw.commitSeed(period, keccak256(abi.encode(secret)));
        (, uint64 anchor) = draw.seedCommits(period);

        vm.roll(uint256(anchor) + 10); // anchor mined but period NOT over
        vm.setBlockhash(anchor, ANCHOR_HASH);
        vm.expectRevert(DrawManager.PeriodNotOver.selector);
        draw.revealAndResolve(period, secret);
    }

    function test_RevertSecondRevealAlreadyResolved() public {
        uint256 period = vault.currentPeriod();
        _save(amara, 1e18);
        vm.prank(amara);
        draw.pickNumber(4);
        _resolveWithNumber(period, 4);

        // Replaying the same reveal can't resolve twice.
        (bytes32 commitment,) = draw.seedCommits(period);
        bytes32 secret;
        for (uint256 i = 0;; i++) {
            secret = bytes32(i);
            if (keccak256(abi.encode(secret)) == commitment) break;
            if (i > 1000) revert("secret not found");
        }
        vm.expectRevert(DrawManager.AlreadyResolved.selector);
        draw.revealAndResolve(period, secret);
    }

    function test_NoWinnerRecyclesPotToCurrentPeriod() public {
        uint256 period = vault.currentPeriod();
        _save(amara, 1e18);
        vm.prank(amara);
        draw.pickNumber(4);
        _fundJara(period, 9e18);

        _resolveWithNumber(period, 5); // 5 wins, only 4 was picked
        uint256 nextPeriod = vault.currentPeriod();

        assertEq(vault.periodInfo(period).jaraPot, 0, "old period emptied");
        assertEq(vault.periodInfo(nextPeriod).jaraPot, 9e18, "pot rolled forward");
        assertEq(draw.drawOf(period).pot, 0, "nothing claimable");
        assertFalse(draw.isWinner(amara, period));
    }

    // ---------------------------------------------------------------- claims

    /// @dev Amara 10 tickets and Kevin 30 tickets both pick 6; Kwame picks 2. Pot 8 cUSD.
    function _setupResolvedDraw() internal returns (uint256 period) {
        period = vault.currentPeriod();
        _save(amara, 1e18); // 10 tickets
        _save(kevin, 3e18); // 30 tickets
        _save(kwame, 1e18); // 10 tickets
        vm.prank(amara);
        draw.pickNumber(6);
        vm.prank(kevin);
        draw.pickNumber(6);
        vm.prank(kwame);
        draw.pickNumber(2);
        _fundJara(period, 8e18);

        _resolveWithNumber(period, 6);
    }

    function test_WinnersSplitPotProRata() public {
        uint256 period = _setupResolvedDraw();

        vm.prank(amara);
        uint256 aShare = draw.claimPrize(period);
        vm.prank(kevin);
        uint256 kShare = draw.claimPrize(period);

        assertEq(aShare, 2e18, "10/40 of 8");
        assertEq(kShare, 6e18, "30/40 of 8");

        // Settled into vault winnings, withdrawable as real stablecoin.
        vm.prank(amara);
        assertEq(vault.claimWinnings(period), 2e18);
        vm.prank(kevin);
        assertEq(vault.claimWinnings(period), 6e18);
    }

    function test_RevertClaimTwice() public {
        uint256 period = _setupResolvedDraw();
        vm.startPrank(amara);
        draw.claimPrize(period);
        vm.expectRevert(DrawManager.AlreadyClaimed.selector);
        draw.claimPrize(period);
        vm.stopPrank();
    }

    function test_RevertClaimByLoser() public {
        uint256 period = _setupResolvedDraw();
        vm.prank(kwame); // picked 2, winning number was 6
        vm.expectRevert(DrawManager.NotAWinner.selector);
        draw.claimPrize(period);
    }

    function test_RevertClaimBeforeResolve() public {
        uint256 period = vault.currentPeriod();
        _save(amara, 1e18);
        vm.startPrank(amara);
        draw.pickNumber(6);
        vm.expectRevert(DrawManager.NotResolved.selector);
        draw.claimPrize(period);
        vm.stopPrank();
    }

    /// @notice For any pot and weights, total claims never exceed the pot and principal
    ///         stays fully redeemable for everyone.
    function testFuzz_ClaimsNeverExceedPot(uint96 potRaw, uint8 wA, uint8 wK) public {
        uint256 pot = bound(uint256(potRaw), 1, 50e18);
        uint256 saveA = MIN * (uint256(wA) % 50 + 1);
        uint256 saveK = MIN * (uint256(wK) % 50 + 1);

        uint256 period = vault.currentPeriod();
        _save(amara, saveA);
        _save(kevin, saveK);
        vm.prank(amara);
        draw.pickNumber(9);
        vm.prank(kevin);
        draw.pickNumber(9);
        _fundJara(period, pot);

        _resolveWithNumber(period, 9);

        vm.prank(amara);
        uint256 a = draw.claimPrize(period);
        vm.prank(kevin);
        uint256 k = draw.claimPrize(period);

        assertLe(a + k, pot, "claims bounded by pot");

        vm.prank(amara);
        assertEq(vault.claimPrincipal(period), saveA, "principal untouched");
        vm.prank(kevin);
        assertEq(vault.claimPrincipal(period), saveK, "principal untouched");
    }
}
