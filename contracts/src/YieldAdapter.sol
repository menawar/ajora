// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "./interfaces/IERC20.sol";
import { IAaveV3Pool } from "./interfaces/IAaveV3Pool.sol";
import { IYieldAdapter } from "./interfaces/IYieldAdapter.sol";
import { PotVault } from "./PotVault.sol";

/// @title YieldAdapter
/// @notice Routes the PotVault's idle principal into an Aave v3 pool and harvests the
///         interest into the jaraPot (AJORA_SPEC.md §8.6). The venue is fixed at deploy —
///         changing venues means deploying a new adapter and moving through the vault's
///         24h timelock, which is the whitelist + timelock the spec asks for.
/// @dev Principal accounting is `totalDeployed`; everything the aToken accrues above it is
///      yield. Yield has exactly one exit: `PotVault.fundJara`. Neither the admin nor the
///      keeper can direct funds anywhere else.
contract YieldAdapter is IYieldAdapter {
    IERC20 public immutable token;
    PotVault public immutable vault;
    IAaveV3Pool public immutable pool;
    IERC20 public immutable aToken;

    address public admin;

    /// @notice Max principal deployable into the venue — limits blast radius while the
    ///         venue earns trust (spec §13 deposit caps).
    uint256 public depositCap;

    /// @inheritdoc IYieldAdapter
    uint256 public totalDeployed;

    error NotVault();
    error NotAdmin();
    error CapExceeded();
    error TransferFailed();
    error VenueShort();
    error StalePeriod();
    error ZeroAddress();

    event DepositCapSet(uint256 cap);

    constructor(IERC20 _token, PotVault _vault, IAaveV3Pool _pool, IERC20 _aToken, uint256 _cap) {
        if (
            address(_token) == address(0) || address(_vault) == address(0)
                || address(_pool) == address(0) || address(_aToken) == address(0)
        ) revert ZeroAddress();
        token = _token;
        vault = _vault;
        pool = _pool;
        aToken = _aToken;
        depositCap = _cap;
        admin = msg.sender;
    }

    modifier onlyVault() {
        if (msg.sender != address(vault)) revert NotVault();
        _;
    }

    /// @notice Adjust the deposit cap. Admin only. Lowering below totalDeployed just stops
    ///         further deposits; it never forces a withdrawal.
    function setDepositCap(uint256 cap) external {
        if (msg.sender != admin) revert NotAdmin();
        depositCap = cap;
        emit DepositCapSet(cap);
    }

    /// @inheritdoc IYieldAdapter
    function deposit(uint256 amount) external onlyVault {
        if (totalDeployed + amount > depositCap) revert CapExceeded();
        totalDeployed += amount;

        // msg.sender == vault (onlyVault), spelled that way so the pull is visibly self-approved
        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        if (!token.approve(address(pool), amount)) revert TransferFailed();
        pool.supply(address(token), amount, address(this), 0);
        emit Deposited(amount);
    }

    /// @inheritdoc IYieldAdapter
    /// @dev Withdraws straight to the vault. Underflow on totalDeployed means the vault asked
    ///      for more principal than was ever deployed — that's a caller bug, so revert.
    function withdraw(uint256 amount) external onlyVault {
        totalDeployed -= amount;
        uint256 got = pool.withdraw(address(token), amount, address(vault));
        if (got != amount) revert VenueShort();
        emit Withdrawn(amount);
    }

    /// @inheritdoc IYieldAdapter
    /// @dev Restricted to the current or a future period: funding a resolved period's pot
    ///      would strand the money (its draw snapshot is already taken).
    function harvest(uint256 periodId) external returns (uint256 yieldAmount) {
        if (periodId < vault.currentPeriod()) revert StalePeriod();

        uint256 balance = aToken.balanceOf(address(this));
        uint256 deployed = totalDeployed;
        if (balance <= deployed) return 0;

        yieldAmount = pool.withdraw(address(token), balance - deployed, address(this));
        if (!token.approve(address(vault), yieldAmount)) revert TransferFailed();
        vault.fundJara(periodId, yieldAmount);
        emit Harvested(yieldAmount, periodId);
    }
}
