// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "./interfaces/IERC20.sol";
import { ITreasury } from "./interfaces/ITreasury.sol";
import { PotVault } from "./PotVault.sol";
import { DrawManager } from "./DrawManager.sol";

/// @title Treasury
/// @notice Protocol sink hub (AJORA_SPEC.md §8.7): collects rake from paid Big Pots, routes
///         protocol funds into the jaraPot, and triggers the unclaimed-prize recycle.
/// @dev Rake sits here until the admin either funds prizes with it (fundJara) or withdraws
///      protocol fees (withdrawFees). Both moves are evented for the transparency dashboard.
contract Treasury is ITreasury {
    IERC20 public immutable token;
    PotVault public immutable vault;
    DrawManager public immutable drawManager;

    address public admin;

    /// @notice Lifetime rake collected, for the §6 "prizes come from real revenue" ledger.
    uint256 public totalRake;

    mapping(uint256 periodId => uint256) public rakeOf;

    error NotAdmin();
    error TransferFailed();
    error ZeroAddress();

    constructor(IERC20 _token, PotVault _vault, DrawManager _drawManager) {
        if (
            address(_token) == address(0) || address(_vault) == address(0)
                || address(_drawManager) == address(0)
        ) revert ZeroAddress();
        token = _token;
        vault = _vault;
        drawManager = _drawManager;
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    /// @inheritdoc ITreasury
    /// @dev Callable by anyone holding tokens — paid Big Pot contracts in practice.
    function collectRake(uint256 amount, uint256 periodId) external {
        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        rakeOf[periodId] += amount;
        totalRake += amount;
        emit RakeCollected(amount, periodId);
    }

    /// @inheritdoc ITreasury
    /// @dev Thin passthrough: DrawManager.recycleUnclaimed is already permissionless after
    ///      the claim window; this keeps the spec's Treasury surface for the sweep keeper.
    function sweepUnclaimed(uint256 periodId) external returns (uint256 amount) {
        return drawManager.recycleUnclaimed(periodId);
    }

    /// @notice Route treasury funds into a period's prize pot. Admin only.
    function fundJara(uint256 periodId, uint256 amount) external onlyAdmin {
        if (!token.approve(address(vault), amount)) revert TransferFailed();
        vault.fundJara(periodId, amount);
        emit JaraFunded(amount, periodId);
    }

    /// @notice Withdraw protocol fees. Admin only.
    function withdrawFees(address to, uint256 amount) external onlyAdmin {
        if (to == address(0)) revert ZeroAddress();
        if (!token.transfer(to, amount)) revert TransferFailed();
        emit FeeWithdrawn(to, amount);
    }
}
