import { potVaultAbi } from "./abi/potVaultAbi";
import { streakSBTAbi } from "./abi/streakSBTAbi";
import { sprayFaucetAbi } from "./abi/sprayFaucetAbi";
import { drawManagerAbi } from "./abi/drawManagerAbi";
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
      "0x682F385c3034c42C94ad0e394B825348C518FA37",
    ),
    abi: potVaultAbi,
  },
  streakSBT: {
    address: addr(
      process.env.NEXT_PUBLIC_STREAKSBT_ADDRESS,
      "0x4f2f814277a252f97FeCa7355CDC8d062338BC7d",
    ),
    abi: streakSBTAbi,
  },
  sprayFaucet: {
    address: addr(
      process.env.NEXT_PUBLIC_SPRAYFAUCET_ADDRESS,
      "0xF9A41E3c295D533C64f61CC5e3385Ba00a6B32Cb",
    ),
    abi: sprayFaucetAbi,
  },
  drawManager: {
    address: addr(
      process.env.NEXT_PUBLIC_DRAWMANAGER_ADDRESS,
      "0xfBCbE3FbE29F516077d773fd4B0F356F914F4A51",
    ),
    abi: drawManagerAbi,
  },
  cusd: { address: CUSD_ADDRESS, abi: erc20Abi },
} as const;
