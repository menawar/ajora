// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "./interfaces/IERC20.sol";
import { IPotVault } from "./interfaces/IPotVault.sol";
import { IStreakSBT } from "./interfaces/IStreakSBT.sol";
import { ICrewRegistry } from "./interfaces/ICrewRegistry.sol";
import { IYieldAdapter } from "./interfaces/IYieldAdapter.sol";

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

    /// @notice Observer notified of contributions for crew aggregation (optional, updatable).
    ICrewRegistry public crewRegistry;

    /// @notice Routes idle principal to the yield venue (AJORA_SPEC.md §8.6). Optional.
    IYieldAdapter public yieldAdapter;

    /// @notice Adapter change staged behind the timelock (address(0) proposals detach yield).
    IYieldAdapter public pendingYieldAdapter;

    /// @notice Earliest timestamp the pending adapter can be applied; 0 = nothing proposed.
    uint256 public yieldAdapterEta;

    /// @notice Share of total assets (bps) that must stay liquid in-vault after deployIdle.
    uint256 public liquidityBufferBps = 2_000;

    /// @notice Delay between proposing and applying a yield adapter — users can exit first.
    uint256 public constant ADAPTER_TIMELOCK = 24 hours;

    /// @notice When the circuit breaker tripped; 0 = not paused. Pause blocks money-in
    ///         (contribute, deployIdle) only — claims always work, that's the no-loss deal.
    uint256 public pausedAt;

    /// @notice Cool-down before unpause (spec §13): after an incident pause, users get a
    ///         full day of notice before deposits resume.
    uint256 public constant UNPAUSE_TIMELOCK = 24 hours;

    /// @notice Max principal per user per period; 0 = uncapped (spec §13 month-1 caps).
    uint256 public userPeriodCap;

    /// @notice Max total outstanding principal across all periods; 0 = uncapped.
    uint256 public maxTotalPrincipal;

    /// @notice Running sum of unredeemed principal, for the TVL cap.
    uint256 public totalPrincipalOutstanding;

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
    error PeriodStillOpen();
    error ZeroAddress();
    error NothingProposed();
    error TimelockPending();
    error AdapterNotDrained();
    error BufferBreached();
    error InvalidBps();
    error NoAdapter();
    error IsPaused();
    error NotPaused();
    error UnpauseTimelocked();
    error UserCapExceeded();
    error TvlCapExceeded();

    event StreakSBTUpdated(address indexed streakSBT);
    event SprayFaucetSet(address indexed sprayFaucet);
    event CrewRegistryUpdated(address indexed crewRegistry);
    event TicketsCredited(address indexed user, uint256 indexed periodId, uint256 tickets);
    event YieldAdapterProposed(address indexed adapter, uint256 eta);
    event YieldAdapterSet(address indexed adapter);
    event LiquidityBufferSet(uint256 bps);
    event PrincipalDeployed(uint256 amount);
    event PrincipalRecalled(uint256 amount);
    event CircuitBreaker(bool active);
    event DepositCapsSet(uint256 userPeriodCap, uint256 maxTotalPrincipal);

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
        if (_drawManager == address(0)) revert ZeroAddress(); // set-once: zero would brick
        if (drawManager != address(0)) revert AlreadySet();
        drawManager = _drawManager;
    }

    /// @notice Wire (or update) the StreakSBT used to weight ticket minting. Admin only.
    /// @dev Setting address(0) falls back to a flat 1.0x multiplier for everyone.
    function setStreakSBT(IStreakSBT _streakSBT) external onlyAdmin {
        streakSBT = _streakSBT;
        emit StreakSBTUpdated(address(_streakSBT));
    }

    /// @notice Wire (or update) the crew registry observer. A faulty registry can never
    ///         brick savings — the hook is fire-and-forget (try/catch).
    function setCrewRegistry(ICrewRegistry _crewRegistry) external onlyAdmin {
        crewRegistry = _crewRegistry;
        emit CrewRegistryUpdated(address(_crewRegistry));
    }

    /// @notice One-time wiring of the SprayFaucet allowed to credit sponsor/welcome tickets.
    function setSprayFaucet(address _sprayFaucet) external onlyAdmin {
        if (_sprayFaucet == address(0)) revert ZeroAddress(); // set-once: zero would brick
        if (sprayFaucet != address(0)) revert AlreadySet();
        sprayFaucet = _sprayFaucet;
        emit SprayFaucetSet(_sprayFaucet);
    }

    // --------------------------------------------------------- circuit breaker

    /// @notice Trip the circuit breaker: deposits and yield deployment stop immediately.
    ///         Claims are deliberately exempt — pausing can never trap user money.
    function pause() external onlyAdmin {
        pausedAt = block.timestamp;
        emit CircuitBreaker(true);
    }

    /// @notice Lift the breaker after the 24h cool-down (spec §13: timelock on unpause),
    ///         so users see the all-clear coming before deposits resume.
    function unpause() external onlyAdmin {
        if (pausedAt == 0) revert NotPaused();
        if (block.timestamp < pausedAt + UNPAUSE_TIMELOCK) revert UnpauseTimelocked();
        pausedAt = 0;
        emit CircuitBreaker(false);
    }

    /// @notice Month-1 blast-radius caps (spec §13). 0 disables a cap.
    function setDepositCaps(uint256 _userPeriodCap, uint256 _maxTotalPrincipal) external onlyAdmin {
        userPeriodCap = _userPeriodCap;
        maxTotalPrincipal = _maxTotalPrincipal;
        emit DepositCapsSet(_userPeriodCap, _maxTotalPrincipal);
    }

    // ---------------------------------------------------------- yield routing

    /// @notice Stage a yield adapter change behind the 24h timelock. Proposing address(0)
    ///         detaches yield routing entirely. Admin only.
    function proposeYieldAdapter(IYieldAdapter adapter) external onlyAdmin {
        pendingYieldAdapter = adapter;
        yieldAdapterEta = block.timestamp + ADAPTER_TIMELOCK;
        emit YieldAdapterProposed(address(adapter), yieldAdapterEta);
    }

    /// @notice Apply the staged adapter once the timelock elapses. The outgoing adapter must
    ///         be fully drained first (recallDeployed), so principal can never be stranded
    ///         behind a venue the vault no longer talks to.
    function applyYieldAdapter() external onlyAdmin {
        if (yieldAdapterEta == 0) revert NothingProposed();
        if (block.timestamp < yieldAdapterEta) revert TimelockPending();
        if (address(yieldAdapter) != address(0) && yieldAdapter.totalDeployed() != 0) {
            revert AdapterNotDrained();
        }
        yieldAdapter = pendingYieldAdapter;
        pendingYieldAdapter = IYieldAdapter(address(0));
        yieldAdapterEta = 0;
        emit YieldAdapterSet(address(yieldAdapter));
    }

    /// @notice Set the in-vault liquidity buffer (bps of total assets). Admin only.
    /// @dev The buffer only gates deployIdle; claims always auto-recall, so raising or
    ///      lowering it never touches redeemability — just how much sits in the venue.
    function setLiquidityBuffer(uint256 bps) external onlyAdmin {
        if (bps > 10_000) revert InvalidBps();
        liquidityBufferBps = bps;
        emit LiquidityBufferSet(bps);
    }

    /// @notice Push idle principal into the yield venue, keeping the liquidity buffer
    ///         in-vault. Admin only (the harvest keeper never touches principal).
    function deployIdle(uint256 amount) external onlyAdmin {
        if (pausedAt != 0) revert IsPaused();
        IYieldAdapter adapter = yieldAdapter;
        if (address(adapter) == address(0)) revert NoAdapter();

        uint256 balance = token.balanceOf(address(this));
        uint256 required = (balance + adapter.totalDeployed()) * liquidityBufferBps / 10_000;
        if (amount > balance || balance - amount < required) revert BufferBreached();

        if (!token.approve(address(adapter), amount)) revert TransferFailed();
        adapter.deposit(amount);
        emit PrincipalDeployed(amount);
    }

    /// @notice Recall deployed principal from the venue back into the vault. Admin only.
    function recallDeployed(uint256 amount) external onlyAdmin {
        IYieldAdapter adapter = yieldAdapter;
        if (address(adapter) == address(0)) revert NoAdapter();
        adapter.withdraw(amount);
        emit PrincipalRecalled(amount);
    }

    /// @dev Claims never wait on the buffer: if the vault is short, pull the shortfall from
    ///      the venue right now. Called after all state updates (CEI preserved).
    function _ensureLiquidity(uint256 amount) internal {
        uint256 balance = token.balanceOf(address(this));
        if (balance >= amount) return;
        IYieldAdapter adapter = yieldAdapter;
        if (address(adapter) == address(0)) return; // transfer below will revert cleanly
        adapter.withdraw(amount - balance);
        emit PrincipalRecalled(amount - balance);
    }

    /// @inheritdoc IPotVault
    function currentPeriod() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /// @inheritdoc IPotVault
    function contribute(uint256 amount) external returns (uint256 ticketsMinted) {
        if (pausedAt != 0) revert IsPaused();
        if (amount < minContribution) revert BelowMinimum();

        uint256 periodId = currentPeriod();

        // Pull funds, then account — reads and writes both stay on the post-call side (the
        // triaged pull-then-account pattern; Mento stablecoins have no transfer hooks).
        // Cap breaches revert the whole tx, pull included.
        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();

        _principal[msg.sender][periodId] += amount;
        if (userPeriodCap != 0 && _principal[msg.sender][periodId] > userPeriodCap) {
            revert UserCapExceeded();
        }
        totalPrincipalOutstanding += amount;
        if (maxTotalPrincipal != 0 && totalPrincipalOutstanding > maxTotalPrincipal) {
            revert TvlCapExceeded();
        }

        // 1 ticket per `minContribution`, scaled by the caller's streak multiplier.
        uint256 baseTickets = amount / minContribution;
        ticketsMinted = baseTickets * _multiplierX10(msg.sender) / MULTIPLIER_SCALE;

        Period storage p = _periods[periodId];
        p.id = periodId;
        p.totalPrincipal += amount;
        p.totalTickets += ticketsMinted;

        _tickets[msg.sender][periodId] += ticketsMinted;

        emit Contributed(msg.sender, periodId, amount, ticketsMinted);

        // Crew aggregation is an observer, never a gate.
        if (address(crewRegistry) != address(0)) {
            try crewRegistry.recordContribution(msg.sender, periodId, amount) { } catch { }
        }
    }

    /// @inheritdoc IPotVault
    /// @dev No-loss guarantee: a user always reclaims exactly what they contributed. The
    ///      current period is locked until it closes — otherwise principal could exit while
    ///      its draw tickets stay live, a free option on the jara pot (issue #28). Today's
    ///      savings ride in tonight's draw and unlock right after.
    function claimPrincipal(uint256 periodId) external returns (uint256 amount) {
        if (periodId >= currentPeriod()) revert PeriodStillOpen();
        amount = _principal[msg.sender][periodId];
        if (amount == 0) revert NothingToClaim();

        _principal[msg.sender][periodId] = 0;
        _periods[periodId].totalPrincipal -= amount;
        totalPrincipalOutstanding -= amount;

        _ensureLiquidity(amount);
        if (!token.transfer(msg.sender, amount)) revert TransferFailed();
        emit PrincipalClaimed(msg.sender, periodId, amount);
    }

    /// @inheritdoc IPotVault
    function claimWinnings(uint256 periodId) external returns (uint256 amount) {
        amount = _winnings[msg.sender][periodId];
        if (amount == 0) revert NothingToClaim();

        _winnings[msg.sender][periodId] = 0;

        _ensureLiquidity(amount);
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

    /// @notice Move a period's unwon jaraPot into another period. DrawManager only.
    /// @dev Used to recycle the pot forward when nobody picked the winning number — a
    ///      spec §6 sink. Funds never leave the vault, so principal accounting is untouched.
    function rollJara(uint256 fromPeriod, uint256 toPeriod, uint256 amount) external {
        if (msg.sender != drawManager) revert NotDrawManager();
        Period storage from = _periods[fromPeriod];
        require(amount <= from.jaraPot, "exceeds jara pot");
        from.jaraPot -= amount;
        Period storage to = _periods[toPeriod];
        to.id = toPeriod;
        to.jaraPot += amount;
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
