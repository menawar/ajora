// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISprayFaucet
/// @notice Sponsor-funded faucet behind Ajora's zero-deposit onboarding: one-time welcome
///         tickets for new users and the owambe "spray" gift mechanic between friends.
/// @dev Every free ticket is backed by real sponsor money: its value moves from the sponsor
///      campaign into the period's jaraPot at issue time, so odds and prize backing stay in
///      lockstep. See AJORA_SPEC.md §8.3, §5.
interface ISprayFaucet {
    event SponsorFunded(address indexed sponsor, uint256 amount, bytes32 indexed campaignId);
    event CampaignActivated(bytes32 indexed campaignId);
    event WelcomeTicket(address indexed user, uint256 indexed periodId, uint256 value);
    event Sprayed(
        address indexed from, address indexed to, uint256 indexed periodId, uint256 value
    );
    event Verified(address indexed user, bool verified);
    event ReferralBonus(address indexed referrer, uint256 indexed periodId, uint256 value);

    /// @notice Deposit sponsor budget into a campaign. Pulls stablecoin from the caller.
    function fundSponsorPool(uint256 amount, bytes32 campaignId) external;

    /// @notice One-time free ticket for a verified user who has never received one.
    /// @dev Permissionless trigger so the app can fire it during onboarding.
    function welcomeTicket(address user) external;

    /// @notice Gift a free sponsor-funded ticket to a verified friend. Rate-limited per day.
    function spray(address friend) external;

    /// @notice One sponsor-backed bonus ticket for a referrer whose invite vested.
    /// @dev CrewRegistry-only; not rate-limited (vesting fires once per referred user).
    function referralBonus(address referrer) external;

    /// @notice Sprays the caller can still send in the current day window.
    function dailySpraysLeft(address user) external view returns (uint256);

    /// @notice Remaining budget of a sponsor campaign.
    function campaignBalance(bytes32 campaignId) external view returns (uint256);

    /// @notice Whether a user has passed identity verification (phone / Self protocol).
    function isVerified(address user) external view returns (bool);
}
