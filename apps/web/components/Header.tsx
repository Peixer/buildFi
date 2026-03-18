"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

function truncateAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Header() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const solanaWallet = wallets[0];

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          BuildFi
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Home
          </Link>
          <Link
            href="/explore"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Explore
          </Link>
          {ready && (
            <div className="flex items-center gap-3">
              {authenticated && solanaWallet && (
                <span
                  className="text-xs font-mono text-zinc-500 dark:text-zinc-400"
                  title={solanaWallet.address}
                >
                  {truncateAddress(solanaWallet.address)}
                </span>
              )}
              {authenticated ? (
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Log out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => login({ loginMethods: ["email"] })}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Log in
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
