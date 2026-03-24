"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { PublicKey } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import {
  fetchProjectsByOwner,
  fetchBuyersByUser,
  fetchProject,
  type BuyerWithProject,
} from "@/lib/program";
import { SOLANA_RPC_URL } from "@/lib/constants";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/ProjectCard";

const USDC_DECIMALS = 6;

function formatAmount(value: number): string {
  const usdc = value / 10 ** USDC_DECIMALS;
  if (usdc >= 1_000_000) return `${(usdc / 1_000_000).toFixed(1)}M`;
  if (usdc >= 1_000) return `${(usdc / 1_000).toFixed(1)}K`;
  return usdc.toLocaleString();
}

export function WalletView() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [owned, setOwned] = useState<Project[]>([]);
  const [backed, setBacked] = useState<BuyerWithProject[]>([]);
  const [projectsBacked, setProjectsBacked] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wallet = wallets[0];

  useEffect(() => {
    if (!ready || !wallet) {
      setLoading(false);
      setOwned([]);
      setBacked([]);
      setProjectsBacked([]);
      return;
    } 
    const conn = new Connection(SOLANA_RPC_URL);
    console.log("wallet.address", wallet.address);
    const ownerPk = new PublicKey(wallet.address);
    setLoading(true);
    setError(null);
    Promise.all([
      fetchProjectsByOwner(ownerPk, conn),
      fetchBuyersByUser(ownerPk, conn),
    ])
      .then(async ([ownedProjects, buyerList]) => {
        setOwned(ownedProjects);
        setBacked(buyerList);
        const projects = await Promise.all(
          buyerList.map((b) => fetchProject(b.projectPubkey, conn))
        );
        setProjectsBacked(projects.filter((p): p is Project => p !== null));
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load wallet data.");
        setOwned([]);
        setBacked([]);
        setProjectsBacked([]);
      })
      .finally(() => setLoading(false));
  }, [ready, wallet?.address]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <main className="mx-auto max-w-2xl px-4 py-12">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            My wallet
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Log in to see your projects and backed projects.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 dark:text-zinc-50 hover:underline"
          >
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          My wallet
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Projects you created and projects you have backed.
        </p>

        {error && (
          <div
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading && (
          <p className="mt-8 text-zinc-500 dark:text-zinc-400">Loading…</p>
        )}

        {!loading && (
          <div className="mt-8 space-y-12">
            <section>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Projects I created
              </h2>
              {owned.length === 0 ? (
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                  You have not created any projects yet.{" "}
                  <Link href="/create" className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                    Create one
                  </Link>
                </p>
              ) : (
                <ul className="mt-4 grid gap-6 sm:grid-cols-1">
                  {owned.map((project) => (
                    <li key={project.id}>
                      <ProjectCard project={project} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Projects I have backed
              </h2>
              {projectsBacked.length === 0 ? (
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                  You have not backed any projects yet.{" "}
                  <Link href="/explore" className="font-medium text-zinc-900 dark:text-zinc-50 hover:underline">
                    Explore projects
                  </Link>
                </p>
              ) : (
                <ul className="mt-4 grid gap-6 sm:grid-cols-1">
                  {projectsBacked.map((project) => {
                    const b = backed.find((x) => x.projectPubkey === project.id);
                    const amount = b?.buyerAccount?.amount
                      ? Number(b.buyerAccount.amount.toString())
                      : 0;
                    return (
                      <li key={project.id} className="relative">
                        <ProjectCard project={project} />
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                          Your deposit: {formatAmount(amount)} USDC
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
