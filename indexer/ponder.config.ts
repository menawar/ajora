import { createConfig } from "ponder";

import { potVaultAbi } from "./abis/potVaultAbi";
import { streakSBTAbi } from "./abis/streakSBTAbi";
import { sprayFaucetAbi } from "./abis/sprayFaucetAbi";
import { drawManagerAbi } from "./abis/drawManagerAbi";

// v3 core (contracts/deployments/celo-mainnet.json). startBlock is just before the
// v3 deploy on 2026-07-04. CrewRegistry joins here after the v4 completion run.
const START_BLOCK = 71_246_000;

export default createConfig({
  chains: {
    celo: {
      id: 42220,
      rpc: process.env.PONDER_RPC_URL_42220 ?? "https://forno.celo.org",
    },
  },
  contracts: {
    PotVault: {
      chain: "celo",
      abi: potVaultAbi,
      address: "0x6B8617f4B6BfA6752802e883136C18720294497f",
      startBlock: START_BLOCK,
    },
    StreakSBT: {
      chain: "celo",
      abi: streakSBTAbi,
      address: "0x2390CD7A18DEc4240617ED421671790f33E4d674",
      startBlock: START_BLOCK,
    },
    SprayFaucet: {
      chain: "celo",
      abi: sprayFaucetAbi,
      address: "0xA0076cE2954227f62eE7A9a35dD62c56DE516f00",
      startBlock: START_BLOCK,
    },
    DrawManager: {
      chain: "celo",
      abi: drawManagerAbi,
      address: "0x18E08293D58Fbf1E434671694879f24ef63e57a8",
      startBlock: START_BLOCK,
    },
  },
});
