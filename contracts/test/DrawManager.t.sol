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

    /// @dev Seed that resolves to winning number `n` (winning = seed % 9 + 1).
    function _seedFor(uint8 n) internal pure returns (uint256) {
        return uint256(n) - 1;
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
}
