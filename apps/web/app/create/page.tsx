"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { Connection, PublicKey } from "@solana/web3.js";
import { getProgram } from "@/lib/program";
import {
  buildCreateProjectTx,
  type CreateProjectParams,
} from "@/lib/build-create-project-tx";
import { PRIVY_SOLANA_CHAIN, SOLANA_RPC_URL, USDC_MINT } from "@/lib/constants";
import { formatPrivyTransactionError } from "@/lib/privy-tx-error";

const MAX_NAME_LEN = 64;
const MAX_DESCRIPTION_LEN = 256;
const MAX_MILESTONES = 10;
const USDC_DECIMALS = 6;

export default function CreatePage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fundingTargetUsdc, setFundingTargetUsdc] = useState("");
  const [milestones, setMilestones] = useState<Array<{ name: string; percentage: string }>>([
    { name: "", percentage: "50" },
    { name: "", percentage: "50" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addMilestone = () => {
    if (milestones.length >= MAX_MILESTONES) return;
    setMilestones((m) => [...m, { name: "", percentage: "" }]);
  };

  const removeMilestone = (i: number) => {
    if (milestones.length <= 1) return;
    setMilestones((m) => m.filter((_, j) => j !== i));
  };

  const updateMilestone = (i: number, field: "name" | "percentage", value: string) => {
    setMilestones((m) =>
      m.map((x, j) => (j === i ? { ...x, [field]: value } : x))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!authenticated || !wallets[0]) {
      setError("Please connect your wallet.");
      return;
    }
    if (!USDC_MINT) {
      setError("NEXT_PUBLIC_USDC_MINT is not set. Configure it for your network.");
      return;
    }
    if (name.length > MAX_NAME_LEN) {
      setError(`Name must be at most ${MAX_NAME_LEN} characters.`);
      return;
    }
    if (description.length > MAX_DESCRIPTION_LEN) {
      setError(`Description must be at most ${MAX_DESCRIPTION_LEN} characters.`);
      return;
    }
    const percentages = milestones.map((m) => parseInt(m.percentage, 10));
    if (percentages.some((p) => isNaN(p) || p <= 0)) {
      setError("Each milestone must have a positive percentage.");
      return;
    }
    const sum = percentages.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      setError("Milestone percentages must sum to 100.");
      return;
    }
    const fundingTarget = parseFloat(fundingTargetUsdc);
    if (isNaN(fundingTarget) || fundingTarget <= 0) {
      setError("Funding target must be a positive number (USDC).");
      return;
    }
    const fundingTargetLamports = Math.round(fundingTarget * 10 ** USDC_DECIMALS);

    setSubmitting(true);
    try {
      const connection = new Connection(SOLANA_RPC_URL);
      const program = getProgram(connection);
      const owner = new PublicKey(wallets[0].address);
      const usdcMint = new PublicKey(USDC_MINT);

      const params: CreateProjectParams = {
        name: name.trim(),
        description: description.trim(),
        fundingTargetLamports,
        milestones: milestones.map((m) => ({
          name: m.name.trim() || "Milestone",
          percentage: parseInt(m.percentage, 10),
        })),
      };

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      const { tx, projectKp, participationMintKp } = await buildCreateProjectTx(
        program,
        owner,
        usdcMint,
        params,
        blockhash
      );  

      const serialized = tx.serialize();
      await signAndSendTransaction({
        transaction: serialized,
        wallet: wallets[0],
        chain: PRIVY_SOLANA_CHAIN,
      });

      const projectAddress = projectKp.publicKey.toBase58();
      router.push(`/project/${projectAddress}`);
    } catch (err) { 
      setError(formatPrivyTransactionError(err) || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="text-zinc-600 dark:text-zinc-400">
            You need to log in to create a project.
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
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create project
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Add a new construction project to BuildFi. You will be the owner.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Project name
            </label>
            <input
              id="name"
              type="text"
              maxLength={MAX_NAME_LEN}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500">{name.length}/{MAX_NAME_LEN}</p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              maxLength={MAX_DESCRIPTION_LEN}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500">{description.length}/{MAX_DESCRIPTION_LEN}</p>
          </div>

          <div>
            <label htmlFor="funding" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Funding target (USDC)
            </label>
            <input
              id="funding"
              type="number"
              min="1"
              step="any"
              value={fundingTargetUsdc}
              onChange={(e) => setFundingTargetUsdc(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Milestones (percentages must sum to 100)
              </label>
              {milestones.length < MAX_MILESTONES && (
                <button
                  type="button"
                  onClick={addMilestone}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Add milestone
                </button>
              )}
            </div>
            <ul className="mt-2 space-y-3">
              {milestones.map((m, i) => (
                <li key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Milestone name"
                    value={m.name}
                    onChange={(e) => updateMilestone(i, "name", e.target.value)}
                    className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="%"
                    value={m.percentage}
                    onChange={(e) => updateMilestone(i, "percentage", e.target.value)}
                    className="w-20 rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <span className="text-zinc-500">%</span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(i)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      aria-label="Remove milestone"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {submitting ? "Creating…" : "Create project"}
            </button>
            <Link
              href="/explore"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
