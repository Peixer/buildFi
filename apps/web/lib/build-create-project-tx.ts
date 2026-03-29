/**
 * Build create_project transaction for the BuildFi program.
 * Uses VersionedTransaction so that when Privy adds the owner signature, it does not
 * clear the program keypair signatures (legacy Transaction.sign() has that bug).
 */

import type { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionMessage,
  VersionedTransaction,
  type Blockhash,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Idl } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_BUILDFI_PROGRAM_ID ?? "BcZabTwE6GoE4YVZ4fyrxhhmCw3FNrLYvhyCAmcXckDj"
);

export function projectAuthorityPda(projectPk: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("project_authority"), projectPk.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function builderPda(owner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("builder"), owner.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function vaultAddress(projectAuthority: PublicKey, usdcMint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    usdcMint,
    projectAuthority,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

/** Milestone for create_project: 32-byte name, percentage, status, estimatedCompletion (i64). */
export function encodeMilestone(
  name: string,
  percentage: number,
  status = 0,
  estimatedCompletion: BN = new BN(0)
): { name: number[]; percentage: number; status: number; estimatedCompletion: BN } {
  const nameBytes = Buffer.alloc(32);
  Buffer.from(name, "utf8").copy(nameBytes);
  return {
    name: Array.from(nameBytes),
    percentage,
    status,
    estimatedCompletion,
  };
}

export interface CreateProjectMilestoneInput {
  name: string;
  percentage: number;
  status?: number;
  /** Unix seconds; omit or 0 for unset */
  estimatedCompletion?: number;
}

export interface CreateProjectParams {
  name: string;
  description: string;
  fundingTargetLamports: number;
  milestones: CreateProjectMilestoneInput[];
  builderName: string;
  builderDescription: string;
  stage: number;
  projectCode: string;
  imageUrl: string;
  locationName: string;
  /** Microdegrees (degrees × 1_000_000), matches on-chain i64 */
  geoLat: string | number | BN;
  geoLng: string | number | BN;
  vision: string;
  investmentThesis: string;
  programRulesUrl: string;
  projectDocsUrl: string;
  milestonesDocsUrl: string;
  durationDays: string | number | BN;
  riskLevel: number;
  targetReturnBps: number;
}

function toBn(v: string | number | BN): BN {
  if (v instanceof BN) return v;
  return new BN(String(v), 10);
}

/**
 * Build a create_project VersionedTransaction. Signs with projectKp and participationMintKp.
 * Client must pass to Privy signAndSendTransaction; Privy adds owner signature (VersionedTransaction.sign does not clear existing sigs).
 */
export async function buildCreateProjectTx(
  program: Program<Idl>,
  owner: PublicKey,
  usdcMint: PublicKey,
  params: CreateProjectParams,
  blockhash: Blockhash
): Promise<{ tx: VersionedTransaction; projectKp: Keypair; participationMintKp: Keypair }> {
  const projectKp = Keypair.generate();
  const participationMintKp = Keypair.generate();
  const projectAuthority = projectAuthorityPda(projectKp.publicKey);
  const vault = vaultAddress(projectAuthority, usdcMint);
  const builder = builderPda(owner);

  const milestones = params.milestones.map((m) =>
    encodeMilestone(
      m.name,
      m.percentage,
      m.status ?? 0,
      new BN(m.estimatedCompletion ?? 0)
    )
  );
  const fundingTarget = new BN(params.fundingTargetLamports);

  const createProjectIx = await (program.methods as any)
    .createProject(
      params.name,
      params.description,
      fundingTarget,
      milestones,
      params.builderName,
      params.builderDescription,
      params.stage,
      params.projectCode,
      params.imageUrl,
      params.locationName,
      toBn(params.geoLat),
      toBn(params.geoLng),
      params.vision,
      params.investmentThesis,
      params.programRulesUrl,
      params.projectDocsUrl,
      params.milestonesDocsUrl,
      toBn(params.durationDays),
      params.riskLevel,
      params.targetReturnBps
    )
    .accountsStrict({
      owner,
      project: projectKp.publicKey,
      projectAuthority,
      vault,
      participationMint: participationMintKp.publicKey,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      builder,
    })
    .signers([projectKp, participationMintKp])
    .instruction();

  const messageV0 = new TransactionMessage({
    payerKey: owner,
    recentBlockhash: blockhash,
    instructions: [createProjectIx],
  }).compileToV0Message();

  const tx = new VersionedTransaction(messageV0);
  tx.sign([projectKp, participationMintKp]);

  return { tx, projectKp, participationMintKp };
}
