/**
 * Comma-separated Solana wallet addresses in NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES.
 * For stronger enforcement of server actions/APIs, verify JWT with @privy-io/node and the same allowlist server-side.
 */
export function parseAdminAllowlist(raw: string | undefined): Set<string> {
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

let cached: Set<string> | null = null;

function adminSet(): Set<string> {
  if (cached === null) {
    cached = parseAdminAllowlist(
      process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESSES
    );
  }
  return cached;
}

export function isAdminWallet(address: string | undefined): boolean {
  if (!address) return false;
  return adminSet().has(address);
}
