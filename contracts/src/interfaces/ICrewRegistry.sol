// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ICrewRegistry
/// @notice Squads ("crews") with per-user referral codes, O(1) crew savings aggregation fed
///         by a PotVault hook, and anti-sybil referral vesting: the inviter only earns once
///         the invitee has saved their own money on 3 distinct days.
/// @dev Referral codes belong to USERS, not crews: joining via a member's code joins that
///      member's crew and records them as your referrer (AJORA_SPEC.md §8.4, §5). Loops are
///      structurally impossible — you can only own a code once you're already in a crew.
interface ICrewRegistry {
    event CrewCreated(uint256 indexed crewId, address indexed founder, bytes32 code);
    event CrewJoined(uint256 indexed crewId, address indexed member, address indexed referrer);
    event ContributionRecorded(
        uint256 indexed crewId, address indexed member, uint256 indexed periodId, uint256 amount
    );
    event ReferralVested(address indexed referrer, address indexed referred);

    /// @notice Found a new crew and register your personal referral code.
    function createCrew(bytes32 code) external returns (uint256 crewId);

    /// @notice Join the inviter's crew via their code; records them as your referrer and
    ///         registers your own code so you can recruit next.
    function joinCrew(bytes32 inviterCode, bytes32 myCode) external returns (uint256 crewId);

    /// @notice PotVault-only hook: bump the member's crew savings and their distinct-day
    ///         save counter.
    function recordContribution(address user, uint256 periodId, uint256 amount) external;

    /// @notice Permissionless: vest the referral for `referred` once they have saved on
    ///         VESTING_DAYS distinct days; pays the referrer one sponsor-backed bonus ticket.
    function vestReferral(address referred) external;

    function crewOf(address user) external view returns (uint256);
    function referrerOf(address user) external view returns (address);
    function crewSavings(uint256 crewId, uint256 periodId) external view returns (uint256);
    function savedDayCount(address user) external view returns (uint256);
    function codeOwner(bytes32 code) external view returns (address);
    function memberCount(uint256 crewId) external view returns (uint256);
}
