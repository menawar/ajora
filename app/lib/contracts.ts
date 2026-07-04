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
      "0x0A0354bA400191Ad323fF73581468601c3821C16",
    ),
    abi: potVaultAbi,
  },
  streakSBT: {
    address: addr(
      process.env.NEXT_PUBLIC_STREAKSBT_ADDRESS,
      "0x8442Df756f1f3c55B2e9CCbA53FD85Ea17ef13DF",
    ),
    abi: streakSBTAbi,
  },
  sprayFaucet: {
    address: addr(
      process.env.NEXT_PUBLIC_SPRAYFAUCET_ADDRESS,
      "0xc602Db6844855E487ff6fCBe8126d715dB1B3650",
    ),
    abi: sprayFaucetAbi,
  },
  drawManager: {
    address: addr(
      process.env.NEXT_PUBLIC_DRAWMANAGER_ADDRESS,
      "0x405795B9F0Fc0701D62B83fE53062435BF357A23",
    ),
    abi: drawManagerAbi,
  },
  cusd: { address: CUSD_ADDRESS, abi: erc20Abi },
} as const;
