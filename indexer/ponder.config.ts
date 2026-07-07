import { createConfig } from "ponder";

import { potVaultAbi } from "./abis/potVaultAbi";
import { streakSBTAbi } from "./abis/streakSBTAbi";
import { sprayFaucetAbi } from "./abis/sprayFaucetAbi";
import { drawManagerAbi } from "./abis/drawManagerAbi";
import { crewRegistryAbi } from "./abis/crewRegistryAbi";

// core_v5 (contracts/deployments/celo-mainnet.json), deployed 2026-07-07.
// startBlock is the v5 deploy block. CrewRegistry ships wired in this core, so
// crews index from the same block as the rest of the loop.
const START_BLOCK = 71_514_774;

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
      address: "0x0A9f549C0Fc859b0925c7dcB5F8A55d4020c1415",
      startBlock: START_BLOCK,
    },
    StreakSBT: {
      chain: "celo",
      abi: streakSBTAbi,
      address: "0x9aC488Bc0Ba3cF7F2552c61d6F9BbA949961d974",
      startBlock: START_BLOCK,
    },
    SprayFaucet: {
      chain: "celo",
      abi: sprayFaucetAbi,
      address: "0x117cEa08fD62220506FD7621C548a627373B2DFc",
      startBlock: START_BLOCK,
    },
    DrawManager: {
      chain: "celo",
      abi: drawManagerAbi,
      address: "0xacB78C0DdAA33C660010dE76b842A54b613156B4",
      startBlock: START_BLOCK,
    },
    CrewRegistry: {
      chain: "celo",
      abi: crewRegistryAbi,
      address: "0x73F0770aea05298579252dFf193df0454C0B5A8a",
      startBlock: START_BLOCK,
    },
  },
});
