// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IStreakSBT } from "./interfaces/IStreakSBT.sol";
import { IERC20 } from "./interfaces/IERC20.sol";
import { ITreasury } from "./interfaces/ITreasury.sol";

/// @title StreakSBT
/// @notice Soulbound daily check-in record. A live streak boosts the holder's PotVault ticket
///         multiplier; milestone streaks mint non-transferable badges.
/// @dev Day windows use the same `block.timestamp / 1 days` clock as PotVault periods, so a
///      check-in day maps 1:1 to a savings period. See AJORA_SPEC.md §8.5.
contract StreakSBT is IStreakSBT {
    struct StreakData {
        uint64 lastCheckInDay; // day index of the most recent check-in
        uint64 streakDays; // streak length as of lastCheckInDay
    }

    mapping(address user => StreakData) internal _streaks;
    mapping(address user => mapping(uint256 badgeId => bool)) internal _badges;

    IERC20 public immutable token;
    ITreasury public immutable treasury;
    address public admin;

    uint256 public rescueFee = 1e18; // Default 1 token
    uint256 public constant RESCUE_WINDOW = 3; // days

    error AlreadyCheckedIn();
    error Soulbound();
    error ZeroAddress();
    error NotAdmin();
    error NotDead();
    error TooDead();

    event StreakRescued(address indexed user, uint256 streakDays, uint256 feePaid);
    event RescueFeeSet(uint256 fee);

    constructor(IERC20 _token, ITreasury _treasury) {
        if (address(_token) == address(0) || address(_treasury) == address(0)) revert ZeroAddress();
        token = _token;
        treasury = _treasury;
        admin = msg.sender;
        
        token.approve(address(_treasury), type(uint256).max);
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    function setRescueFee(uint256 fee) external onlyAdmin {
        rescueFee = fee;
        emit RescueFeeSet(fee);
    }

    /// @dev Multiplier scale: 10 = 1.0x.
    uint256 internal constant SCALE = 10;

    /// @notice Day index of the current day window.
    function currentDay() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /// @inheritdoc IStreakSBT
    function checkIn() external {
        uint256 today = currentDay();
        StreakData storage s = _streaks[msg.sender];

        if (s.lastCheckInDay == today && s.streakDays != 0) revert AlreadyCheckedIn();

        // Consecutive day extends the streak; any gap restarts it at 1.
        if (s.lastCheckInDay + 1 == today && s.streakDays != 0) {
            s.streakDays += 1;
        } else {
            s.streakDays = 1;
        }
        s.lastCheckInDay = uint64(today);

        emit CheckedIn(msg.sender, s.streakDays, multiplierOf(msg.sender));
        _maybeMintBadge(msg.sender, s.streakDays);
    }

    function rescueStreak() external {
        uint256 today = currentDay();
        StreakData storage s = _streaks[msg.sender];

        // Must actually have a streak to rescue
        if (s.streakDays == 0) revert NotDead();

        // Must be dead (missed yesterday)
        if (s.lastCheckInDay + 1 >= today) revert NotDead();

        // Must be within rescue window
        if (s.lastCheckInDay + RESCUE_WINDOW < today) revert TooDead();

        require(token.transferFrom(msg.sender, address(this), rescueFee), "transfer failed");
        if (rescueFee > 0) {
            treasury.collectRescueFee(rescueFee, msg.sender);
        }

        s.lastCheckInDay = uint64(today);
        emit StreakRescued(msg.sender, s.streakDays, rescueFee);
    }

    /// @dev Milestone badges at the tier boundaries. badgeId == the streak-day milestone.
    function _maybeMintBadge(address user, uint256 streakDays) internal {
        if (streakDays == 7 || streakDays == 30 || streakDays == 90) {
            if (!_badges[user][streakDays]) {
                _badges[user][streakDays] = true;
                emit BadgeMinted(user, streakDays);
            }
        }
    }

    /// @inheritdoc IStreakSBT
    /// @dev A streak is live if the user checked in today or yesterday; otherwise it reads 0.
    function streakOf(address user) public view returns (uint256) {
        StreakData storage s = _streaks[user];
        if (s.streakDays == 0) return 0;
        uint256 today = currentDay();
        if (s.lastCheckInDay == today || s.lastCheckInDay + 1 == today) return s.streakDays;
        return 0;
    }

    /// @inheritdoc IStreakSBT
    /// @dev Tiers (AJORA_SPEC.md §8.5): 1–6d = 1.0x, 7–29d = 1.5x, 30–89d = 2.0x, 90d+ = 3.0x.
    ///      Based on the live streak, so a broken streak instantly falls back to 1.0x —
    ///      the only thing a missed day forfeits is this bonus, never principal.
    function multiplierOf(address user) public view returns (uint256) {
        uint256 s = streakOf(user);
        if (s >= 90) return 30;
        if (s >= 30) return 20;
        if (s >= 7) return 15;
        return SCALE;
    }

    /// @inheritdoc IStreakSBT
    function hasBadge(address user, uint256 badgeId) public view returns (bool) {
        return _badges[user][badgeId];
    }

    // ------------------------------------------------------------- soulbound
    // Streaks and badges are identity, not property: every transfer path reverts.

    function transfer(address, uint256) external pure returns (bool) {
        revert Soulbound();
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        revert Soulbound();
    }

    function approve(address, uint256) external pure returns (bool) {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) external pure {
        revert Soulbound();
    }
}
