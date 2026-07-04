// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { PotVault } from "../src/PotVault.sol";
import { StreakSBT } from "../src/StreakSBT.sol";
import { SprayFaucet } from "../src/SprayFaucet.sol";
import { DrawManager } from "../src/DrawManager.sol";
import { CrewRegistry } from "../src/CrewRegistry.sol";
import { IStreakSBT } from "../src/interfaces/IStreakSBT.sol";
import { ICrewRegistry } from "../src/interfaces/ICrewRegistry.sol";

/// @notice Completes the gas-interrupted v4 deploy: PotVault/StreakSBT/SprayFaucet already
///         landed; this deploys DrawManager + (the updated) CrewRegistry and wires all five.
/// @dev Env: V4_VAULT, V4_STREAK, V4_FAUCET (the landed addresses), KEEPER (defaults to
///      deployer). Run once gas normalizes:
///      STABLECOIN unused here — the vault is already bound to cUSD.
contract CompleteV4 is Script {
    function run() external returns (DrawManager draw, CrewRegistry crew) {
        PotVault vault = PotVault(vm.envAddress("V4_VAULT"));
        StreakSBT streak = StreakSBT(vm.envAddress("V4_STREAK"));
        SprayFaucet faucet = SprayFaucet(vm.envAddress("V4_FAUCET"));
        address keeper = vm.envOr("KEEPER", msg.sender);

        vm.startBroadcast();
        draw = new DrawManager(vault, keeper);
        crew = new CrewRegistry();
        vault.setStreakSBT(IStreakSBT(address(streak)));
        vault.setSprayFaucet(address(faucet));
        vault.setDrawManager(address(draw));
        vault.setCrewRegistry(ICrewRegistry(address(crew)));
        crew.setVault(address(vault));
        crew.setFaucet(faucet);
        faucet.setCrewRegistry(address(crew));
        vm.stopBroadcast();

        console2.log("DrawManager deployed at:", address(draw));
        console2.log("CrewRegistry deployed at:", address(crew));
        console2.log("Wired to vault:", address(vault));
    }
}
