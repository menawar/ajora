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
 * (contracts/deployments/celo-mainnet.json — core_v5, deployed 2026-07-07).
 */
export const contracts = {
  potVault: {
    address: addr(
      process.env.NEXT_PUBLIC_POTVAULT_ADDRESS,
      "0x0A9f549C0Fc859b0925c7dcB5F8A55d4020c1415",
    ),
    abi: potVaultAbi,
  },
  streakSBT: {
    address: addr(
      process.env.NEXT_PUBLIC_STREAKSBT_ADDRESS,
      "0x9aC488Bc0Ba3cF7F2552c61d6F9BbA949961d974",
    ),
    abi: streakSBTAbi,
  },
  sprayFaucet: {
    address: addr(
      process.env.NEXT_PUBLIC_SPRAYFAUCET_ADDRESS,
      "0x117cEa08fD62220506FD7621C548a627373B2DFc",
    ),
    abi: sprayFaucetAbi,
  },
  drawManager: {
    address: addr(
      process.env.NEXT_PUBLIC_DRAWMANAGER_ADDRESS,
      "0xacB78C0DdAA33C660010dE76b842A54b613156B4",
    ),
    abi: drawManagerAbi,
  },
  cusd: { address: CUSD_ADDRESS, abi: erc20Abi },
  crewRegistry: {
    // Live on mainnet since core_v5 (2026-07-07); crews are enabled by default.
    address: addr(
      process.env.NEXT_PUBLIC_CREWREGISTRY_ADDRESS,
      "0x73F0770aea05298579252dFf193df0454C0B5A8a",
    ),
    abi: crewRegistryAbi,
  },
} as const;

/** Crew features light up once the registry address is configured. */
export const crewsEnabled =
  (contracts.crewRegistry.address as string) !== "0x0000000000000000000000000000000000000000";
