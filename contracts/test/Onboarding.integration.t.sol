// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { SprayFaucet } from "../src/SprayFaucet.sol";
import { StreakSBT } from "../src/StreakSBT.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IStreakSBT } from "../src/interfaces/IStreakSBT.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @notice End-to-end zero-deposit onboarding (AJORA_SPEC.md §2, §4): a brand-new verified
///         user receives a sponsored welcome ticket, gets sprayed by a friend, wins the
///         draw, and claims real stablecoin — having never deposited a cent.
contract OnboardingIntegrationTest is Test {
    PotVault internal vault;
    SprayFaucet internal faucet;
    StreakSBT internal sbt;
    MockERC20 internal cusd;

    address internal verifier = address(0xFEED);
    address internal sponsor = address(0x5075);
    address internal drawManager = address(0xD3A3);
    address internal amara = address(0xA3a); // existing user
    address internal newUser = address(0x4E3);

    uint256 internal constant MIN = 0.1e18;

    function setUp() public {
        vm.warp(20_000 days + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        sbt = new StreakSBT();
        faucet = new SprayFaucet(vault, verifier);
        vault.setStreakSBT(IStreakSBT(address(sbt)));
        vault.setSprayFaucet(address(faucet));
        vault.setDrawManager(drawManager);

        // Sponsor funds the launch campaign.
        cusd.mint(sponsor, 100e18);
        vm.startPrank(sponsor);
        cusd.approve(address(faucet), 100e18);
        faucet.fundSponsorPool(100e18, "launch");
        vm.stopPrank();

        // Amara is an established, verified user with her own savings.
        vm.prank(verifier);
        faucet.setVerified(amara, true);
        cusd.mint(amara, 10e18);
        vm.startPrank(amara);
        cusd.approve(address(vault), 10e18);
        vault.contribute(1e18);
        vm.stopPrank();
    }

    function test_ZeroDeposit_NewUserWinsRealMoney() public {
        uint256 period = vault.currentPeriod();

        // 1. New user opens the app; backend attests their MiniPay phone verification.
        vm.prank(verifier);
        faucet.setVerified(newUser, true);

        // 2. Onboarding fires the sponsored welcome ticket (permissionless trigger).
        faucet.welcomeTicket(newUser);

        // 3. Amara sprays her friend one more ticket. Costs her nothing.
        vm.prank(amara);
        faucet.spray(newUser);

        assertEq(vault.ticketsOf(newUser, period), 2, "welcome + spray odds");
        assertEq(cusd.balanceOf(newUser), 0, "still never spent a cent");

        // 4. 8 PM: the new user's number hits. DrawManager settles the whole jara pot to them.
        uint256 pot = vault.periodInfo(period).jaraPot;
        assertEq(pot, 2 * MIN, "two sponsored tickets back the pot");
        vm.prank(drawManager);
        vault.settleWinnings(newUser, period, pot);

        // 5. Winner claims real stablecoin.
        vm.prank(newUser);
        uint256 won = vault.claimWinnings(period);
        assertEq(won, pot);
        assertEq(cusd.balanceOf(newUser), pot, "real cUSD, zero deposit");

        // 6. No-loss check: Amara's principal remains fully redeemable.
        vm.prank(amara);
        assertEq(vault.claimPrincipal(period), 1e18);
    }
}
