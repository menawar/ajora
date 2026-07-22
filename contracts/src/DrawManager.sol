// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IDrawManager } from "./interfaces/IDrawManager.sol";
import { PotVault } from "./PotVault.sol";
import { VRFConsumerBaseV2 } from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import { VRFCoordinatorV2Interface } from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

/// @title DrawManager
/// @notice Daily lucky-number draw over PotVault tickets. Picks are weighted by the
///         picker's ticket count; winners split the period's jara pot pro rata at claim
///         time; unwon pots roll forward. See AJORA_SPEC.md §8.2.
/// @dev Prize money only ever moves via PotVault.settleWinnings, which is capped by the
///      period's jaraPot — principal is structurally out of reach of this contract.
contract DrawManager is IDrawManager, VRFConsumerBaseV2 {
    struct Pick {
        uint8 number; // 1-9; 0 = no pick
        uint248 weight; // ticket count snapshotted at pick time
    }

    struct Draw {
        bool resolved;
        uint8 winningNumber;
        uint64 resolvedAt; // claim window anchor — late resolutions still get a full window
        uint256 seed;
        uint256 pot; // jaraPot snapshotted at resolution
        uint256 totalWinningWeight; // sum of weights on the winning number
    }

    PotVault public immutable vault;

    address public admin;

    /// @notice Address allowed to resolve draws (the keeper service).
    address public keeper;

    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint32 public constant CALLBACK_GAS_LIMIT = 500000;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1;

    mapping(address user => mapping(uint256 periodId => Pick)) internal _picks;
    mapping(uint256 periodId => mapping(uint8 number => uint256)) public weightOnNumber;
    mapping(uint256 periodId => Draw) internal _draws;
    mapping(address user => mapping(uint256 periodId => bool)) public claimed;
    mapping(uint256 requestId => uint256 periodId) public requestToPeriod;

    /// @notice How long winners have to claim after resolution before the remainder is
    ///         recycled into the current pot (spec §6 sink).
    uint256 public constant CLAIM_WINDOW = 7 days;

    error NotAdmin();
    error NotKeeper();
    error InvalidNumber();
    error NoTickets();
    error PeriodNotOver();
    error AlreadyResolved();
    error NotResolved();
    error NotAWinner();
    error AlreadyClaimed();
    error CommitWindowClosed();
    error AlreadyCommitted();
    error NoCommit();
    error BadReveal();
    error AnchorNotReady();
    error AnchorExpired();
    error AnchorStillLive();
    error ZeroAddress();
    error ClaimWindowClosed();
    error WindowStillOpen();
    error NothingToRecycle();

    constructor(
        PotVault _vault, 
        address _keeper, 
        address _vrfCoordinator, 
        uint64 _subscriptionId, 
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        if (_keeper == address(0) || _vrfCoordinator == address(0)) revert ZeroAddress();
        vault = _vault;
        admin = msg.sender;
        keeper = _keeper;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    /// @notice Rotate the keeper address. Admin only.
    function setKeeper(address _keeper) external onlyAdmin {
        if (_keeper == address(0)) revert ZeroAddress();
        keeper = _keeper;
    }

    // ----------------------------------------------------------------- picks

    /// @inheritdoc IDrawManager
    /// @dev Weight snapshots the caller's *current* tickets, so the natural flow is
    ///      save -> pick. Re-picking after a top-up refreshes the weight (and may move
    ///      the number); the previous pick's weight is backed out first.
    function pickNumber(uint8 number) external {
        if (number < 1 || number > 9) revert InvalidNumber();

        uint256 periodId = vault.currentPeriod();
        uint256 tickets = vault.ticketsOf(msg.sender, periodId);
        if (tickets == 0) revert NoTickets();

        Pick storage p = _picks[msg.sender][periodId];
        if (p.number != 0) {
            // Replace the active pick: remove old weight from its bucket.
            weightOnNumber[periodId][p.number] -= p.weight;
        }
        p.number = number;
        p.weight = uint248(tickets);
        weightOnNumber[periodId][number] += tickets;

        emit NumberPicked(msg.sender, periodId, number, tickets);
    }

    // ----------------------------------------------------------------- views

    /// @inheritdoc IDrawManager
    function pickOf(address user, uint256 periodId)
        external
        view
        returns (uint8 number, uint256 weight)
    {
        Pick storage p = _picks[user][periodId];
        return (p.number, p.weight);
    }

    /// @notice Resolution state of a period's draw.
    function drawOf(uint256 periodId) external view returns (Draw memory) {
        return _draws[periodId];
    }

    /// @inheritdoc IDrawManager
    function isWinner(address user, uint256 periodId) public view returns (bool) {
        Draw storage d = _draws[periodId];
        if (!d.resolved || d.totalWinningWeight == 0) return false;
        return _picks[user][periodId].number == d.winningNumber;
    }

    // ------------------------------------------------------------ resolution

    /// @inheritdoc IDrawManager
    function resolveDraw(uint256 periodId) external {
        if (msg.sender != keeper) revert NotKeeper();
        if (periodId >= vault.currentPeriod()) revert PeriodNotOver();
        if (_draws[periodId].resolved) revert AlreadyResolved();

        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );
        requestToPeriod[requestId] = periodId;
        emit DrawRequestSent(periodId, requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 periodId = requestToPeriod[requestId];
        if (_draws[periodId].resolved) return;

        _resolve(periodId, randomWords[0]);
    }

    /// @dev Shared resolution: derive the number, snapshot the pot, recycle when unwon.
    function _resolve(uint256 periodId, uint256 seed) internal {
        if (periodId >= vault.currentPeriod()) revert PeriodNotOver();
        Draw storage d = _draws[periodId];
        if (d.resolved) revert AlreadyResolved();

        uint8 winningNumber = uint8(seed % 9) + 1;
        uint256 pot = vault.periodInfo(periodId).jaraPot;
        uint256 totalWinningWeight = weightOnNumber[periodId][winningNumber];

        d.resolved = true;
        d.seed = seed;
        d.winningNumber = winningNumber;
        d.resolvedAt = uint64(block.timestamp);
        d.totalWinningWeight = totalWinningWeight;

        if (totalWinningWeight == 0) {
            // Nobody hit the number: the whole pot rolls into the current period.
            if (pot > 0) {
                uint256 toPeriod = vault.currentPeriod();
                vault.rollJara(periodId, toPeriod, pot);
                emit JaraRecycled(periodId, toPeriod, pot);
            }
            // pot stays 0 in the draw record; nothing is claimable.
        } else {
            d.pot = pot;
        }

        emit DrawResolved(periodId, seed, winningNumber, d.pot, totalWinningWeight);
    }

    // ---------------------------------------------------------------- claims

    /// @inheritdoc IDrawManager
    function claimPrize(uint256 periodId) external returns (uint256 amount) {
        Draw storage d = _draws[periodId];
        if (!d.resolved) revert NotResolved();
        if (block.timestamp > uint256(d.resolvedAt) + CLAIM_WINDOW) revert ClaimWindowClosed();
        if (!isWinner(msg.sender, periodId)) revert NotAWinner();
        if (claimed[msg.sender][periodId]) revert AlreadyClaimed();
        claimed[msg.sender][periodId] = true;

        Pick storage p = _picks[msg.sender][periodId];
        amount = d.pot * p.weight / d.totalWinningWeight;

        // Settlement is capped by the vault at the period's jaraPot; the sum of all
        // pro-rata shares never exceeds the snapshotted pot (rounding dust stays behind).
        vault.settleWinnings(msg.sender, periodId, amount);
        emit PrizeClaimed(msg.sender, periodId, amount);
    }

    /// @notice Recycle whatever is left of a resolved period's pot — unclaimed prizes plus
    ///         pro-rata rounding dust — into the current period. Permissionless once the
    ///         claim window has passed (the Treasury sweep keeper calls it in practice).
    /// @dev Settled winnings are untouchable here: settleWinnings already moved them out of
    ///      the period's jaraPot into per-user credits, which never expire.
    function recycleUnclaimed(uint256 periodId) external returns (uint256 amount) {
        Draw storage d = _draws[periodId];
        if (!d.resolved) revert NotResolved();
        if (block.timestamp <= uint256(d.resolvedAt) + CLAIM_WINDOW) revert WindowStillOpen();

        amount = vault.periodInfo(periodId).jaraPot;
        if (amount == 0) revert NothingToRecycle();

        uint256 toPeriod = vault.currentPeriod();
        vault.rollJara(periodId, toPeriod, amount);
        emit JaraRecycled(periodId, toPeriod, amount);
    }
}
