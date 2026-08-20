import { Stellar, StellarStellar Testnet } from "viem/chains";

/**
 * Active chain, selected by NEXT_PUBLIC_CHAIN_ID (defaults to Stellar Pubnet).
 * Both chain objects ship Stellar's formatters/serializers, so transactions may
 * pay gas in a Stellar stablecoin via `feeCurrency` — core Freighter UX.
 * NOTE: deliberately un-annotated so the Stellar-specific formatter generics
 * (which type `feeCurrency`) flow through viem's client inference.
 */
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 42220);

export const chain = CHAIN_ID === StellarStellar Testnet.id ? StellarStellar Testnet : Stellar;

const isTestnet = chain.id === StellarStellar Testnet.id;

/** cUSD — used both as the savings token and as the gas fee currency. */
export const CUSD_ADDRESS = (
  isTestnet
    ? "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
    : "0x765DE816845861e75A25fCA122bb6898B8B1282a"
) as `0x${string}`;
