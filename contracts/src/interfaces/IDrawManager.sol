// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IDrawManager
/// @notice Runs Ajora's daily draw: users commit a lucky number (1-9) weighted by their
///         ticket count; a keeper resolves each period with a seed; winners claim a
///         proportional share of the period's jara pot.
/// @dev Claims are pull-based: resolution only fixes the winning number and pot size, and
///      each winner's share is computed at claim time (pot * weight / totalWinningWeight),
///      so resolution never iterates over pickers. When nobody picked the winning number the
///      jara rolls into the next period. Randomness is commit-reveal blended with a future
///      blockhash — see contracts/RANDOMNESS.md for the scheme, threat model, and the
///      five-step public verification recipe. See AJORA_SPEC.md §8.2, §9.
interface IDrawManager {
    event NumberPicked(
        address indexed user, uint256 indexed periodId, uint8 number, uint256 weight
    );
    event SeedCommitted(uint256 indexed periodId, bytes32 commitment, uint256 anchorBlock);
    event SeedRecommitted(uint256 indexed periodId, bytes32 commitment, uint256 anchorBlock);
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

    /// @notice Commit keccak256(abi.encode(secret)) for the *current* period during its final
    ///         COMMIT_WINDOW. Keeper only. Pins anchorBlock = block.number + ANCHOR_DELAY,
    ///         whose hash cannot exist yet — so the final seed is unknowable to the keeper.
    function commitSeed(uint256 periodId, bytes32 commitment) external;

    /// @notice Reveal the secret after the period ends and the anchor block is mined; derives
    ///         seed = keccak256(abi.encode(secret, blockhash(anchorBlock))) and resolves.
    /// @dev Permissionless: the commitment binds the secret, so anyone may relay the reveal.
    function revealAndResolve(uint256 periodId, bytes32 secret) external;

    /// @notice Liveness fallback: start a fresh commit→anchor→reveal cycle when a reveal
    ///         window was missed (anchor hash expired unrevealed). Keeper only. Each use is
    ///         an on-chain event — deliberate misses are publicly countable grinding.
    function recommitSeed(uint256 periodId, bytes32 commitment) external;

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
