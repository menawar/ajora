// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { PotVault } from "../src/PotVault.sol";
import { DrawManager } from "../src/DrawManager.sol";
import { YieldAdapter } from "../src/YieldAdapter.sol";
import { Treasury } from "../src/Treasury.sol";
import { IERC20 } from "../src/interfaces/IERC20.sol";
import { IAaveV3Pool } from "../src/interfaces/IAaveV3Pool.sol";
import { IYieldAdapter } from "../src/interfaces/IYieldAdapter.sol";

/// @notice Attaches the yield + treasury layer (#7) to an already-deployed core: deploys
///         YieldAdapter (Aave v3 venue) + Treasury and *proposes* the adapter on the vault.
///         The vault's 24h timelock means wiring completes with a follow-up
///         `vault.applyYieldAdapter()` — this script cannot and should not skip that.
/// @dev Env: VAULT, DRAW_MANAGER (core addresses), AAVE_POOL, A_TOKEN (venue),
///      DEPOSIT_CAP (default 1000e18 — month-1 blast-radius cap).
///      Celo mainnet venue: pool 0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402,
///      aCelcUSD 0xBba98352628B0B0c4b40583F593fFCb630935a45.
contract DeployYield is Script {
    function run() external returns (YieldAdapter adapter, Treasury treasury) {
        PotVault vault = PotVault(vm.envAddress("VAULT"));
        DrawManager draw = DrawManager(vm.envAddress("DRAW_MANAGER"));
        IAaveV3Pool pool = IAaveV3Pool(vm.envAddress("AAVE_POOL"));
        IERC20 aToken = IERC20(vm.envAddress("A_TOKEN"));
        uint256 cap = vm.envOr("DEPOSIT_CAP", uint256(1_000e18));

        IERC20 token = vault.token();

        vm.startBroadcast();
        adapter = new YieldAdapter(token, vault, pool, aToken, cap);
        treasury = new Treasury(token, vault, draw);
        vault.proposeYieldAdapter(IYieldAdapter(address(adapter)));
        vm.stopBroadcast();

        console2.log("YieldAdapter deployed at:", address(adapter));
        console2.log("Treasury deployed at:", address(treasury));
        console2.log("Deposit cap:", cap);
        console2.log("Adapter PROPOSED on vault; timelock eta:", vault.yieldAdapterEta());
        console2.log("Run vault.applyYieldAdapter() after the eta to finish wiring.");
    }
}
