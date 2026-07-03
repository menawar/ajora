// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "./interfaces/IERC20.sol";
import { IPotVault } from "./interfaces/IPotVault.sol";

/// @title PotVault
/// @notice Week-1 core of Ajora: custodies daily savings in a Mento stablecoin, mints draw
///         tickets, and lets users withdraw 100% of their principal (no-loss).
/// @dev Prizes (the "jara") live in a separate `jaraPot` balance per period and are settled by the
///      DrawManager. Principal is tracked independently and can never be used to pay prizes.
///      This is an intentionally minimal skeleton; DrawManager / streak multiplier / yield routing
///      are wired in later milestones (see AJORA_SPEC.md §8).
contract PotVault is IPotVault {
    /// @notice The Mento stablecoin this vault accepts (e.g. cUSD / cKES / cCOP).
    IERC20 public immutable token;

    /// @notice Minimum contribution (in token base units). Set at deploy for the token's decimals.
    uint256 public immutable minContribution;

    /// @notice Address allowed to settle winnings (the DrawManager). Set once by admin.
    address public drawManager;

    address public admin;

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

        // 1 ticket per `minContribution` deposited. Streak multiplier is applied in a later milestone.
        ticketsMinted = amount / minContribution;

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
