import { celo, celoAlfajores } from "viem/chains";

/**
 * Active chain, selected by NEXT_PUBLIC_CHAIN_ID (defaults to Celo mainnet).
 * Both chain objects ship Celo's formatters/serializers, so transactions may
 * pay gas in a Mento stablecoin via `feeCurrency` — core MiniPay UX.
 * NOTE: deliberately un-annotated so the Celo-specific formatter generics
 * (which type `feeCurrency`) flow through viem's client inference.
 */
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 42220);

export const chain = CHAIN_ID === celoAlfajores.id ? celoAlfajores : celo;

export const isTestnet = chain.id === celoAlfajores.id;

/** cUSD — used both as the savings token and as the gas fee currency. */
export const CUSD_ADDRESS = (
  isTestnet
    ? "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
    : "0x765DE816845861e75A25fCA122bb6898B8B1282a"
) as `0x${string}`;
