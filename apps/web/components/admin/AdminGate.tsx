"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { isAdminWallet } from "@/lib/admin-allowlist";

export function AdminGate({ children }: { children: ReactNode }) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets[0];

  if (!ready) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="w-full max-w-md rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-sm">
          <h1 className="font-headline text-primary text-2xl font-extrabold tracking-tight">
            Admin Console
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Sign in with an authorized wallet to continue.
          </p>
          <button
            type="button"
            onClick={() => login({ loginMethods: ["email"] })}
            className="bg-primary text-on-primary mt-6 w-full rounded-md py-2.5 text-sm font-semibold transition-colors hover:bg-primary-container"
          >
            Sign in
          </button>
          <Link
            href="/"
            className="text-secondary mt-4 block text-center text-sm font-semibold hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!wallet?.address) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-on-surface-variant max-w-md text-center text-sm">
          No Solana wallet connected. Complete wallet setup after signing in.
        </p>
        <Link
          href="/"
          className="text-secondary text-sm font-semibold hover:underline"
        >
          Back to home
        </Link>
      </div>
    );
  }

  if (!isAdminWallet(wallet.address)) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="w-full max-w-md rounded-xl border border-error/20 bg-error-container/10 p-8 text-center">
          <h1 className="font-headline text-primary text-xl font-bold">
            Access denied
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            This wallet is not authorized for the admin console.
          </p>
          <Link
            href="/"
            className="text-secondary mt-6 inline-block text-sm font-semibold hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
