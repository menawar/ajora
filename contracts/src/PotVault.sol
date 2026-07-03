// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "./interfaces/IERC20.sol";
import { IPotVault } from "./interfaces/IPotVault.sol";
import { IStreakSBT } from "./interfaces/IStreakSBT.sol";

/// @title PotVault
/// @notice Week-1 core of Ajora: custodies daily savings in a Mento stablecoin, mints draw
///         tickets, and lets users withdraw 100% of their principal (no-loss).
/// @dev Prizes (the "jara") live in a separate `jaraPot` balance per period and are settled by the
///      DrawManager. Principal is tracked independently and can never be used to pay prizes.
///      Tickets are weighted by the caller's streak multiplier (IStreakSBT); sponsor/welcome
///      tickets are credited by the SprayFaucet. Yield routing arrives in a later milestone
///      (see AJORA_SPEC.md §8).
contract PotVault is IPotVault {
    /// @notice The Mento stablecoin this vault accepts (e.g. cUSD / cKES / cCOP).
    IERC20 public immutable token;

    /// @notice Minimum contribution (in token base units). Set at deploy for the token's decimals.
    uint256 public immutable minContribution;

    /// @notice Address allowed to settle winnings (the DrawManager). Set once by admin.
    address public drawManager;

    /// @notice Source of each user's streak-based ticket multiplier (optional; admin-settable).
    IStreakSBT public streakSBT;

    /// @notice Address allowed to credit sponsor/welcome tickets (the SprayFaucet). Set once.
    address public sprayFaucet;

    address public admin;

    /// @dev Ticket multiplier is scaled by 10: 10 = 1.0x, 15 = 1.5x, 30 = 3.0x.
    uint256 internal constant MULTIPLIER_SCALE = 10;

    mapping(uint256 periodId => Period) internal _periods;
    mapping(address user => mapping(uint256 periodId => uint256)) internal _principal;
    mapping(address user => mapping(uint256 periodId => uint256)) internal _tickets;
    mapping(address user => mapping(uint256 periodId => uint256)) internal _winnings;

    error NotAdmin();
    error NotDrawManager();
    error BelowMinimum();
    error TransferFailed();
    error NothingToClaim();
    error AlreadySet();
    error NotSprayFaucet();

    event StreakSBTUpdated(address indexed streakSBT);
    event SprayFaucetSet(address indexed sprayFaucet);
    event TicketsCredited(address indexed user, uint256 indexed periodId, uint256 tickets);

    constructor(IERC20 _token, uint256 _minContribution) {
        token = _token;
        minContribution = _minContribution;
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    /// @notice One-time wiring of the DrawManager that is allowed to settle winnings.
    function setDrawManager(address _drawManager) external onlyAdmin {
        if (drawManager != address(0)) revert AlreadySet();
        drawManager = _drawManager;
    }

    /// @notice Wire (or update) the StreakSBT used to weight ticket minting. Admin only.
    /// @dev Setting address(0) falls back to a flat 1.0x multiplier for everyone.
    function setStreakSBT(IStreakSBT _streakSBT) external onlyAdmin {
        streakSBT = _streakSBT;
        emit StreakSBTUpdated(address(_streakSBT));
    }

    /// @notice One-time wiring of the SprayFaucet allowed to credit sponsor/welcome tickets.
    function setSprayFaucet(address _sprayFaucet) external onlyAdmin {
        if (sprayFaucet != address(0)) revert AlreadySet();
        sprayFaucet = _sprayFaucet;
        emit SprayFaucetSet(_sprayFaucet);
    }

    /// @inheritdoc IPotVault
    function currentPeriod() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /// @inheritdoc IPotVault
    function contribute(uint256 amount) external returns (uint256 ticketsMinted) {
        if (amount < minContribution) revert BelowMinimum();

        uint256 periodId = currentPeriod();

        // Pull funds. Checks-effects-interactions: state is updated before any external call below.
        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();

        // 1 ticket per `minContribution`, scaled by the caller's streak multiplier.
        uint256 baseTickets = amount / minContribution;
        ticketsMinted = baseTickets * _multiplierX10(msg.sender) / MULTIPLIER_SCALE;

        Period storage p = _periods[periodId];
        p.id = periodId;
        p.totalPrincipal += amount;
        p.totalTickets += ticketsMinted;

        _principal[msg.sender][periodId] += amount;
        _tickets[msg.sender][periodId] += ticketsMinted;

        emit Contributed(msg.sender, periodId, amount, ticketsMinted);
    }

    /// @inheritdoc IPotVault
    /// @dev No-loss guarantee: a user can always reclaim exactly what they contributed.
    function claimPrincipal(uint256 periodId) external returns (uint256 amount) {
        amount = _principal[msg.sender][periodId];
        if (amount == 0) revert NothingToClaim();

        _principal[msg.sender][periodId] = 0;
        _periods[periodId].totalPrincipal -= amount;

        if (!token.transfer(msg.sender, amount)) revert TransferFailed();
        emit PrincipalClaimed(msg.sender, periodId, amount);
    }

    /// @inheritdoc IPotVault
    function claimWinnings(uint256 periodId) external returns (uint256 amount) {
        amount = _winnings[msg.sender][periodId];
        if (amount == 0) revert NothingToClaim();

        _winnings[msg.sender][periodId] = 0;

        if (!token.transfer(msg.sender, amount)) revert TransferFailed();
        emit WinningsClaimed(msg.sender, periodId, amount);
    }

    /// @notice Credit a user's winnings from the period's jaraPot. Called by the DrawManager only.
    /// @dev Invariant: winnings are drawn from `jaraPot`, never from `totalPrincipal`.
    function settleWinnings(address user, uint256 periodId, uint256 amount) external {
        if (msg.sender != drawManager) revert NotDrawManager();
        Period storage p = _periods[periodId];
        require(amount <= p.jaraPot, "exceeds jara pot");
        p.jaraPot -= amount;
        _winnings[user][periodId] += amount;
    }

    /// @notice Fund a period's jaraPot (from sponsors / yield / rake). Pulls stablecoin from caller.
    function fundJara(uint256 periodId, uint256 amount) external {
        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        _periods[periodId].jaraPot += amount;
    }

    /// @notice Credit sponsor/welcome tickets to a user with no principal. SprayFaucet only.
    /// @dev These tickets carry draw odds but never create a principal claim, so no-loss is unaffected.
    function creditTickets(address user, uint256 periodId, uint256 tickets) external {
        if (msg.sender != sprayFaucet) revert NotSprayFaucet();
        Period storage p = _periods[periodId];
        p.id = periodId;
        p.totalTickets += tickets;
        _tickets[user][periodId] += tickets;
        emit TicketsCredited(user, periodId, tickets);
    }

    // -------------------------------------------------------------- internal

    /// @dev Caller's ticket multiplier (scaled by 10), clamped to >= 1.0x so it can only help.
    function _multiplierX10(address user) internal view returns (uint256) {
        if (address(streakSBT) == address(0)) return MULTIPLIER_SCALE;
        uint256 m = streakSBT.multiplierOf(user);
        return m < MULTIPLIER_SCALE ? MULTIPLIER_SCALE : m;
    }

    // ----------------------------------------------------------------- views

    function ticketsOf(address user, uint256 periodId) external view returns (uint256) {
        return _tickets[user][periodId];
    }

    function principalOf(address user, uint256 periodId) external view returns (uint256) {
        return _principal[user][periodId];
    }

    function periodInfo(uint256 periodId) external view returns (Period memory) {
        return _periods[periodId];
    }
}
