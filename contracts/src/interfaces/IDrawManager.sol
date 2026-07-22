// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IDrawManager
/// @notice Runs Ajora's daily draw: users commit a lucky number (1-9) weighted by their
///         ticket count; a keeper resolves each period with a seed; winners claim a
///         proportional share of the period's jara pot.
/// @dev Claims are pull-based: resolution only fixes the winning number and pot size, and
///      each winner's share is computed at claim time (pot * weight / totalWinningWeight),
///      so resolution never iterates over pickers. When nobody picked the winning number the
///      jara rolls into the next period. Randomness is powered by Chainlink VRF.
///      See AJORA_SPEC.md §8.2, §9.
interface IDrawManager {
    event NumberPicked(
        address indexed user, uint256 indexed periodId, uint8 number, uint256 weight
    );
    event DrawRequestSent(uint256 indexed periodId, uint256 requestId);
    event DrawResolved(
        uint256 indexed periodId,
        uint256 seed,
        uint8 winningNumber,
        uint256 pot,
        uint256 totalWinningWeight
    );
    event JaraRecycled(uint256 indexed fromPeriod, uint256 indexed toPeriod, uint256 amount);
    event PrizeClaimed(address indexed user, uint256 indexed periodId, uint256 amount);

    /// @notice Commit a lucky number (1-9) for the current period, weighted by the caller's
    ///         current ticket count. Re-picking before the period ends replaces the previous
    ///         pick (number and weight) — one active pick per user per period.
    function pickNumber(uint8 number) external;

    /// @notice Request randomness from Chainlink VRF for the period. Keeper only.
    function resolveDraw(uint256 periodId) external;

    /// @notice Settle the caller's share of a resolved period's pot into their PotVault
    ///         winnings balance (withdrawable via PotVault.claimWinnings).
    function claimPrize(uint256 periodId) external returns (uint256 amount);

    /// @notice Whether the user holds a winning pick for a resolved period.
    function isWinner(address user, uint256 periodId) external view returns (bool);

    /// @notice The user's committed number and weight for a period (0, 0 when no pick).
    function pickOf(address user, uint256 periodId)
        external
        view
        returns (uint8 number, uint256 weight);
}
