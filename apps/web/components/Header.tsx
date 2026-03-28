"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

function truncateAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

const navLink =
  "text-slate-600 transition-colors hover:bg-slate-100/50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white";

const navLinkActive =
  "border-b-2 border-[#14696d] pb-1 text-[#14696d] dark:border-secondary dark:text-secondary-fixed";

export function Header() {
  const pathname = usePathname();
  const hasMounted = useHasMounted();
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const solanaWallet = wallets[0];

  const showAuth = hasMounted && ready;

  const isExplore = pathname === "/explore";

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-transparent bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
      <nav className="mx-auto flex w-full max-w-[1920px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="font-headline text-primary shrink-0 text-xl font-black tracking-tighter sm:text-2xl dark:text-white"
        >
          BuildFi
        </Link>
        <div className="order-3 flex min-w-0 max-w-full flex-1 basis-full items-center justify-center gap-4 overflow-x-auto pb-1 text-xs font-bold tracking-tight sm:order-0 sm:max-w-none sm:basis-auto sm:gap-8 sm:pb-0 sm:text-sm md:justify-center">
          <Link
            href="/explore"
            className={isExplore ? navLinkActive : navLink}
          >
            Marketplace
          </Link>
          <Link href="/" className={pathname === "/" ? navLinkActive : navLink}>
            Home
          </Link>
          <Link
            href="/create"
            className={pathname === "/create" ? navLinkActive : navLink}
          >
            Create
          </Link>
          <Link
            href="/wallet"
            className={pathname === "/wallet" ? navLinkActive : navLink}
          >
            Wallet
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {showAuth && authenticated && solanaWallet && (
            <span
              className="hidden font-mono text-xs text-zinc-500 sm:inline dark:text-zinc-400"
              title={solanaWallet.address}
            >
              {truncateAddress(solanaWallet.address)}
            </span>
          )}
          {showAuth && (
            <>
              {authenticated ? (
                <button
                  type="button"
                  onClick={logout}
                  className="text-primary rounded-lg px-4 py-2 text-sm font-bold transition-all hover:bg-surface-container-low dark:text-zinc-200"
                >
                  Log out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => login({ loginMethods: ["email"] })}
                  className="text-primary rounded-lg px-4 py-2 text-sm font-bold transition-all hover:bg-surface-container-low dark:text-zinc-200"
                >
                  Sign in
                </button>
              )}
            </>
          )}
          <Link
            href="/create"
            className="bg-primary rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-container active:scale-95"
          >
            List a project
          </Link>
        </div>
      </nav>
    </header>
  );
}
