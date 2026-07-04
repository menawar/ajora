// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { DrawManager } from "../src/DrawManager.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @notice Commit-reveal randomness: window gating, blockhash blending, permissionless
///         reveal, expiry, and the recommit liveness fallback (contracts/RANDOMNESS.md).
contract DrawRandomnessTest is Test {
    PotVault internal vault;
    DrawManager internal draw;
    MockERC20 internal cusd;

    address internal keeper = address(0x33E3);
    address internal amara = address(0xA3a);

    uint256 internal constant MIN = 0.1e18;
    uint256 internal constant DAY = 1 days;

    bytes32 internal constant SECRET = keccak256("ajora-day-1");
    bytes32 internal COMMITMENT;

    uint256 internal period;
    uint256 internal periodEnd;

    function setUp() public {
        vm.warp(20_000 * DAY + 12 hours);
        vm.roll(1_000_000);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        draw = new DrawManager(vault, keeper);
        vault.setDrawManager(address(draw));

        COMMITMENT = keccak256(abi.encode(SECRET));
        period = vault.currentPeriod();
        periodEnd = (period + 1) * DAY;

        cusd.mint(amara, 10e18);
        vm.startPrank(amara);
        cusd.approve(address(vault), 10e18);
        vault.contribute(1e18);
        draw.pickNumber(5);
        vm.stopPrank();
    }

    /// @dev Commit inside the window; returns the pinned anchor block.
    function _commit() internal returns (uint256 anchor) {
        vm.warp(periodEnd - 5 minutes);
        vm.prank(keeper);
        draw.commitSeed(period, COMMITMENT);
        (, uint64 anchorBlock) = draw.seedCommits(period);
        anchor = anchorBlock;
    }

    // ---------------------------------------------------------------- commit

    function test_CommitPinsFutureAnchor() public {
        uint256 anchor = _commit();
        assertEq(anchor, block.number + draw.ANCHOR_DELAY(), "anchor is strictly future");
        (bytes32 commitment,) = draw.seedCommits(period);
        assertEq(commitment, COMMITMENT);
    }

    function test_RevertCommitBeforeFinalWindow() public {
        vm.warp(periodEnd - 16 minutes); // one minute too early
        vm.prank(keeper);
        vm.expectRevert(DrawManager.CommitWindowClosed.selector);
        draw.commitSeed(period, COMMITMENT);
    }

    function test_RevertCommitForPastPeriod() public {
        vm.warp(periodEnd + 1); // period already over
        vm.prank(keeper);
        vm.expectRevert(DrawManager.CommitWindowClosed.selector);
        draw.commitSeed(period, COMMITMENT);
    }

    function test_RevertCommitNotKeeper() public {
        vm.warp(periodEnd - 5 minutes);
        vm.expectRevert(DrawManager.NotKeeper.selector);
        draw.commitSeed(period, COMMITMENT);
    }

    function test_RevertDoubleCommit() public {
        _commit();
        vm.prank(keeper);
        vm.expectRevert(DrawManager.AlreadyCommitted.selector);
        draw.commitSeed(period, keccak256("other"));
    }

    // ---------------------------------------------------------------- reveal

    function test_RevealDerivesVerifiableSeed() public {
        uint256 anchor = _commit();
        bytes32 anchorHash = keccak256("anchor-hash");
        vm.warp(periodEnd + 1 hours);
        vm.roll(anchor + 10);
        vm.setBlockhash(anchor, anchorHash);

        // Permissionless: amara (not the keeper) relays the reveal.
        vm.prank(amara);
        draw.revealAndResolve(period, SECRET);

        DrawManager.Draw memory d = draw.drawOf(period);
        assertTrue(d.resolved);
        // The exact five-equality recipe from RANDOMNESS.md, recomputed independently:
        uint256 expectedSeed = uint256(keccak256(abi.encode(SECRET, anchorHash)));
        assertEq(d.seed, expectedSeed, "seed publicly recomputable");
        assertEq(d.winningNumber, uint8(expectedSeed % 9) + 1, "number follows the seed");
    }

    function test_RevertRevealWrongSecret() public {
        uint256 anchor = _commit();
        vm.warp(periodEnd + 1 hours);
        vm.roll(anchor + 10);
        vm.setBlockhash(anchor, keccak256("h"));
        vm.expectRevert(DrawManager.BadReveal.selector);
        draw.revealAndResolve(period, keccak256("wrong-secret"));
    }

    function test_RevertRevealWithoutCommit() public {
        vm.warp(periodEnd + 1 hours);
        vm.expectRevert(DrawManager.NoCommit.selector);
        draw.revealAndResolve(period, SECRET);
    }

    function test_RevertRevealBeforeAnchorMined() public {
        uint256 anchor = _commit();
        vm.warp(periodEnd + 1 hours);
        vm.roll(anchor); // at the anchor, not past it
        vm.expectRevert(DrawManager.AnchorNotReady.selector);
        draw.revealAndResolve(period, SECRET);
    }

    function test_RevertRevealAfterWindowExpires() public {
        uint256 anchor = _commit();
        vm.warp(periodEnd + 1 hours);
        vm.roll(anchor + 300); // blockhash(anchor) unavailable -> 0
        vm.expectRevert(DrawManager.AnchorExpired.selector);
        draw.revealAndResolve(period, SECRET);
    }

    // -------------------------------------------------------------- recommit

    function test_RecommitOnlyAfterExpiry_ThenRevealWorks() public {
        uint256 anchor = _commit();
        vm.warp(periodEnd + 1 hours);

        // Too early to recommit while the reveal window is live.
        vm.roll(anchor + 100);
        vm.prank(keeper);
        vm.expectRevert(DrawManager.AnchorStillLive.selector);
        draw.recommitSeed(period, COMMITMENT);

        // Window expires unrevealed -> fresh cycle with a new secret.
        vm.roll(anchor + 300);
        bytes32 secret2 = keccak256("ajora-day-1-retry");
        vm.prank(keeper);
        draw.recommitSeed(period, keccak256(abi.encode(secret2)));
        (, uint64 anchor2) = draw.seedCommits(period);
        assertEq(anchor2, block.number + draw.ANCHOR_DELAY());

        vm.roll(uint256(anchor2) + 5);
        vm.setBlockhash(anchor2, keccak256("retry-hash"));
        draw.revealAndResolve(period, secret2);
        assertTrue(draw.drawOf(period).resolved);
    }

    function test_RevertRecommitNotKeeper() public {
        uint256 anchor = _commit();
        vm.warp(periodEnd + 1 hours);
        vm.roll(anchor + 300);
        vm.expectRevert(DrawManager.NotKeeper.selector);
        draw.recommitSeed(period, COMMITMENT);
    }
}
