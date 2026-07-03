// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { SprayFaucet } from "../src/SprayFaucet.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract SprayFaucetTest is Test {
    PotVault internal vault;
    SprayFaucet internal faucet;
    MockERC20 internal cusd;

    address internal verifier = address(0xFEED);
    address internal sponsor = address(0x5075);
    address internal amara = address(0xA3a);
    address internal kevin = address(0xE1);

    uint256 internal constant MIN = 0.1e18; // ticketValue
    bytes32 internal constant MTN = "mtn-mega-jara";
    bytes32 internal constant SAFARICOM = "safaricom-launch";

    function setUp() public {
        vm.warp(20_000 days + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        faucet = new SprayFaucet(vault, verifier);
        vault.setSprayFaucet(address(faucet));

        cusd.mint(sponsor, 1000e18);
    }

    function _fund(bytes32 campaign, uint256 amount) internal {
        vm.startPrank(sponsor);
        cusd.approve(address(faucet), amount);
        faucet.fundSponsorPool(amount, campaign);
        vm.stopPrank();
    }

    function _verify(address user) internal {
        vm.prank(verifier);
        faucet.setVerified(user, true);
    }

    // -------------------------------------------------------------- funding

    function test_FundSponsorPoolAccruesToCampaign() public {
        _fund(MTN, 10e18);
        assertEq(faucet.campaignBalance(MTN), 10e18);
        assertEq(cusd.balanceOf(address(faucet)), 10e18);
    }

    function test_FirstFundedCampaignAutoActivates() public {
        _fund(MTN, 10e18);
        assertEq(faucet.activeCampaign(), MTN);
    }

    function test_CampaignBudgetsAreIsolated() public {
        _fund(MTN, 1e18);
        _fund(SAFARICOM, 5e18);
        assertEq(faucet.activeCampaign(), MTN, "first campaign stays active");

        // Drain MTN (10 tickets at 0.1) — Safaricom's budget must be untouchable.
        _verify(amara);
        for (uint256 i = 0; i < 10; i++) {
            address user = address(uint160(0x1000 + i));
            vm.prank(verifier);
            faucet.setVerified(user, true);
            faucet.welcomeTicket(user);
        }
        assertEq(faucet.campaignBalance(MTN), 0);
        assertEq(faucet.campaignBalance(SAFARICOM), 5e18, "isolated");

        vm.expectRevert(SprayFaucet.InsufficientCampaignBudget.selector);
        faucet.welcomeTicket(amara);
    }

    function test_SetActiveCampaignOnlyAdmin() public {
        _fund(MTN, 1e18);
        vm.prank(amara);
        vm.expectRevert(SprayFaucet.NotAdmin.selector);
        faucet.setActiveCampaign(SAFARICOM);

        faucet.setActiveCampaign(SAFARICOM); // test contract is admin
        assertEq(faucet.activeCampaign(), SAFARICOM);
    }

    function test_SetVerifiedOnlyVerifier() public {
        vm.expectRevert(SprayFaucet.NotVerifier.selector);
        faucet.setVerified(amara, true);
    }

    // ------------------------------------------------------- welcome ticket

    function test_WelcomeTicketCreditsOddsAndBacksJara() public {
        _fund(MTN, 10e18);
        _verify(amara);
        uint256 period = vault.currentPeriod();

        faucet.welcomeTicket(amara);

        assertEq(vault.ticketsOf(amara, period), 1, "1 ticket of odds");
        assertEq(vault.principalOf(amara, period), 0, "no principal claim");
        assertEq(vault.periodInfo(period).jaraPot, MIN, "backing moved to jara pot");
        assertEq(faucet.campaignBalance(MTN), 10e18 - MIN, "campaign debited");
    }

    function test_RevertWelcomeUnverified() public {
        _fund(MTN, 10e18);
        vm.expectRevert(SprayFaucet.NotVerified.selector);
        faucet.welcomeTicket(amara);
    }

    function test_RevertSecondWelcome() public {
        _fund(MTN, 10e18);
        _verify(amara);
        faucet.welcomeTicket(amara);
        vm.expectRevert(SprayFaucet.AlreadyWelcomed.selector);
        faucet.welcomeTicket(amara);
    }

    function test_RevertWelcomeWhenCampaignEmpty() public {
        _verify(amara); // nothing funded at all
        vm.expectRevert(SprayFaucet.InsufficientCampaignBudget.selector);
        faucet.welcomeTicket(amara);
    }
}
