// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { PotVault } from "../src/PotVault.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";

/// @notice Deploys PotVault against a Mento stablecoin.
/// @dev Set STABLECOIN (token address) and MIN_CONTRIBUTION env vars.
///      Celo mainnet cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
///      Alfajores  cUSD:   0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
contract Deploy is Script {
    function run() external returns (PotVault vault) {
        address stablecoin = vm.envAddress("STABLECOIN");
        uint256 minContribution = vm.envOr("MIN_CONTRIBUTION", uint256(0.1e18));

        vm.startBroadcast();
        vault = new PotVault(IERC20(stablecoin), minContribution);
        vm.stopBroadcast();

        console2.log("PotVault deployed at:", address(vault));
        console2.log("Stablecoin:", stablecoin);
        console2.log("Min contribution:", minContribution);
    }
}
