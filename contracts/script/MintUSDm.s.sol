// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

contract MintUSDm is Test {
    function run() external {
        address usdm = 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b;
        address myWallet = 0x0Cf01057391165EcB2Bb989B2255cd581F075DB7;
        
        // Give CELO (ETH) for gas
        vm.deal(myWallet, 100 ether);
        
        // Give USDm by magically overriding the ERC20 balance storage slot
        deal(usdm, myWallet, 10_000 * 1e18); // 10,000 USDm
    }
}
