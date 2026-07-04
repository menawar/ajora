// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { CrewRegistry } from "../src/CrewRegistry.sol";
import { SprayFaucet } from "../src/SprayFaucet.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { ICrewRegistry } from "../src/interfaces/ICrewRegistry.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract CrewRegistryTest is Test {
    PotVault internal vault;
    CrewRegistry internal registry;
    SprayFaucet internal faucet;
    MockERC20 internal cusd;

    address internal verifier = address(0xFEED);
    address internal sponsor = address(0x5075);
    address internal amara = address(0xA3a); // crew founder
    address internal kevin = address(0xE1); // joins via amara
    address internal kwame = address(0xA33); // joins via kevin

    uint256 internal constant MIN = 0.1e18;
    uint256 internal constant DAY = 1 days;

    bytes32 internal constant AMARA_CODE = "amara-1";
    bytes32 internal constant KEVIN_CODE = "kevin-1";
    bytes32 internal constant KWAME_CODE = "kwame-1";

    function setUp() public {
        vm.warp(20_000 * DAY + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        faucet = new SprayFaucet(vault, verifier);
        registry = new CrewRegistry();

        vault.setSprayFaucet(address(faucet));
        vault.setCrewRegistry(ICrewRegistry(address(registry)));
        registry.setVault(address(vault));
        registry.setFaucet(faucet);
        faucet.setCrewRegistry(address(registry));

        for (uint256 i = 0; i < 3; i++) {
            address u = [amara, kevin, kwame][i];
            cusd.mint(u, 100e18);
        }
        cusd.mint(sponsor, 100e18);
        vm.startPrank(sponsor);
        cusd.approve(address(faucet), 100e18);
        faucet.fundSponsorPool(10e18, "launch");
        vm.stopPrank();
    }

    function _save(address who, uint256 amount) internal {
        vm.startPrank(who);
        cusd.approve(address(vault), amount);
        vault.contribute(amount);
        vm.stopPrank();
    }

    // ------------------------------------------------------------ formation

    function test_CreateAndJoinRecordsAttribution() public {
        vm.prank(amara);
        uint256 crewId = registry.createCrew(AMARA_CODE);

        vm.prank(kevin);
        assertEq(registry.joinCrew(AMARA_CODE, KEVIN_CODE), crewId);

        // Kwame joins via KEVIN's code: same crew, but Kevin is his referrer.
        vm.prank(kwame);
        assertEq(registry.joinCrew(KEVIN_CODE, KWAME_CODE), crewId);

        assertEq(registry.crewOf(kwame), crewId);
        assertEq(registry.referrerOf(kevin), amara);
        assertEq(registry.referrerOf(kwame), kevin);
        assertEq(registry.memberCount(crewId), 3);
    }

    function test_GuardsSelfReferralDuplicatesAndUnknownCodes() public {
        vm.prank(amara);
        registry.createCrew(AMARA_CODE);

        vm.prank(amara); // own code
        vm.expectRevert(CrewRegistry.SelfReferral.selector);
        registry.joinCrew(AMARA_CODE, "x");

        vm.prank(kevin); // unknown inviter
        vm.expectRevert(CrewRegistry.UnknownCode.selector);
        registry.joinCrew("nope", KEVIN_CODE);

        vm.prank(kevin); // code collision
        vm.expectRevert(CrewRegistry.CodeTaken.selector);
        registry.joinCrew(AMARA_CODE, AMARA_CODE);

        vm.prank(kevin);
        registry.joinCrew(AMARA_CODE, KEVIN_CODE);
        vm.prank(kevin); // already in a crew
        vm.expectRevert(CrewRegistry.AlreadyInCrew.selector);
        registry.joinCrew(AMARA_CODE, "kevin-2");
    }

    // ----------------------------------------------------------- aggregation

    function test_CrewSavingsAggregateViaVaultHook() public {
        vm.prank(amara);
        uint256 crewId = registry.createCrew(AMARA_CODE);
        vm.prank(kevin);
        registry.joinCrew(AMARA_CODE, KEVIN_CODE);

        uint256 period = vault.currentPeriod();
        _save(amara, 1e18);
        _save(kevin, 2e18);
        _save(kwame, 5e18); // crewless: counted for vesting, not for any crew

        assertEq(registry.crewSavings(crewId, period), 3e18, "crew total");
        assertEq(registry.savedDayCount(kwame), 1, "crewless saver still counted");
    }

    function test_SavedDayCountIsDistinctDays() public {
        _save(amara, 1e18);
        _save(amara, 1e18); // same day twice
        assertEq(registry.savedDayCount(amara), 1);

        vm.warp(block.timestamp + DAY);
        _save(amara, 1e18);
        assertEq(registry.savedDayCount(amara), 2);
    }

    // -------------------------------------------------------------- vesting

    function test_VestingGateThreeSelfFundedDays() public {
        vm.prank(amara);
        registry.createCrew(AMARA_CODE);
        vm.prank(verifier);
        faucet.setVerified(amara, true);
        vm.prank(kevin);
        registry.joinCrew(AMARA_CODE, KEVIN_CODE);

        // Days 1 and 2: not enough.
        _save(kevin, 1e18);
        vm.warp(block.timestamp + DAY);
        _save(kevin, 1e18);
        vm.expectRevert(CrewRegistry.NotEnoughSaveDays.selector);
        registry.vestReferral(kevin);

        // Day 3: vests permissionlessly; Amara gets a sponsor-backed bonus ticket.
        vm.warp(block.timestamp + DAY);
        _save(kevin, 1e18);
        uint256 period = vault.currentPeriod();
        registry.vestReferral(kevin);

        assertTrue(registry.referralVested(kevin));
        assertEq(vault.ticketsOf(amara, period), 1, "referrer bonus ticket");
        assertEq(vault.periodInfo(period).jaraPot, MIN, "bonus fully backed");

        vm.expectRevert(CrewRegistry.AlreadyVested.selector);
        registry.vestReferral(kevin);
    }

    function test_VestingSurvivesUnverifiedReferrer() public {
        // Amara never verified: bonus is skipped, the vesting record still lands.
        vm.prank(amara);
        registry.createCrew(AMARA_CODE);
        vm.prank(kevin);
        registry.joinCrew(AMARA_CODE, KEVIN_CODE);

        for (uint256 i = 0; i < 3; i++) {
            _save(kevin, 1e18);
            vm.warp(block.timestamp + DAY);
        }
        registry.vestReferral(kevin);
        assertTrue(registry.referralVested(kevin));
        assertEq(vault.ticketsOf(amara, vault.currentPeriod()), 0, "no bonus without verification");
    }

    function test_RevertVestNoReferrer() public {
        vm.expectRevert(CrewRegistry.NoReferrer.selector);
        registry.vestReferral(kwame);
    }
}
