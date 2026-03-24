"use client";

import { SOLANA_RPC_URL, SOLANA_RPC_URL_SUBSCRIPTIONS } from "@/lib/constants";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-zinc-600 dark:text-zinc-400">
        Missing NEXT_PUBLIC_PRIVY_APP_ID. Add it to .env.local.
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email"],
        appearance: {
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "all-users",
          },
        },
        solana: {
          rpcs: {
            "solana:devnet": {
              rpc: createSolanaRpc(SOLANA_RPC_URL),
              rpcSubscriptions: createSolanaRpcSubscriptions(
                SOLANA_RPC_URL_SUBSCRIPTIONS
              ),
            },
          },
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
