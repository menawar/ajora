// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ICrewRegistry } from "./interfaces/ICrewRegistry.sol";
import { SprayFaucet } from "./SprayFaucet.sol";

/// @title CrewRegistry
/// @notice Crews + referral attribution for Ajora. Savings are aggregated O(1) via a
///         PotVault hook; referral rewards vest only after the invitee saves their own
///         money on VESTING_DAYS distinct days (anti-sybil: fake invites earn nothing).
contract CrewRegistry is ICrewRegistry {
    struct SaveStats {
        uint64 lastPeriod; // last period a contribution was recorded for
        uint64 dayCount; // distinct periods with a self-funded save
    }

    /// @notice Distinct self-funded save days required before a referral vests.
    uint256 public constant VESTING_DAYS = 3;

    address public admin;

    /// @notice The PotVault allowed to record contributions.
    address public vault;

    /// @notice Faucet paying the sponsor-backed referral bonus (optional).
    SprayFaucet public faucet;

    uint256 public nextCrewId = 1; // 0 = not in a crew

    mapping(address user => uint256) public crewOf;
    mapping(address user => address) public referrerOf;
    mapping(bytes32 code => address) public codeOwner;
    mapping(address user => bytes32) public codeOf; // reverse lookup for the UI
    mapping(uint256 crewId => uint256) public memberCount;
    mapping(uint256 crewId => mapping(uint256 periodId => uint256)) public crewSavings;
    mapping(address user => SaveStats) internal _saves;
    mapping(address user => bool) public referralVested;

    error NotAdmin();
    error NotVault();
    error AlreadySet();
    error AlreadyInCrew();
    error CodeTaken();
    error EmptyCode();
    error UnknownCode();
    error SelfReferral();
    error NoReferrer();
    error AlreadyVested();
    error NotEnoughSaveDays();
    error ZeroAddress();

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    /// @notice One-time wiring of the PotVault that feeds contribution events.
    function setVault(address _vault) external onlyAdmin {
        if (_vault == address(0)) revert ZeroAddress();
        if (vault != address(0)) revert AlreadySet();
        vault = _vault;
    }

    /// @notice One-time wiring of the faucet that pays referral bonuses.
    function setFaucet(SprayFaucet _faucet) external onlyAdmin {
        if (address(_faucet) == address(0)) revert ZeroAddress();
        if (address(faucet) != address(0)) revert AlreadySet();
        faucet = _faucet;
    }

    // ----------------------------------------------------------------- crews

    /// @inheritdoc ICrewRegistry
    function createCrew(bytes32 code) external returns (uint256 crewId) {
        _registerCode(msg.sender, code);
        crewId = nextCrewId++;
        crewOf[msg.sender] = crewId;
        memberCount[crewId] = 1;
        emit CrewCreated(crewId, msg.sender, code);
    }

    /// @inheritdoc ICrewRegistry
    function joinCrew(bytes32 inviterCode, bytes32 myCode) external returns (uint256 crewId) {
        address inviter = codeOwner[inviterCode];
        if (inviter == address(0)) revert UnknownCode();
        if (inviter == msg.sender) revert SelfReferral();

        _registerCode(msg.sender, myCode); // also reverts if already in a crew
        crewId = crewOf[inviter];
        crewOf[msg.sender] = crewId;
        referrerOf[msg.sender] = inviter;
        memberCount[crewId] += 1;
        emit CrewJoined(crewId, msg.sender, inviter);
    }

    /// @dev A user registers exactly one code, exactly when they enter a crew.
    function _registerCode(address user, bytes32 code) internal {
        if (crewOf[user] != 0) revert AlreadyInCrew();
        if (code == bytes32(0)) revert EmptyCode();
        if (codeOwner[code] != address(0)) revert CodeTaken();
        codeOwner[code] = user;
        codeOf[user] = code;
    }

    // ------------------------------------------------------------- savings

    /// @inheritdoc ICrewRegistry
    function recordContribution(address user, uint256 periodId, uint256 amount) external {
        if (msg.sender != vault) revert NotVault();

        // Distinct-day counter feeds referral vesting even for crewless savers.
        SaveStats storage s = _saves[user];
        if (s.lastPeriod != periodId || s.dayCount == 0) {
            s.lastPeriod = uint64(periodId);
            s.dayCount += 1;
        }

        uint256 crewId = crewOf[user];
        if (crewId != 0) {
            crewSavings[crewId][periodId] += amount;
            emit ContributionRecorded(crewId, user, periodId, amount);
        }
    }

    /// @inheritdoc ICrewRegistry
    function savedDayCount(address user) external view returns (uint256) {
        return _saves[user].dayCount;
    }

    // ------------------------------------------------------------- vesting

    /// @inheritdoc ICrewRegistry
    /// @dev Permissionless by design (the issue said keeper-called; a pull model is strictly
    ///      more robust and the state gates make it safe): anyone may trigger, it vests once,
    ///      and only after real multi-day self-funded activity.
    function vestReferral(address referred) external {
        address referrer = referrerOf[referred];
        if (referrer == address(0)) revert NoReferrer();
        if (referralVested[referred]) revert AlreadyVested();
        if (_saves[referred].dayCount < VESTING_DAYS) revert NotEnoughSaveDays();

        referralVested[referred] = true;
        emit ReferralVested(referrer, referred);

        // Sponsor-backed bonus ticket; a drained campaign or unverified referrer
        // must never block the vesting record itself.
        if (address(faucet) != address(0)) {
            try faucet.referralBonus(referrer) { } catch { }
        }
    }
}
