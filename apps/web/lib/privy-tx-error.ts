/**
 * Privy throws this when the user lacks SOL for fees and the in-app funding UI
 * cannot open because funding is not configured in the Privy Dashboard.
 */
const PRIVY_FUNDING_DISABLED = "Wallet funding is not enabled";

export function formatPrivyTransactionError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes(PRIVY_FUNDING_DISABLED)) {
    return [
      "This wallet needs SOL to pay Solana network fees.",
      "Fix: send devnet SOL to your wallet address (e.g. solana airdrop or the public devnet faucet),",
      "or enable Account funding for your app in the Privy Dashboard so users can top up from the UI.",
    ].join(" ");
  }
  return message;
}
