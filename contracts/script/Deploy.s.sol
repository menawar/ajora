// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { PotVault } from "../src/PotVault.sol";
import { StreakSBT } from "../src/StreakSBT.sol";
import { SprayFaucet } from "../src/SprayFaucet.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IStreakSBT } from "../src/interfaces/IStreakSBT.sol";

/// @notice Deploys the Ajora core (PotVault + StreakSBT + SprayFaucet) against a Mento
///         stablecoin and wires them together.
/// @dev Env vars: STABLECOIN (token address), MIN_CONTRIBUTION (default 0.1e18),
///      VERIFIER (defaults to the deployer until the attestation backend exists).
///      Celo mainnet cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
///      Alfajores  cUSD:   0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
contract Deploy is Script {
    function run() external returns (PotVault vault, StreakSBT streak, SprayFaucet faucet) {
        address stablecoin = vm.envAddress("STABLECOIN");
        uint256 minContribution = vm.envOr("MIN_CONTRIBUTION", uint256(0.1e18));
        address verifier = vm.envOr("VERIFIER", msg.sender);

        vm.startBroadcast();
        vault = new PotVault(IERC20(stablecoin), minContribution);
        streak = new StreakSBT();
        faucet = new SprayFaucet(vault, verifier);
        vault.setStreakSBT(IStreakSBT(address(streak)));
        vault.setSprayFaucet(address(faucet));
        vm.stopBroadcast();

        console2.log("PotVault deployed at:", address(vault));
        console2.log("StreakSBT deployed at:", address(streak));
        console2.log("SprayFaucet deployed at:", address(faucet));
        console2.log("Verifier:", verifier);
        console2.log("Stablecoin:", stablecoin);
        console2.log("Min contribution:", minContribution);
    }
}
