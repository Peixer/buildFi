/**
 * Types aligned with the BuildFi on-chain program (programs/buildfi).
 * Project account public key is used as project id in the UI.
 */

import type { PublicKey } from "@solana/web3.js";

/** Decoded milestone for display (name as string; on-chain name is 32 bytes). */
export interface Milestone {
  name: string;
  percentage: number;
  status: number;
  /** Unix seconds; 0 if unset */
  estimated_completion: number;
}

/** Project as returned from the program (camelCase from IDL). */
export interface ProjectAccount {
  owner: PublicKey;
  name: string;
  description: string;
  fundingTarget: { toString(): string };
  vault: PublicKey;
  participationMint: PublicKey;
  bump: number;
  milestoneCount: number;
  milestones: Array<{
    name: number[];
    percentage: number;
    status: number;
    estimatedCompletion: { toString(): string };
  }>;
  releasedMilestoneCount: number;
  stage: number;
  projectCode: string;
  imageUrl: string;
  locationName: string;
  geoLat: { toString(): string };
  geoLng: { toString(): string };
  totalCapitalRaised: { toString(): string };
  builder: PublicKey;
  vision: string;
  investmentThesis: string;
  programRulesUrl: string;
  projectDocsUrl: string;
  milestonesDocsUrl: string;
  durationDays: { toString(): string };
  riskLevel: number;
  targetReturnBps: number;
}

/** Project with publicKey as id for UI (and decoded milestones). */
export interface Project {
  id: string;
  name: string;
  description: string;
  funding_target: number;
  vault: string;
  owner: string;
  participation_mint: string;
  milestone_count: number;
  released_milestone_count: number;
  milestones: Milestone[];
  stage: number;
  project_code: string;
  image_url: string;
  location_name: string;
  geo_lat: number;
  geo_lng: number;
  total_capital_raised: number;
  builder: string;
  vision: string;
  investment_thesis: string;
  program_rules_url: string;
  project_docs_url: string;
  milestones_docs_url: string;
  duration_days: number;
  risk_level: number;
  target_return_bps: number;
}

/** Buyer account from chain. */
export interface BuyerAccount {
  user: PublicKey;
  project: PublicKey;
  amount: { toString(): string; toNumber?(): number };
}

/** Decode 32-byte milestone name to string. */
export function decodeMilestoneName(bytes: number[]): string {
  const buf = Buffer.from(bytes);
  const end = buf.indexOf(0);
  return (end >= 0 ? buf.subarray(0, end) : buf).toString("utf8").trim() || "Milestone";
}

/** Convert raw program project + publicKey to UI Project. */
export function toUiProject(
  publicKey: { toBase58(): string },
  account: ProjectAccount
): Project {
  const count = account.milestoneCount ?? 0;
  const milestones: Milestone[] = (account.milestones ?? [])
    .slice(0, count)
    .map((m) => ({
      name: decodeMilestoneName(m.name),
      percentage: m.percentage ?? 0,
      status: m.status ?? 0,
      estimated_completion: Number(m.estimatedCompletion?.toString?.() ?? 0),
    }));
  return {
    id: publicKey.toBase58(),
    name: account.name ?? "",
    description: account.description ?? "",
    funding_target: account.fundingTarget ? Number(account.fundingTarget.toString()) : 0,
    vault: account.vault?.toBase58?.() ?? "",
    owner: account.owner?.toBase58?.() ?? "",
    participation_mint: account.participationMint?.toBase58?.() ?? "",
    milestone_count: count,
    released_milestone_count: account.releasedMilestoneCount ?? 0,
    milestones,
    stage: account.stage ?? 0,
    project_code: account.projectCode ?? "",
    image_url: account.imageUrl ?? "",
    location_name: account.locationName ?? "",
    geo_lat: Number(account.geoLat?.toString?.() ?? 0),
    geo_lng: Number(account.geoLng?.toString?.() ?? 0),
    total_capital_raised: Number(account.totalCapitalRaised?.toString?.() ?? 0),
    builder: account.builder?.toBase58?.() ?? "",
    vision: account.vision ?? "",
    investment_thesis: account.investmentThesis ?? "",
    program_rules_url: account.programRulesUrl ?? "",
    project_docs_url: account.projectDocsUrl ?? "",
    milestones_docs_url: account.milestonesDocsUrl ?? "",
    duration_days: Number(account.durationDays?.toString?.() ?? 0),
    risk_level: account.riskLevel ?? 0,
    target_return_bps: account.targetReturnBps ?? 0,
  };
}
