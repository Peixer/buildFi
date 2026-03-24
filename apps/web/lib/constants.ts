/**
 * BuildFi program and chain constants.
 * Use plain env reads so server and client render the same (avoids hydration mismatch).
 */

export const BUILDFI_PROGRAM_ID =
  (process.env.NEXT_PUBLIC_BUILDFI_PROGRAM_ID as string | undefined) ??
  "BcZabTwE6GoE4YVZ4fyrxhhmCw3FNrLYvhyCAmcXckDj";

export const SOLANA_RPC_URL =
  (process.env.NEXT_PUBLIC_SOLANA_RPC_URL as string | undefined) ??
  "https://api.devnet.solana.com";

export const SOLANA_RPC_URL_SUBSCRIPTIONS =
  (process.env.NEXT_PUBLIC_SOLANA_RPC_URL_SUBSCRIPTIONS as string | undefined) ??
  "wss://api.devnet.solana.com";

/** Privy `useSignAndSendTransaction` / `useSignTransaction` chain id; must match `config.solana.rpcs` in Providers. */
export const PRIVY_SOLANA_CHAIN = "solana:devnet" as const;

export const USDC_MINT =
  (process.env.NEXT_PUBLIC_USDC_MINT as string | undefined) ?? "";
