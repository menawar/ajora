// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { StdInvariant } from "forge-std/StdInvariant.sol";
import { PotVault } from "../src/PotVault.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @notice Randomized action handler with exact ghost accounting. Every cUSD that enters
///         the vault is tagged principal / jara / winnings; the invariant demands the
///         vault's token balance equals the sum at all times.
contract VaultHandler is Test {
    PotVault public immutable vault;
    MockERC20 public immutable cusd;
    address public immutable drawManager;
    address public immutable faucet;

    uint256 public ghostPrincipal;
    uint256 public ghostJara;
    uint256 public ghostWinnings;

    address[3] internal actors = [address(0xA1), address(0xA2), address(0xA3)];
    uint256 internal constant MIN = 0.1e18;

    constructor(PotVault _vault, MockERC20 _cusd, address _drawManager, address _faucet) {
        vault = _vault;
        cusd = _cusd;
        drawManager = _drawManager;
        faucet = _faucet;
        for (uint256 i = 0; i < actors.length; i++) {
            cusd.mint(actors[i], 1_000e18);
        }
        cusd.mint(address(this), 1_000e18); // sponsor budget for fundJara
        cusd.approve(address(vault), type(uint256).max);
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function contribute(uint256 actorSeed, uint256 amount) external {
        address who = _actor(actorSeed);
        amount = bound(amount, MIN, 50e18);
        if (cusd.balanceOf(who) < amount) return;
        vm.startPrank(who);
        cusd.approve(address(vault), amount);
        vault.contribute(amount);
        vm.stopPrank();
        ghostPrincipal += amount;
    }

    function warpDay() external {
        vm.warp(block.timestamp + 1 days);
    }

    function claimPrincipal(uint256 actorSeed, uint256 daysBack) external {
        address who = _actor(actorSeed);
        daysBack = bound(daysBack, 1, 10);
        uint256 periodId = vault.currentPeriod() - daysBack;
        if (vault.principalOf(who, periodId) == 0) return;
        vm.prank(who);
        uint256 got = vault.claimPrincipal(periodId);
        ghostPrincipal -= got;
    }

    function fundJara(uint256 amount, uint256 daysAhead) external {
        amount = bound(amount, 1, 20e18);
        if (cusd.balanceOf(address(this)) < amount) return;
        uint256 periodId = vault.currentPeriod() + bound(daysAhead, 0, 3);
        vault.fundJara(periodId, amount);
        ghostJara += amount;
    }

    function settleWinnings(uint256 actorSeed, uint256 amount, uint256 daysBack) external {
        address who = _actor(actorSeed);
        uint256 periodId = vault.currentPeriod() - bound(daysBack, 0, 5);
        uint256 pot = vault.periodInfo(periodId).jaraPot;
        if (pot == 0) return;
        amount = bound(amount, 1, pot);
        vm.prank(drawManager);
        vault.settleWinnings(who, periodId, amount);
        ghostJara -= amount;
        ghostWinnings += amount;
    }

    function claimWinnings(uint256 actorSeed, uint256 daysBack) external {
        address who = _actor(actorSeed);
        uint256 periodId = vault.currentPeriod() - bound(daysBack, 0, 5);
        vm.prank(who);
        try vault.claimWinnings(periodId) returns (uint256 got) {
            ghostWinnings -= got;
        } catch { }
    }

    function rollJara(uint256 daysBack, uint256 amount) external {
        uint256 from = vault.currentPeriod() - bound(daysBack, 1, 5);
        uint256 pot = vault.periodInfo(from).jaraPot;
        if (pot == 0) return;
        amount = bound(amount, 1, pot);
        vm.prank(drawManager);
        vault.rollJara(from, vault.currentPeriod(), amount);
        // internal move: ghosts unchanged
    }

    function creditTickets(uint256 actorSeed, uint256 n) external {
        vm.prank(faucet);
        vault.creditTickets(_actor(actorSeed), vault.currentPeriod(), bound(n, 1, 10));
        // odds only: no money moves
    }
}

/// @notice The one invariant that makes Ajora "not a Ponzi" mechanical: the vault always
///         holds exactly every cent of principal + jara + unclaimed winnings. No action
///         sequence may create or destroy user money.
contract VaultInvariantTest is StdInvariant, Test {
    PotVault internal vault;
    MockERC20 internal cusd;
    VaultHandler internal handler;

    address internal drawManager = address(0xD3A3);
    address internal faucet = address(0xFA);

    function setUp() public {
        vm.warp(20_000 days + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), 0.1e18);
        vault.setDrawManager(drawManager);
        vault.setSprayFaucet(faucet);

        handler = new VaultHandler(vault, cusd, drawManager, faucet);
        targetContract(address(handler));
    }

    function invariant_VaultBalanceExactlyBacksAllClaims() public view {
        assertEq(
            cusd.balanceOf(address(vault)),
            handler.ghostPrincipal() + handler.ghostJara() + handler.ghostWinnings(),
            "vault balance != principal + jara + winnings"
        );
    }
}
