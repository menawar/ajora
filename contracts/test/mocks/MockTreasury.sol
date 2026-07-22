// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ITreasury } from "../../src/interfaces/ITreasury.sol";
import { IERC20 } from "../../src/interfaces/IERC20.sol";

contract MockTreasury is ITreasury {
    uint256 public totalSponsorFees;
    uint256 public totalYieldFees;
    uint256 public totalRescueFees;
    uint256 public totalRake;

    function collectSponsorFee(uint256 amount, bytes32) external {
        totalSponsorFees += amount;
    }
    
    function collectYieldFee(uint256 amount, uint256) external {
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
}
