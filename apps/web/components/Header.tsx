"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { isAdminWallet } from "@/lib/admin-allowlist";

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

const menuItemClass =
  "text-primary block w-full px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-slate-800";

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const solanaWallet = wallets[0];
  const menuId = useId();
  const buttonId = useId();

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready) {
    return null;
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="text-primary inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/90 px-4 py-2 text-sm font-bold shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-zinc-200 dark:hover:bg-slate-800"
      >
        Account
        <span
          className="material-symbols-outlined text-lg leading-none"
          aria-hidden
        >
          expand_more
        </span>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          className="border-outline-variant/20 absolute right-0 z-60 mt-1 min-w-56 overflow-hidden rounded-lg border bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
        >
          {authenticated ? (
            <>
              {solanaWallet && (
                <div
                  className="border-outline-variant/20 border-b px-4 py-2 font-mono text-xs text-zinc-500 dark:text-zinc-400"
                  title={solanaWallet.address}
                >
                  {truncateAddress(solanaWallet.address)}
                </div>
              )}
              <Link
                href="/wallet"
                role="menuitem"
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/create"
                role="menuitem"
                className={menuItemClass}
                onClick={() => setOpen(false)}
              >
                List project
              </Link>
              {isAdminWallet(solanaWallet?.address) && (
                <Link
                  href="/admin"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => setOpen(false)}
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={menuItemClass}
              onClick={() => {
                setOpen(false);
                login({ loginMethods: ["email"] });
              }}
            >
              Sign in
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const hasMounted = useHasMounted();

  const isExplore = pathname === "/explore";
  const isBuilders = pathname === "/builders" || pathname?.startsWith("/builders/");

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const showAccount = hasMounted;

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
          
        <Link href="/" className={pathname === "/" ? navLinkActive : navLink}>
            Home
          </Link><Link
            href="/explore"
            className={isExplore ? navLinkActive : navLink}
          >
            Marketplace
          </Link>
          <Link
            href="/builders"
            className={isBuilders ? navLinkActive : navLink}
          >
            Builders
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {showAccount && <AccountMenu />}
        </div>
      </nav>
    </header>
  );
}
