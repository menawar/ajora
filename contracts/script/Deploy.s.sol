// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { PotVault } from "../src/PotVault.sol";
import { StreakSBT } from "../src/StreakSBT.sol";
import { SprayFaucet } from "../src/SprayFaucet.sol";
import { DrawManager } from "../src/DrawManager.sol";
import { CrewRegistry } from "../src/CrewRegistry.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IStreakSBT } from "../src/interfaces/IStreakSBT.sol";
import { ICrewRegistry } from "../src/interfaces/ICrewRegistry.sol";

/// @notice Deploys the full Ajora core (PotVault + StreakSBT + SprayFaucet + DrawManager +
///         CrewRegistry) against a Mento stablecoin, wires everything together, and arms
///         the month-1 blast-radius caps (spec §13, issue #50) in the same broadcast.
/// @dev Env vars: STABLECOIN (token address), MIN_CONTRIBUTION (default 0.1e18),
///      VERIFIER and KEEPER (both default to the deployer until the backend services exist).
///      Caps (0 disables): USER_PERIOD_CAP (default 50e18 — 50 cUSD/user/day),
///      MAX_TOTAL_PRINCIPAL (default 5000e18 TVL), FREE_VALUE_CAP (default: the faucet's
///      built-in 30 tickets; only overridden when set).
///      Celo mainnet cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
///      Alfajores  cUSD:   0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
contract Deploy is Script {
    function run()
        external
        returns (
            PotVault vault,
            StreakSBT streak,
            SprayFaucet faucet,
            DrawManager draw,
            CrewRegistry crew
        )
    {
        address stablecoin = vm.envAddress("STABLECOIN");
        uint256 minContribution = vm.envOr("MIN_CONTRIBUTION", uint256(0.1e18));
        address verifier = vm.envOr("VERIFIER", msg.sender);
        address keeper = vm.envOr("KEEPER", msg.sender);
        uint256 userPeriodCap = vm.envOr("USER_PERIOD_CAP", uint256(50e18));
        uint256 maxTotalPrincipal = vm.envOr("MAX_TOTAL_PRINCIPAL", uint256(5_000e18));
        uint256 freeValueCap = vm.envOr("FREE_VALUE_CAP", uint256(0)); // 0 = keep faucet default

        vm.startBroadcast();
        vault = new PotVault(IERC20(stablecoin), minContribution);
        streak = new StreakSBT();
        faucet = new SprayFaucet(vault, verifier);
        draw = new DrawManager(vault, keeper);
        crew = new CrewRegistry();
        vault.setStreakSBT(IStreakSBT(address(streak)));
        vault.setSprayFaucet(address(faucet));
        vault.setDrawManager(address(draw));
        vault.setCrewRegistry(ICrewRegistry(address(crew)));
        crew.setVault(address(vault));
        crew.setFaucet(faucet);
        faucet.setCrewRegistry(address(crew));
        // Month-1 caps armed at birth — no unguarded window between deploy and a
        // follow-up transaction (#50). Raise later with the documented review.
        vault.setDepositCaps(userPeriodCap, maxTotalPrincipal);
        if (freeValueCap != 0) faucet.setFreeValueCap(freeValueCap);
        vm.stopBroadcast();

        console2.log("PotVault deployed at:", address(vault));
        console2.log("StreakSBT deployed at:", address(streak));
        console2.log("SprayFaucet deployed at:", address(faucet));
        console2.log("DrawManager deployed at:", address(draw));
        console2.log("CrewRegistry deployed at:", address(crew));
        console2.log("Verifier:", verifier);
        console2.log("Keeper:", keeper);
        console2.log("Stablecoin:", stablecoin);
        console2.log("Min contribution:", minContribution);
        console2.log("User/period cap:", userPeriodCap);
        console2.log("TVL cap:", maxTotalPrincipal);
        console2.log("Free-value cap (per human):", faucet.maxFreeValuePerUser());
    }
}
