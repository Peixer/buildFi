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

export function vaultAddress(projectAuthority: PublicKey, usdcMint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    usdcMint,
    projectAuthority,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

/** Milestone for create_project: name as 32-byte array, percentage 0-100. */
export function milestone(name: string, percentage: number): { name: number[]; percentage: number } {
  const nameBytes = Buffer.alloc(32);
  Buffer.from(name, "utf8").copy(nameBytes);
  return { name: Array.from(nameBytes), percentage };
}

export interface CreateProjectParams {
  name: string;
  description: string;
  fundingTargetLamports: number;
  milestones: Array<{ name: string; percentage: number }>;
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

  const milestones = params.milestones.map((m) => milestone(m.name, m.percentage));
  const fundingTarget = new BN(params.fundingTargetLamports);

  const createProjectIx = await (program.methods as any)
    .createProject(params.name, params.description, fundingTarget, milestones)
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
