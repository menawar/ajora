// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { PotVault } from "../src/PotVault.sol";
import { YieldAdapter } from "../src/YieldAdapter.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IAaveV3Pool } from "../src/interfaces/IAaveV3Pool.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockAaveV3Pool } from "./mocks/MockAaveV3Pool.sol";



import { Treasury }
from "../src/Treasury.sol";
import { MockTreasury } from "./mocks/MockTreasury.sol";
import { MockPoolAddressesProvider } from "./mocks/MockPoolAddressesProvider.sol";
contract YieldAdapterTest is Test {
    MockPoolAddressesProvider internal provider;
    Treasury internal treasury;

    PotVault internal vault;
    MockERC20 internal cusd;
    MockAaveV3Pool internal pool;
    YieldAdapter internal adapter;

    address internal rando = address(0xBEEF);

    uint256 internal constant MIN = 0.1e18;
    uint256 internal constant CAP = 1_000e18;

    function setUp() public {
        vm.warp(20_000 days + 12 hours);
        cusd = new MockERC20("Celo Dollar", "cUSD", 18);
        vault = new PotVault(IERC20(address(cusd)), MIN);
        pool = new MockAaveV3Pool(cusd);
        provider = new MockPoolAddressesProvider(address(pool));
        
        // Mock Treasury for testing (it needs vault but we can pass vault directly)
        // Wait, treasury needs draw. Just mock treasury or instantiate it properly.
        // Or we can just use address(0) for treasury in YieldAdapterTest since it only takes fees?
        // Actually treasury needs draw. So we just pass address(0) or deploy a mock.
        // Let's deploy a fake treasury for this test since YieldAdapter only calls collectYieldFee.
        // Wait, we can't deploy Treasury without DrawManager.
        // I'll just deploy a DrawManager too.
        treasury = Treasury(address(new MockTreasury()));

        adapter = new YieldAdapter(
            IERC20(address(cusd)),
            vault,
            provider,
            IERC20(address(pool.aToken())),
            treasury,
            CAP
        );

        // Simulate vault balance + approval the way PotVault.deployIdle would.
        cusd.mint(address(vault), 500e18);
    }

    function _vaultDeposit(uint256 amount) internal {
        vm.startPrank(address(vault));
        cusd.approve(address(adapter), amount);
        adapter.deposit(amount);
        vm.stopPrank();
    }

    function test_DepositSuppliesVenueAndTracksPrincipal() public {
        _vaultDeposit(100e18);

        assertEq(adapter.totalDeployed(), 100e18);
        assertEq(pool.aToken().balanceOf(address(adapter)), 100e18);
        assertEq(cusd.balanceOf(address(pool)), 100e18);
        assertEq(cusd.balanceOf(address(adapter)), 0, "adapter never holds idle funds");
    }

    function test_RevertWhenDepositNotVault() public {
        vm.prank(rando);
        vm.expectRevert(YieldAdapter.NotVault.selector);
        adapter.deposit(1e18);
    }

    function test_RevertWhenDepositExceedsCap() public {
        vm.prank(address(adapter.admin()));
        adapter.setDepositCap(50e18);

        vm.startPrank(address(vault));
        cusd.approve(address(adapter), 60e18);
        vm.expectRevert(YieldAdapter.CapExceeded.selector);
        adapter.deposit(60e18);
        vm.stopPrank();
    }

    function test_CapAppliesToRunningTotal() public {
        vm.prank(adapter.admin());
        adapter.setDepositCap(450e18);
        _vaultDeposit(400e18);

        vm.startPrank(address(vault));
        cusd.approve(address(adapter), 100e18);
        vm.expectRevert(YieldAdapter.CapExceeded.selector);
        adapter.deposit(100e18); // 400 already deployed; 500 total would breach 450
        vm.stopPrank();
    }

    function test_RevertWhenSetDepositCapNotAdmin() public {
        vm.prank(rando);
        vm.expectRevert(YieldAdapter.NotAdmin.selector);
        adapter.setDepositCap(1);
    }

    function test_WithdrawReturnsPrincipalToVault() public {
        _vaultDeposit(100e18);
        uint256 vaultBefore = cusd.balanceOf(address(vault));

        vm.prank(address(vault));
        adapter.withdraw(40e18);

        assertEq(adapter.totalDeployed(), 60e18);
        assertEq(cusd.balanceOf(address(vault)), vaultBefore + 40e18);
    }

    function test_RevertWhenWithdrawNotVault() public {
        _vaultDeposit(100e18);
        vm.prank(rando);
        vm.expectRevert(YieldAdapter.NotVault.selector);
        adapter.withdraw(1e18);
    }

    function test_RevertWhenWithdrawMoreThanDeployed() public {
        _vaultDeposit(100e18);
        vm.prank(address(vault));
        vm.expectRevert(); // totalDeployed underflow
        adapter.withdraw(101e18);
    }

    function test_HarvestFundsJaraForCurrentPeriod() public {
        _vaultDeposit(100e18);
        pool.accrue(address(adapter), 3e18);

        uint256 periodId = vault.currentPeriod();
        vm.prank(rando); // permissionless
        uint256 got = adapter.harvest(periodId);

        assertEq(got, 2.7e18);
        assertEq(vault.periodInfo(periodId).jaraPot, 2.7e18, "yield lands in the prize pot");
        assertEq(treasury.totalYieldFees(), 0.3e18, "treasury gets rake");
        assertEq(adapter.totalDeployed(), 100e18, "principal untouched");
        assertEq(pool.aToken().balanceOf(address(adapter)), 100e18);
    }

    function test_HarvestWithoutYieldIsNoop() public {
        _vaultDeposit(100e18);
        uint256 got = adapter.harvest(vault.currentPeriod());
        assertEq(got, 0);
        assertEq(vault.periodInfo(vault.currentPeriod()).jaraPot, 0);
    }

    function test_RevertWhenHarvestIntoResolvedPastPeriod() public {
        _vaultDeposit(100e18);
        pool.accrue(address(adapter), 1e18);
        uint256 past = vault.currentPeriod() - 1;
        vm.expectRevert(YieldAdapter.StalePeriod.selector);
        adapter.harvest(past);
    }

    function test_HarvestIntoFuturePeriodAllowed() public {
        _vaultDeposit(100e18);
        pool.accrue(address(adapter), 1e18);
        uint256 future = vault.currentPeriod() + 1;
        adapter.harvest(future);
        assertEq(vault.periodInfo(future).jaraPot, 0.9e18);
    }
}
