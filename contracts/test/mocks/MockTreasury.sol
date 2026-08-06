// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ITreasury } from "../../src/interfaces/ITreasury.sol";
import { IERC20 } from "../../src/interfaces/IERC20.sol";

/// @notice Full-featured mock treasury for tests; supports coverShortfall backstop testing.
contract MockTreasury is ITreasury {
    uint256 public totalSponsorFees;
    uint256 public totalYieldFees;
    uint256 public totalRescueFees;
    uint256 public totalRake;
    uint256 public totalShortfallCovered;

    /// @notice Wired by tests that want to use the treasury backstop.
    IERC20 public token;
    address public vault;

    /// @notice Fund the mock treasury with tokens for backstop tests.
    function seed(IERC20 _token, address _vault, uint256 amount) external {
        token = _token;
        vault = _vault;
        _token.transferFrom(msg.sender, address(this), amount);
    }

    function collectSponsorFee(uint256 amount, bytes32) external {
        totalSponsorFees += amount;
    }

    function collectYieldFee(uint256 amount, uint256) external {
        if (address(token) != address(0)) {
            token.transferFrom(msg.sender, address(this), amount);
        }
        totalYieldFees += amount;
    }

    function collectRescueFee(uint256 amount, address) external {
        totalRescueFees += amount;
    }

    function collectRake(uint256 amount, uint256) external {
        totalRake += amount;
    }

    function totalProtocolFees() external view returns (uint256) {
        return totalSponsorFees + totalYieldFees + totalRescueFees + totalRake;
    }

    function sweepUnclaimed(uint256) external returns (uint256) {
        return 0;
    }

    function coverShortfall(uint256 amount) external {
        require(address(token) != address(0), "MockTreasury: not seeded");
        require(msg.sender == vault, "MockTreasury: not vault");
        totalShortfallCovered += amount;
        token.transfer(vault, amount);
        emit ShortfallCovered(amount);
    }
}
