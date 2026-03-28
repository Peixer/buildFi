"use client";

import { useState, useEffect, useMemo } from "react";
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
import { heroImageForProjectId, hashProjectId } from "@/lib/project-hero-images";
import type { Project } from "@/lib/types";

const USDC_DECIMALS = 6;

const RISK_RATINGS = ["A+", "A", "A-", "B+", "B"] as const;
const ASSET_CLASSES = [
  "Residential",
  "Commercial",
  "Mixed-use",
  "Infrastructure",
  "Industrial",
] as const;

const GALLERY_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCWgFXFVnFPR04pzyuB0rwEl1e2yM5m94GVynFt7jD7Nc3HhmnvhuV-JU4nBExmK1zg50__WqPeX1aEO369Q_ZI2irpbK9kmERi1rOLPLPGmu64EB781JqpoFW16zFI1OQ6V59yI8_EZ7FY_4c0C9_InOg6t1Lxtm9sSGzKlDbkq8S7VBme8nCZ8uSQwZVxsMeiOS-OeBeqizNv9MFvYjoW7CAsK8ERsI2-wl_V_EeHNYto601dHjWQuhXpyiZ8987uFYnot155aiRN",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAX5gxt8J9dmfixH7fb5laMWqNQjcE2bn6jf1NvZyzecnxWFNGqH81b_6PK9qCq_6a8zmAz08jPJMSiEPM1vF-6yFuHqJo7HrRV5HsNZNb1y2MyXIcPlz_obBLyjwdx1XmVNx8nhhetZnbgyBXQiGbxKZjkW4pjxrw0-jWAO7A59gHCKy-thR5DlCdaG3dmAz6-TvpZSu56GkxFRraJvxHxaZpCI0WjkpyU3wK8aYViEoHMA9DzLb8pKKFcggftxiQLdN55PTThIEu0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCv4uqN_bX_VkavXX6aPHhxptiYyOtIa7ggckx-iuqcS5x6PG5WnuhI-7imTBQ6H4EaF3ptjeqU8G7EMsyXwubdpt3nR3wE3HyS4jwlfkhegLdBJ6QS-Q-hMMr4OTjCf1vxo0HW6mYQoCW1QdKnciQaKLV30YVnmn-d9C93b_rFy32CyuL87ho_qQBUh8wTOXDAZhzS-w-TmoIaBEAqnaXb20YGnGaFQDUl-TAqXuA57PwCKuxSSIqyVDKQSDAETMHogAyvt0kCqkfy",
];

const PAST_PROJECTS: { title: string; meta: string; image: string }[] = [
  {
    title: "The Grand Central",
    meta: "Delivered 2022 • On-chain escrow",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCeYA3lJ7jbgGgIpa4Peq9KE8H4UMPZTuhyUphubwbqPGnaq-b0gFd9V6dOJp-EKCj9NQeM6HLAFJQk65VA_OXlLVMAYnrSHf1QgPDJejQAE_LkDSWH_RNeZ24iTqpmn1GCTb9kV4d4HR-x5MrH9rs6ANnxhywMeSjRfrQIwkk5XzbAFuAOwkaSYyGv3OcwIQ0xmTBLfQSORscYQH1-ZPpUmH4yF8gaNSlQ65P1JuKVY_71SZEoNHElvYG2XFmwb0h3UnxNksj8mO3S",
  },
  {
    title: "Hudson Yards South",
    meta: "Delivered 2021 • Milestone releases",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNWhGtfLCTsWPW-ENWC031PqyL2faZB7rVk3xSs8yPKrupCWmQOOntU2IaF9AQ8H6hWBd19JVXNRVQ7Ok09fJBfqSrrMg-5QDfXxA78sXPH8ZARipOzz5t1ksnqpCIqCA66yl4qVP17fg8HyiqE7Uq3eisJzO-YxtzoPHsQ23LJneILZhVfFoYZ3_W7WLLcnc7QzingDyXC5Eh9aXy7Sh9rO_FX_J4zg9zc5BMShLkbMFysikJTJdPhcqVCwmMjo9jUUXqaNvdNgKr",
  },
  {
    title: "The Chelsea Lofts",
    meta: "Delivered 2019 • USDC funded",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA7SWtUNILDcW4CTQT1uFUeIQNSdfgmWDOwOG7vSUsfXkuRpor-BbcjsIGEvkEsStzkjHcBe4bi9yBZZFAhzqnychSqFCLsE9u5FH3BpgKalZQEaJHOPF4vMkopfKBAH1JLRiut11bi8GhJzDcXe94z9nx4nBkzmaLK-_KY9PqfAV3M2ssJsRCk3__lFzNNTyBdH9ec8rkpsRMkrTJ47HNabFCOF6HXjENahpdpF66fUPPDP58jFqcnfKKY5g0V2ZrjMpX4j-_Sf16J",
  },
];

function formatUsd(raw: number): string {
  const usdc = raw / 10 ** USDC_DECIMALS;
  if (usdc >= 1_000_000) return `$${(usdc / 1_000_000).toFixed(1)}M`;
  if (usdc >= 1_000) return `$${(usdc / 1_000).toFixed(1)}K`;
  return `$${usdc.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function truncateOwner(owner: string): string {
  if (owner.length <= 14) return owner;
  return `${owner.slice(0, 6)}…${owner.slice(-4)}`;
}

function scrollToInvest() {
  document.getElementById("invest")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const projectPk = useMemo(() => new PublicKey(project.id), [project.id]);
  const vaultPk = useMemo(() => new PublicKey(project.vault), [project.vault]);
  const participationMintPk = useMemo(
    () => new PublicKey(project.participation_mint),
    [project.participation_mint]
  );
  const canDelete = isOwner && vaultBalance === 0;
  const canRefund =
    !isOwner &&
    wallet &&
    project.released_milestone_count === 0 &&
    buyerAmount !== null &&
    buyerAmount > 0;

  const h = hashProjectId(project.id);
  const riskRating = RISK_RATINGS[h % RISK_RATINGS.length];
  const assetClass = ASSET_CLASSES[h % ASSET_CLASSES.length];
  const heroImage = heroImageForProjectId(project.id);

  const targetRaw = project.funding_target;
  const fundingPct =
    targetRaw > 0 ? Math.min(100, Math.round((vaultBalance / targetRaw) * 100)) : 0;
  const remainingRaw = Math.max(0, targetRaw - vaultBalance);
  const raisedStr = formatUsd(vaultBalance);
  const goalStr = formatUsd(targetRaw);
  const remainingStr = formatUsd(remainingRaw);
  const shortId = `BF-${project.id.slice(0, 6).toUpperCase()}`;

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
  }, [wallet, isOwner, project.id, projectPk]);

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
      router.push("/explore");
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

  const descriptionParagraphs =
    project.description?.trim().split(/\n+/).filter(Boolean) ?? [];
  const thesisCopy = [
    {
      title: "Programmable escrow",
      body: "USDC sits in a project vault on Solana until milestones are released by the program—reducing counterparty risk for participants.",
    },
    {
      title: "Transparent milestones",
      body: `${project.milestone_count} milestone${project.milestone_count === 1 ? "" : "s"} define how capital unlocks over time, aligned with construction progress.`,
    },
    {
      title: "Participation tokens",
      body: "Depositors receive participation tokens representing their share, with rules enforced by the BuildFi program.",
    },
  ];

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      <main>
        {/* Hero */}
        <section className="relative h-[min(870px,92vh)] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={heroImage}
            className="h-full w-full object-cover"
          />
          <div className="hero-gradient absolute inset-0" />
          <div className="absolute bottom-0 left-0 flex w-full flex-col items-end justify-between gap-8 p-8 md:flex-row lg:p-24">
            <div className="max-w-2xl">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-sm bg-secondary-container px-3 py-1 font-headline text-xs font-bold tracking-widest text-on-secondary-container uppercase">
                  On-chain listing
                </span>
                <span className="text-xs font-bold tracking-widest text-on-primary/70 uppercase">
                  {shortId}
                </span>
              </div>
              <h1 className="mb-4 font-headline text-4xl font-extrabold tracking-tighter text-on-primary sm:text-5xl lg:text-7xl">
                {project.name || "Untitled project"}
              </h1>
              <div className="mb-8 flex items-center gap-2 text-on-primary/90">
                <span className="material-symbols-outlined text-secondary">hub</span>
                <span className="text-lg tracking-tight">Solana • {truncateOwner(project.owner)}</span>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={scrollToInvest}
                  className="flex items-center gap-3 rounded-md bg-secondary px-8 py-4 font-headline font-bold text-on-secondary transition-all hover:bg-on-secondary-container"
                >
                  Invest now
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <Link
                  href="/explore"
                  className="flex items-center gap-3 rounded-md border border-surface/20 bg-surface/10 px-8 py-4 font-headline font-bold text-on-primary backdrop-blur-md transition-all hover:bg-surface/20"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Back to marketplace
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="glass-card flex gap-12 rounded-xl border border-white/10 p-6">
                <div className="flex flex-col">
                  <span className="mb-1 text-xs font-bold text-primary/60 uppercase">
                    Risk rating
                  </span>
                  <span className="font-headline text-3xl font-extrabold text-primary">
                    {riskRating}
                  </span>
                </div>
                <div className="w-px bg-primary/10" />
                <div className="flex flex-col">
                  <span className="mb-1 text-xs font-bold text-primary/60 uppercase">
                    Asset class
                  </span>
                  <span className="font-headline text-3xl font-extrabold text-primary">
                    {assetClass}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investment snapshot */}
        <section className="bg-surface-container-low px-6 py-8 sm:px-12">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-1 bg-tertiary" />
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase">
                  Target (USDC)
                </p>
                <p className="font-headline text-2xl font-extrabold text-primary">
                  {goalStr}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-12 w-1 bg-tertiary" />
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase">
                  Milestones
                </p>
                <p className="font-headline text-2xl font-extrabold text-primary">
                  {project.milestone_count}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-12 w-1 bg-tertiary" />
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase">
                  Total goal
                </p>
                <p className="font-headline text-2xl font-extrabold text-primary">
                  {goalStr}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-12 w-1 bg-tertiary" />
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase">
                  Investment type
                </p>
                <p className="font-headline text-2xl font-extrabold text-primary">
                  USDC escrow
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Funding progress */}
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-12 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="mb-2 font-headline text-3xl font-extrabold text-primary sm:text-4xl">
                    Funding progress
                  </h2>
                  <p className="text-on-surface-variant">
                    Stablecoin participation remains open until the funding target is met.
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-headline text-4xl font-black text-primary sm:text-5xl">
                    {fundingPct}%
                  </span>
                  <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
                    Raised to date
                  </p>
                </div>
              </div>
              <div className="mb-8 h-4 w-full overflow-hidden rounded-full bg-surface-variant">
                <div
                  className="h-full rounded-full bg-linear-to-r from-secondary to-secondary-fixed-dim"
                  style={{ width: `${Math.min(100, Math.max(fundingPct, 2))}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="rounded-lg bg-surface-container-low p-6">
                  <p className="mb-1 font-headline text-2xl font-bold text-secondary">
                    {raisedStr}
                  </p>
                  <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
                    Total capital raised
                  </p>
                </div>
                <div className="rounded-lg bg-surface-container-low p-6">
                  <p className="mb-1 font-headline text-2xl font-bold text-tertiary">
                    {project.released_milestone_count} / {project.milestone_count}
                  </p>
                  <p className="text-xs font-bold tracking-widest text-on-surface-variant uppercase">
                    Milestones released
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
                <h3 className="mb-6 font-headline font-bold text-primary">
                  Capital stack breakdown
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-secondary" />
                      <span className="text-sm font-medium">Vault (raised)</span>
                    </div>
                    <span className="text-sm font-bold">{raisedStr}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span className="text-sm font-medium">Funding target</span>
                    </div>
                    <span className="text-sm font-bold">{goalStr}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-surface-variant" />
                      <span className="text-sm font-medium">Remaining allocation</span>
                    </div>
                    <span className="text-sm font-bold">{remainingStr}</span>
                  </div>
                </div>
                <Link
                  href="/wallet"
                  className="mt-8 block w-full rounded-md bg-primary py-4 text-center font-headline text-sm font-bold text-on-primary transition-all hover:bg-primary-container"
                >
                  View wallet &amp; positions
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Vision + thesis */}
        <section className="bg-surface-container-low px-6 py-16 sm:px-12 lg:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <h2 className="mb-8 border-l-4 border-secondary pl-6 font-headline text-3xl font-extrabold text-primary">
                Project overview
              </h2>
              <div className="space-y-6 text-lg leading-relaxed text-on-surface-variant">
                {descriptionParagraphs.length > 0 ? (
                  descriptionParagraphs.map((p, i) => <p key={i}>{p}</p>)
                ) : (
                  <p>No description provided for this listing yet.</p>
                )}
              </div>
              <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-6">
                {GALLERY_IMAGES.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    alt=""
                    src={src}
                    className="aspect-square rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
            <div className="self-start rounded-xl bg-surface-container-lowest p-8 shadow-lg sm:p-12">
              <h2 className="mb-8 font-headline text-3xl font-extrabold text-primary">
                Why this listing
              </h2>
              <ul className="space-y-8">
                {thesisCopy.map((item) => (
                  <li key={item.title} className="flex gap-6">
                    <span
                      className="material-symbols-outlined mt-1 text-tertiary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    <div>
                      <h4 className="font-headline text-xl font-bold text-primary">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-on-surface-variant">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Financial */}
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-12 lg:py-24">
          <h2 className="mb-12 font-headline text-3xl font-extrabold text-primary">
            Financial snapshot
          </h2>
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="border-t-2 border-primary bg-surface-container-lowest p-8 shadow-sm">
              <p className="mb-2 text-xs font-bold tracking-widest text-on-surface-variant uppercase">
                Funding target
              </p>
              <p className="font-headline text-3xl font-extrabold text-primary sm:text-4xl">
                {goalStr}
              </p>
            </div>
            <div className="border-t-2 border-secondary bg-surface-container-lowest p-8 shadow-sm">
              <p className="mb-2 text-xs font-bold tracking-widest text-on-surface-variant uppercase">
                Raised to date
              </p>
              <p className="font-headline text-3xl font-extrabold text-primary sm:text-4xl">
                {raisedStr}
              </p>
            </div>
            <div className="border-t-2 border-tertiary bg-surface-container-lowest p-8 shadow-sm">
              <p className="mb-2 text-xs font-bold tracking-widest text-on-surface-variant uppercase">
                Progress
              </p>
              <p className="font-headline text-3xl font-extrabold text-primary sm:text-4xl">
                {fundingPct}%
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="p-4 font-headline font-bold text-primary sm:p-6">
                    Milestone
                  </th>
                  <th className="p-4 font-headline font-bold text-primary sm:p-6">
                    Weight
                  </th>
                  <th className="p-4 font-headline font-bold text-primary sm:p-6">
                    Alloc. (approx.)
                  </th>
                  <th className="p-4 font-headline font-bold text-primary sm:p-6">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {project.milestones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-on-surface-variant">
                      No milestones configured for this project.
                    </td>
                  </tr>
                ) : (
                  project.milestones.map((m, i) => {
                    const allocationLamports =
                      targetRaw > 0
                        ? Math.round((m.percentage / 100) * targetRaw)
                        : 0;
                    let status: "released" | "in_progress" | "pending" = "pending";
                    if (i < project.released_milestone_count) status = "released";
                    else if (i === project.released_milestone_count)
                      status = "in_progress";
                    return (
                      <tr
                        key={`${m.name}-${i}`}
                        className="transition-colors hover:bg-surface-container-low"
                      >
                        <td className="p-4 font-medium sm:p-6">{m.name}</td>
                        <td className="p-4 text-on-surface-variant sm:p-6">
                          {m.percentage}%
                        </td>
                        <td className="p-4 font-bold text-secondary sm:p-6">
                          ~{formatUsd(allocationLamports)}
                        </td>
                        <td className="p-4 sm:p-6">
                          {status === "released" && (
                            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                              Released
                            </span>
                          )}
                          {status === "in_progress" && (
                            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                              In progress
                            </span>
                          )}
                          {status === "pending" && (
                            <span className="rounded-full bg-surface-variant px-3 py-1 text-xs font-bold text-on-surface-variant">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Builder */}
        <section className="bg-[#191c1d] px-6 py-16 text-on-primary sm:px-12 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 flex flex-col items-start justify-between gap-12 md:flex-row">
              <div className="max-w-xl">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white p-2">
                    <span
                      className="material-symbols-outlined text-4xl text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      domain
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline text-3xl font-extrabold tracking-tight">
                      Builder wallet
                    </h3>
                    <div className="flex items-center gap-2 text-secondary-fixed">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span className="text-xs font-bold tracking-widest uppercase">
                        On-chain owner
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mb-8 text-lg leading-relaxed text-on-primary/70">
                  This project is owned by{" "}
                  <span className="font-mono text-sm text-on-primary/90">{project.owner}</span>.
                  Milestone releases and vault flows are enforced by the BuildFi program on Solana.
                </p>
                <div className="flex gap-12">
                  <div>
                    <p className="font-headline text-3xl font-black">
                      {project.milestone_count}
                    </p>
                    <p className="text-xs font-bold tracking-widest text-on-primary/50 uppercase">
                      Milestones
                    </p>
                  </div>
                  <div>
                    <p className="font-headline text-3xl font-black">
                      {project.released_milestone_count}
                    </p>
                    <p className="text-xs font-bold tracking-widest text-on-primary/50 uppercase">
                      Released
                    </p>
                  </div>
                  <div>
                    <p className="font-headline text-3xl font-black">Solana</p>
                    <p className="text-xs font-bold tracking-widest text-on-primary/50 uppercase">
                      Network
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="mb-8 font-headline text-xs font-bold tracking-widest text-on-primary/50 uppercase">
                  Illustrative past projects
                </h4>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {PAST_PROJECTS.map((pp) => (
                    <div key={pp.title} className="group cursor-default">
                      <div className="relative mb-3 h-48 overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt=""
                          src={pp.image}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <p className="text-sm font-bold">{pp.title}</p>
                      <p className="text-xs text-on-primary/60">{pp.meta}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Documents + trust */}
        <section className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-16 sm:px-12 lg:flex-row lg:gap-24 lg:py-24">
          <div className="lg:w-2/3">
            <h2 className="mb-8 flex items-center gap-4 font-headline text-3xl font-extrabold text-primary">
              Document vault
              <span className="material-symbols-outlined text-secondary">verified_user</span>
            </h2>
            <p className="mb-6 text-sm text-on-surface-variant">
              Prospectus and legal packs can be linked here as your marketplace matures. Placeholder
              rows below.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                { icon: "picture_as_pdf", title: "Full prospectus", meta: "PDF • coming soon" },
                { icon: "table_chart", title: "Milestone schedule", meta: "On-chain" },
                { icon: "gavel", title: "Program rules", meta: "Solana program" },
                { icon: "description", title: "Project address", meta: project.id.slice(0, 8) + "…" },
              ].map((doc) => (
                <div
                  key={doc.title}
                  className="group flex items-center justify-between rounded-lg border border-transparent bg-surface-container p-6 transition-all hover:border-secondary"
                >
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-3xl text-primary">
                      {doc.icon}
                    </span>
                    <div>
                      <p className="font-bold text-primary">{doc.title}</p>
                      <p className="text-xs text-on-surface-variant">{doc.meta}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant transition-colors group-hover:text-secondary">
                    download
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-8 lg:w-1/3">
            <div className="rounded-xl bg-surface-container-low p-8">
              <h4 className="mb-8 font-headline text-xs font-bold tracking-widest text-primary uppercase">
                Trust &amp; compliance
              </h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <span
                      className="material-symbols-outlined text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      policy
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">Non-custodial flows</p>
                    <p className="text-xs text-on-surface-variant">
                      Users sign transactions with their own wallets.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <span
                      className="material-symbols-outlined text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">Verified program</p>
                    <p className="text-xs text-on-surface-variant">
                      Escrow logic lives in audited program code on Solana.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <span
                      className="material-symbols-outlined text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      apartment
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">Milestone-gated</p>
                    <p className="text-xs text-on-surface-variant">
                      Capital moves when on-chain milestones allow it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Invest / wallet actions */}
        <section
          id="invest"
          className="border-t border-outline-variant/20 bg-surface-container-low px-6 py-16 sm:px-12"
        >
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-2 font-headline text-3xl font-extrabold text-primary">
              Participate
            </h2>
            <p className="mb-8 text-on-surface-variant">
              Deposit USDC into the project vault to receive participation tokens. Connect your
              wallet to continue.
            </p>

            {actionError && (
              <div
                className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
                role="alert"
              >
                {actionError}
              </div>
            )}

            {wallet && (
              <div className="space-y-8">
                {isOwner && (
                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
                    <h3 className="font-headline text-lg font-bold text-primary">Owner</h3>
                    {vaultBalance > 0 && (
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Empty the vault before you can delete this project.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={!canDelete || loading !== null}
                      className="mt-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-900/50"
                    >
                      {loading === "delete" ? "Deleting…" : "Delete project"}
                    </button>
                  </div>
                )}

                {!isOwner && (
                  <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6">
                    <h3 className="font-headline text-lg font-bold text-primary">
                      Deposit USDC
                    </h3>
                    {!USDC_MINT ? (
                      <p className="mt-1 text-sm text-on-surface-variant">
                        USDC mint not configured. Set NEXT_PUBLIC_USDC_MINT.
                      </p>
                    ) : (
                      <form onSubmit={handleDeposit} className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Amount (USDC)"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          className="min-w-0 flex-1 rounded-md border border-outline-variant bg-white px-3 py-2 text-on-surface dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        <button
                          type="submit"
                          disabled={loading !== null}
                          className="rounded-md bg-primary px-6 py-2 text-sm font-bold text-on-primary hover:bg-primary-container disabled:opacity-50"
                        >
                          {loading === "deposit" ? "Depositing…" : "Deposit"}
                        </button>
                      </form>
                    )}
                    {canRefund && (
                      <div className="mt-6 border-t border-outline-variant/20 pt-6">
                        <p className="text-sm text-on-surface-variant">
                          You have {(buyerAmount ?? 0) / 10 ** USDC_DECIMALS} USDC in this project.
                          Refund before any milestone is released.
                        </p>
                        <button
                          type="button"
                          onClick={handleRefund}
                          disabled={loading !== null}
                          className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                        >
                          {loading === "refund" ? "Refunding…" : "Refund"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!wallet && (
              <p className="text-on-surface-variant">
                Sign in with the header controls and connect a Solana wallet to deposit or refund.
              </p>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex w-full flex-col items-center justify-between gap-6 border-t border-[#40484c]/10 bg-[#f3f4f5] px-8 py-10 dark:bg-[#191c1d] md:flex-row">
          <div className="text-center md:text-left">
            <div className="mb-2 font-headline font-bold text-primary dark:text-[#f8f9fa]">
              BuildFi
            </div>
            <div className="text-xs tracking-widest text-[#40484c] uppercase dark:text-[#f3f4f5]">
              © {new Date().getFullYear()} BuildFi. Construction financing on Solana.
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 gap-y-2">
            <Link
              href="/explore"
              className="text-xs tracking-widest text-[#40484c] underline underline-offset-4 opacity-80 transition-opacity hover:text-[#14696d] hover:opacity-100 dark:text-[#f3f4f5]"
            >
              Marketplace
            </Link>
            <Link
              href="/wallet"
              className="text-xs tracking-widest text-[#40484c] underline underline-offset-4 opacity-80 transition-opacity hover:text-[#14696d] hover:opacity-100 dark:text-[#f3f4f5]"
            >
              Wallet
            </Link>
            <Link
              href="/create"
              className="text-xs tracking-widest text-[#40484c] underline underline-offset-4 opacity-80 transition-opacity hover:text-[#14696d] hover:opacity-100 dark:text-[#f3f4f5]"
            >
              List a project
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
