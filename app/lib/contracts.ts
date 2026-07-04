import { potVaultAbi } from "./abi/potVaultAbi";
import { streakSBTAbi } from "./abi/streakSBTAbi";
import { sprayFaucetAbi } from "./abi/sprayFaucetAbi";
import { drawManagerAbi } from "./abi/drawManagerAbi";
import { crewRegistryAbi } from "./abi/crewRegistryAbi";
import { erc20Abi } from "./abi/erc20Abi";
import { CUSD_ADDRESS } from "./chain";

type Address = `0x${string}`;

const addr = (env: string | undefined, fallback: Address): Address =>
  (env && env.startsWith("0x") ? (env as Address) : fallback);

/**
 * Deployed addresses — env-overridable, defaulting to the live Celo mainnet core
 * (contracts/deployments/celo-mainnet.json, Sourcify-verified).
 */
export const contracts = {
  potVault: {
    address: addr(
      process.env.NEXT_PUBLIC_POTVAULT_ADDRESS,
      "0x6B8617f4B6BfA6752802e883136C18720294497f",
    ),
    abi: potVaultAbi,
  },
  streakSBT: {
    address: addr(
      process.env.NEXT_PUBLIC_STREAKSBT_ADDRESS,
      "0x2390CD7A18DEc4240617ED421671790f33E4d674",
    ),
    abi: streakSBTAbi,
  },
  sprayFaucet: {
    address: addr(
      process.env.NEXT_PUBLIC_SPRAYFAUCET_ADDRESS,
      "0xA0076cE2954227f62eE7A9a35dD62c56DE516f00",
    ),
    abi: sprayFaucetAbi,
  },
  drawManager: {
    address: addr(
      process.env.NEXT_PUBLIC_DRAWMANAGER_ADDRESS,
      "0x18E08293D58Fbf1E434671694879f24ef63e57a8",
    ),
    abi: drawManagerAbi,
  },
  cusd: { address: CUSD_ADDRESS, abi: erc20Abi },
  crewRegistry: {
    // No mainnet default yet: lands with the v4 completion (CompleteV4.s.sol).
    address: addr(
      process.env.NEXT_PUBLIC_CREWREGISTRY_ADDRESS,
      "0x0000000000000000000000000000000000000000",
    ),
    abi: crewRegistryAbi,
  },
} as const;

/** Crew features light up once the registry address is configured. */
export const crewsEnabled =
  (contracts.crewRegistry.address as string) !== "0x0000000000000000000000000000000000000000";
