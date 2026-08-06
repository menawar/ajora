// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IYieldAdapter
/// @notice Routes idle pooled principal to an audited Celo lending venue and harvests the
///         yield into the PotVault's jaraPot (AJORA_SPEC.md §8.6).
/// @dev deposit/withdraw are vault-only: the vault decides how much principal is idle
///      behind its liquidity buffer. harvest is permissionless — yield can only ever flow
///      into the prize pot, so there is nothing for a caller to steal.
interface IYieldAdapter {
    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event Harvested(uint256 yieldAmount, uint256 indexed periodId);
    /// @notice Emitted when the venue cannot fulfill the full requested recall.
    ///         `actual` is the amount that was actually returned to the vault (may be 0).
    event PartialWithdrawal(uint256 requested, uint256 actual);

    /// @notice Deploy vault principal into the venue. Vault only.
    function deposit(uint256 amount) external;

    /// @notice Recall principal from the venue back to the vault. Vault only.
    /// @return actual The amount actually recalled; may be less than `amount` if the
    ///         venue is temporarily illiquid. The vault handles the shortfall upstream.
    function withdraw(uint256 amount) external returns (uint256 actual);

    /// @notice Send accrued yield (venue balance above deployed principal) to the vault's
    ///         jaraPot for `periodId`. Callable by anyone (keeper in practice).
    function harvest(uint256 periodId) external returns (uint256 yieldAmount);

    /// @notice Principal currently deployed into the venue (excludes accrued yield).
    function totalDeployed() external view returns (uint256);
}
