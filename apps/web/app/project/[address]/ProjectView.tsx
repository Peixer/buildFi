"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallets, useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { getProgram } from "@/lib/program";
import {
  buildDeleteProjectTx,
  buildDepositTx,
  buildRefundTx,
  buyerPda,
  projectAuthorityPda,
} from "@/lib/build-project-tx";
import { PRIVY_SOLANA_CHAIN, SOLANA_RPC_URL, USDC_MINT } from "@/lib/constants";
import { formatPrivyTransactionError } from "@/lib/privy-tx-error";
import type { Project } from "@/lib/types";

const USDC_DECIMALS = 6;

function formatFunding(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function ProjectView({
  project,
  vaultBalance,
}: {
  project: Project;
  vaultBalance: number;
}) {
  const router = useRouter();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const [buyAmount, setBuyAmount] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [buyerAmount, setBuyerAmount] = useState<number | null>(null);

  const wallet = wallets[0];
  const ownerAddress = project.owner;
  const isOwner = wallet && ownerAddress === wallet.address;
  const projectPk = new PublicKey(project.id);
  const vaultPk = new PublicKey(project.vault);
  const participationMintPk = new PublicKey(project.participation_mint);
  const canDelete = isOwner && vaultBalance === 0;
  const canRefund =
    !isOwner &&
    wallet &&
    project.released_milestone_count === 0 &&
    buyerAmount !== null &&
    buyerAmount > 0;

  useEffect(() => {
    if (!wallet || isOwner) return;
    const conn = new Connection(SOLANA_RPC_URL);
    const program = getProgram(conn);
    const userPk = new PublicKey(wallet.address);
    const pda = buyerPda(projectPk, userPk);
    program.account.buyer
      .fetchNullable(pda)
      .then((acc) => {
        if (acc && (acc as { amount: { toNumber?: () => number } }).amount)
          setBuyerAmount(
            (acc as { amount: { toNumber: () => number } }).amount.toNumber()
          );
        else setBuyerAmount(0);
      })
      .catch(() => setBuyerAmount(0));
  }, [wallet, isOwner, project.id]);

  const handleDelete = async () => {
    if (!wallet || !canDelete) return;
    setActionError(null);
    setLoading("delete");
    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const program = getProgram(connection);
      const owner = new PublicKey(wallet.address);
      const projectAuthority = projectAuthorityPda(projectPk);
      const tx = await buildDeleteProjectTx(
        program,
        owner,
        projectPk,
        projectAuthority,
        vaultPk,
        participationMintPk
      );
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      tx.feePayer = owner;
      tx.recentBlockhash = blockhash;
      const serialized = tx.serialize({ requireAllSignatures: false });
      await signAndSendTransaction({
        transaction: new Uint8Array(serialized),
        wallet,
        chain: PRIVY_SOLANA_CHAIN,
      });
      router.push("/wallet");
    } catch (err) {
      setActionError(formatPrivyTransactionError(err) || "Delete failed.");
    } finally {
      setLoading(null);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !USDC_MINT) return;
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0) {
      setActionError("Enter a valid USDC amount.");
      return;
    }
    const amountLamports = Math.round(amount * 10 ** USDC_DECIMALS);
    setActionError(null);
    setLoading("deposit");
    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const program = getProgram(connection);
      const buyer = new PublicKey(wallet.address);
      const usdcMint = new PublicKey(USDC_MINT);
      const buyerUsdcAta = getAssociatedTokenAddressSync(usdcMint, buyer, false);
      const buyerParticipationAta = getAssociatedTokenAddressSync(
        participationMintPk,
        buyer,
        false
      );
      const usdcInfo = await connection.getAccountInfo(buyerUsdcAta);
      const partInfo = await connection.getAccountInfo(buyerParticipationAta);
      const createUsdc = !usdcInfo;
      const createPart = !partInfo;
      const { tx } = await buildDepositTx(
        program,
        buyer,
        projectPk,
        vaultPk,
        participationMintPk,
        usdcMint,
        amountLamports,
        { createBuyerUsdcAta: createUsdc, createBuyerParticipationAta: createPart }
      );
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      tx.feePayer = buyer;
      tx.recentBlockhash = blockhash;
      const serialized = tx.serialize({ requireAllSignatures: false });
      await signAndSendTransaction({
        transaction: new Uint8Array(serialized),
        wallet,
        chain: PRIVY_SOLANA_CHAIN,
      });
      setBuyAmount("");
      router.refresh();
      if (buyerAmount !== null) setBuyerAmount(buyerAmount + amountLamports);
    } catch (err) {
      setActionError(formatPrivyTransactionError(err) || "Deposit failed.");
    } finally {
      setLoading(null);
    }
  };

  const handleRefund = async () => {
    if (!wallet || !canRefund || buyerAmount === null || !USDC_MINT) return;
    setActionError(null);
    setLoading("refund");
    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const program = getProgram(connection);
      const buyer = new PublicKey(wallet.address);
      const buyerAccountPda = buyerPda(projectPk, buyer);
      const projectAuthority = projectAuthorityPda(projectPk);
      const usdcMint = new PublicKey(USDC_MINT);
      const buyerUsdcAta = getAssociatedTokenAddressSync(
        usdcMint,
        buyer,
        false
      );
      const buyerParticipationAta = getAssociatedTokenAddressSync(
        participationMintPk,
        buyer,
        false
      );
      const tx = await buildRefundTx(
        program,
        buyer,
        buyerAccountPda,
        projectPk,
        projectAuthority,
        vaultPk,
        buyerUsdcAta,
        buyerParticipationAta,
        participationMintPk,
        usdcMint
      );
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      tx.feePayer = buyer;
      tx.recentBlockhash = blockhash;
      const serialized = tx.serialize({ requireAllSignatures: false });
      await signAndSendTransaction({
        transaction: new Uint8Array(serialized),
        wallet,
        chain: PRIVY_SOLANA_CHAIN,
      });
      setBuyerAmount(0);
      router.refresh();
    } catch (err) {
      setActionError(formatPrivyTransactionError(err) || "Refund failed.");
    } finally {
      setLoading(null);
    }
  };

  const vaultBalanceUsdc = vaultBalance / 10 ** USDC_DECIMALS;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link
          href="/explore"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Back to Explore
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {project.name}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {project.description}
        </p>
        <dl className="mt-6 space-y-2 text-sm">
          <div>
            <dt className="text-zinc-500">Funding target</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatFunding(project.funding_target / 10 ** USDC_DECIMALS)} USDC
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Vault balance</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {vaultBalanceUsdc.toLocaleString()} USDC
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Milestones released</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">
              {project.released_milestone_count} / {project.milestone_count}
            </dd>
          </div>
          {project.milestones.length > 0 && (
            <div>
              <dt className="text-zinc-500">Milestones</dt>
              <dd className="mt-1">
                <ul className="list-inside list-disc space-y-0.5 text-zinc-700 dark:text-zinc-300">
                  {project.milestones.map((m, i) => (
                    <li key={i}>
                      {m.name} ({m.percentage}%)
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>

        {actionError && (
          <div
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {wallet && (
          <div className="mt-8 space-y-6">
            {isOwner && (
              <section>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Owner actions
                </h2>
                {vaultBalance > 0 && (
                  <p className="mt-1 text-sm text-zinc-500">
                    Empty the vault (refund or release all capital) before you can delete the project.
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!canDelete || loading !== null}
                  className="mt-2 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-900/50"
                >
                  {loading === "delete" ? "Deleting…" : "Delete project"}
                </button>
              </section>
            )}

            {!isOwner && (
              <section>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Buy (deposit USDC)
                </h2>
                {!USDC_MINT ? (
                  <p className="mt-1 text-sm text-zinc-500">
                    USDC mint not configured. Set NEXT_PUBLIC_USDC_MINT.
                  </p>
                ) : (
                  <form onSubmit={handleDeposit} className="mt-2 flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Amount (USDC)"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <button
                      type="submit"
                      disabled={loading !== null}
                      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {loading === "deposit" ? "Depositing…" : "Deposit"}
                    </button>
                  </form>
                )}
                {canRefund && (
                  <div className="mt-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      You have {(buyerAmount ?? 0) / 10 ** USDC_DECIMALS} USDC in this project. Refund before any milestone is released.
                    </p>
                    <button
                      type="button"
                      onClick={handleRefund}
                      disabled={loading !== null}
                      className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50"
                    >
                      {loading === "refund" ? "Refunding…" : "Refund"}
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {!wallet && (
          <p className="mt-8 text-zinc-500 dark:text-zinc-400">
            Connect your wallet to buy or manage this project.
          </p>
        )}
      </main>
    </div>
  );
}
