// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "./interfaces/IERC20.sol";
import { ISprayFaucet } from "./interfaces/ISprayFaucet.sol";
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

    /// @notice Value backing each free ticket (= the vault's minContribution).
    uint256 public immutable ticketValue;

    /// @notice Max sprays a user may send per day window.
    uint256 public constant MAX_SPRAYS_PER_DAY = 3;

    address public admin;

    /// @notice Attests identity (MiniPay phone verification now, Self protocol in #18).
    address public verifier;

    /// @notice Campaign whose budget currently backs free tickets.
    bytes32 public activeCampaign;

    mapping(bytes32 campaignId => uint256) internal _campaignBalance;
    mapping(address user => bool) internal _verified;
    mapping(address user => bool) public welcomed;
    mapping(address user => mapping(uint256 day => uint256)) internal _spraysSent;

    error NotAdmin();
    error NotVerifier();
    error NotImplementedYet();

    constructor(PotVault _vault, address _verifier) {
        vault = _vault;
        token = _vault.token();
        ticketValue = _vault.minContribution();
        admin = msg.sender;
        verifier = _verifier;
        // The vault pulls jara funding via transferFrom; authorize it once.
        token.approve(address(_vault), type(uint256).max);
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    // ------------------------------------------------------------- sponsors

    /// @inheritdoc ISprayFaucet
    function fundSponsorPool(uint256 amount, bytes32 campaignId) external {
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");
        _campaignBalance[campaignId] += amount;
        // First funded campaign auto-activates so the faucet works without an admin step.
        if (activeCampaign == bytes32(0)) {
            activeCampaign = campaignId;
            emit CampaignActivated(campaignId);
        }
        emit SponsorFunded(msg.sender, amount, campaignId);
    }

    /// @notice Point free-ticket spending at a different campaign. Admin only.
    function setActiveCampaign(bytes32 campaignId) external onlyAdmin {
        activeCampaign = campaignId;
        emit CampaignActivated(campaignId);
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
    function welcomeTicket(address) external pure {
        revert NotImplementedYet(); // lands in the next commit
    }

    /// @inheritdoc ISprayFaucet
    function spray(address) external pure {
        revert NotImplementedYet(); // lands in a later commit
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
}
