// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "./interfaces/IERC20.sol";
import { ISprayFaucet } from "./interfaces/ISprayFaucet.sol";
import { ITreasury } from "./interfaces/ITreasury.sol";
import { PotVault } from "./PotVault.sol";

/// @title SprayFaucet
/// @notice Holds sponsor budgets and issues free draw tickets: a one-time welcome ticket per
///         verified human and rate-limited "sprays" between friends. Each free ticket's value
///         moves from the sponsor campaign into the period's jaraPot, so odds and prize
///         backing stay in lockstep.
/// @dev See AJORA_SPEC.md §8.3. Anti-drain: verification gating, per-day spray limits, and
///      spend bounded by the active campaign's balance.
contract SprayFaucet is ISprayFaucet {
    PotVault public immutable vault;
    IERC20 public immutable token;
    ITreasury public immutable treasury;

    /// @notice Sponsor fee taken from pool deposits.
    uint256 public sponsorFeeBps = 500; // 5% default

    /// @notice Value backing each free ticket (= the vault's minContribution).
    uint256 public immutable ticketValue;

    /// @notice Max sprays a user may send per day window.
    uint256 public constant MAX_SPRAYS_PER_DAY = 3;

    /// @notice Max free tickets one address may *receive* per day, across welcome, sprays,
    ///         and referral bonuses. A verified ring can each send 3/day — without this,
    ///         they could funnel unbounded sponsor budget into one account (spec §13).
    uint256 public constant MAX_FREE_RECEIVED_PER_DAY = 3;

    address public admin;

    /// @notice Attests identity (MiniPay phone verification now, Self protocol in #18).
    address public verifier;

    /// @notice Campaign whose budget currently backs free tickets.
    bytes32 public activeCampaign;

    /// @notice CrewRegistry allowed to trigger referral bonuses. Set once.
    address public crewRegistry;

    /// @notice Lifetime cap on free value per human (spec §13); 0 disables the cap.
    uint256 public maxFreeValuePerUser;

    mapping(bytes32 campaignId => uint256) internal _campaignBalance;
    mapping(address user => bool) internal _verified;
    mapping(address user => bool) public welcomed;
    mapping(address user => mapping(uint256 day => uint256)) internal _spraysSent;
    mapping(address user => mapping(uint256 day => uint256)) internal _freeReceived;

    /// @notice Lifetime free value received per address, in token units.
    mapping(address user => uint256) public freeValueOf;

    error NotAdmin();
    error NotVerifier();
    error NotVerified();
    error AlreadyWelcomed();
    error InsufficientCampaignBudget();
    error SelfSpray();
    error SprayLimitReached();
    error NotCrewRegistry();
    error AlreadySet();
    error ZeroAddress();
    error DailyFreeLimitReached();
    error LifetimeFreeCapReached();

    event FreeValueCapSet(uint256 cap);

    constructor(PotVault _vault, address _verifier, ITreasury _treasury) {
        if (_verifier == address(0) || address(_treasury) == address(0)) revert ZeroAddress();
        vault = _vault;
        token = _vault.token();
        treasury = _treasury;
        ticketValue = _vault.minContribution();
        admin = msg.sender;
        verifier = _verifier;
        // Month-1 default: 30 free tickets (~3 cUSD) per human, lifetime. Admin-tunable.
        maxFreeValuePerUser = 30 * ticketValue;
        // The vault pulls jara funding via transferFrom; authorize it once.
        require(token.approve(address(_vault), type(uint256).max), "approve failed");
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    // ------------------------------------------------------------- sponsors

    /// @inheritdoc ISprayFaucet
    function fundSponsorPool(uint256 amount, bytes32 campaignId) external {
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");

        uint256 fee = (amount * sponsorFeeBps) / 10000;
        uint256 netAmount = amount - fee;

        if (fee > 0) {
            require(token.approve(address(treasury), fee), "approve failed");
            treasury.collectSponsorFee(fee, campaignId);
        }

        _campaignBalance[campaignId] += netAmount;
        // First funded campaign auto-activates so the faucet works without an admin step.
        if (activeCampaign == bytes32(0)) {
            activeCampaign = campaignId;
            emit CampaignActivated(campaignId);
        }
        emit SponsorFunded(msg.sender, netAmount, campaignId);
    }

    /// @notice One-time wiring of the CrewRegistry allowed to pay referral bonuses.
    function setCrewRegistry(address _crewRegistry) external onlyAdmin {
        if (_crewRegistry == address(0)) revert ZeroAddress();
        if (crewRegistry != address(0)) revert AlreadySet();
        crewRegistry = _crewRegistry;
    }

    /// @notice Point free-ticket spending at a different campaign. Admin only.
    function setActiveCampaign(bytes32 campaignId) external onlyAdmin {
        activeCampaign = campaignId;
        emit CampaignActivated(campaignId);
    }

    /// @notice Tune the lifetime free-value cap per human; 0 disables it. Admin only.
    function setFreeValueCap(uint256 cap) external onlyAdmin {
        maxFreeValuePerUser = cap;
        emit FreeValueCapSet(cap);
    }

    /// @notice Set sponsor fee. Admin only.
    function setSponsorFeeBps(uint256 bps) external onlyAdmin {
        require(bps <= 10000, "Invalid bps");
        sponsorFeeBps = bps;
    }

    // ----------------------------------------------------------- verification

    /// @notice Attest (or revoke) a user's identity verification. Verifier only.
    function setVerified(address user, bool verified) external {
        if (msg.sender != verifier) revert NotVerifier();
        _verified[user] = verified;
        emit Verified(user, verified);
    }

    /// @inheritdoc ISprayFaucet
    function isVerified(address user) public view returns (bool) {
        return _verified[user];
    }

    // ---------------------------------------------------------- free tickets

    /// @inheritdoc ISprayFaucet
    function welcomeTicket(address user) external {
        if (!_verified[user]) revert NotVerified();
        if (welcomed[user]) revert AlreadyWelcomed();
        welcomed[user] = true;

        uint256 periodId = _issueFreeTicket(user);
        emit WelcomeTicket(user, periodId, ticketValue);
    }

    /// @dev Spend one ticketValue from the active campaign: back it in the period's jaraPot
    ///      and credit one ticket of odds to `user`. Reverts if the campaign can't cover it.
    ///      Single choke point for the per-human free-value caps — welcome, spray, and
    ///      referral bonuses all pass through here.
    function _issueFreeTicket(address user) internal returns (uint256 periodId) {
        uint256 day = block.timestamp / 1 days;
        if (_freeReceived[user][day] >= MAX_FREE_RECEIVED_PER_DAY) revert DailyFreeLimitReached();
        _freeReceived[user][day] += 1;

        freeValueOf[user] += ticketValue;
        if (maxFreeValuePerUser != 0 && freeValueOf[user] > maxFreeValuePerUser) {
            revert LifetimeFreeCapReached();
        }

        bytes32 campaign = activeCampaign;
        uint256 balance = _campaignBalance[campaign];
        if (balance < ticketValue) revert InsufficientCampaignBudget();
        _campaignBalance[campaign] = balance - ticketValue;

        periodId = vault.currentPeriod();
        vault.fundJara(periodId, ticketValue); // prize backing moves to the pot
        vault.creditTickets(user, periodId, 1); // odds credited, no principal claim
    }

    /// @inheritdoc ISprayFaucet
    /// @dev Both sides must be verified humans: the sender so bots can't farm the faucet,
    ///      the recipient so budget only flows to real phones. Sender pays nothing —
    ///      status is the incentive (AJORA_SPEC.md §5).
    function spray(address friend) external {
        if (friend == msg.sender) revert SelfSpray();
        if (!_verified[msg.sender] || !_verified[friend]) revert NotVerified();

        uint256 day = block.timestamp / 1 days;
        if (_spraysSent[msg.sender][day] >= MAX_SPRAYS_PER_DAY) revert SprayLimitReached();
        _spraysSent[msg.sender][day] += 1;

        uint256 periodId = _issueFreeTicket(friend);
        emit Sprayed(msg.sender, friend, periodId, ticketValue);
    }

    /// @inheritdoc ISprayFaucet
    function referralBonus(address referrer) external {
        if (msg.sender != crewRegistry) revert NotCrewRegistry();
        if (!_verified[referrer]) revert NotVerified();
        uint256 periodId = _issueFreeTicket(referrer);
        emit ReferralBonus(referrer, periodId, ticketValue);
    }

    // ---------------------------------------------------------------- views

    /// @inheritdoc ISprayFaucet
    function dailySpraysLeft(address user) public view returns (uint256) {
        uint256 sent = _spraysSent[user][block.timestamp / 1 days];
        return sent >= MAX_SPRAYS_PER_DAY ? 0 : MAX_SPRAYS_PER_DAY - sent;
    }

    /// @inheritdoc ISprayFaucet
    function campaignBalance(bytes32 campaignId) public view returns (uint256) {
        return _campaignBalance[campaignId];
    }

    /// @notice Free tickets `user` may still receive today (for spray UX).
    function dailyFreeLeft(address user) public view returns (uint256) {
        uint256 got = _freeReceived[user][block.timestamp / 1 days];
        return got >= MAX_FREE_RECEIVED_PER_DAY ? 0 : MAX_FREE_RECEIVED_PER_DAY - got;
    }
}
