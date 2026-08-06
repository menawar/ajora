// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IPotVault
/// @notice Custodies daily savings, mints draw tickets, and guarantees principal return (no-loss).
/// @dev Prizes (the "jara") are held in a separate jaraPot balance and must NEVER be paid from principal.
interface IPotVault {
    struct Period {
        uint256 id; // period identifier (block.timestamp / 1 days)
        uint256 totalPrincipal; // sum of all contributions — always redeemable
        uint256 jaraPot; // bonus pool (yield + sponsor + rake)
        uint256 totalTickets;
        bool resolved;
        uint256 vrfSeed;
    }

    event Contributed(
        address indexed user, uint256 indexed periodId, uint256 amount, uint256 ticketsMinted
    );
    event PrincipalClaimed(address indexed user, uint256 indexed periodId, uint256 amount);
    event WinningsClaimed(address indexed user, uint256 indexed periodId, uint256 amount);
    /// @notice Emitted when a claim is deferred because the vault is temporarily illiquid.
    event WithdrawalQueued(address indexed user, uint256 indexed periodId, uint256 amount);
    /// @notice Emitted when a queued withdrawal is paid out by the keeper's drainQueue call.
    event QueuedWithdrawalPaid(address indexed user, uint256 amount);
    /// @notice Emitted at the end of drainQueue summarising the batch.
    event QueueDrained(uint256 totalPaid);

    /// @notice Deposit stablecoin into the current period. Mints tickets weighted by streak multiplier.
    function contribute(uint256 amount) external returns (uint256 ticketsMinted);

    /// @notice Withdraw your principal for a period (no-loss guarantee).
    ///         If the vault is temporarily illiquid the claim is queued; call drainQueue (keeper)
    ///         to settle all queued claims once liquidity is restored.
    function claimPrincipal(uint256 periodId) external returns (uint256 amount);

    /// @notice Claim winnings if you won (settled by DrawManager).
    function claimWinnings(uint256 periodId) external returns (uint256 amount);

    function currentPeriod() external view returns (uint256);
    function ticketsOf(address user, uint256 periodId) external view returns (uint256);
    function principalOf(address user, uint256 periodId) external view returns (uint256);
    /// @notice Amount queued but not yet paid for `user` across all periods.
    function pendingWithdrawalOf(address user) external view returns (uint256);
}
