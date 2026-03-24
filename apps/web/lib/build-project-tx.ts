/**
 * Build delete_project, deposit, and refund transactions for the BuildFi program.
 */

import type { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import type { Idl } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  projectAuthorityPda,
} from "./build-create-project-tx";

export { projectAuthorityPda };

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_BUILDFI_PROGRAM_ID ?? "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

export function buyerPda(projectPk: PublicKey, buyerPk: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("buyer"), projectPk.toBuffer(), buyerPk.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

/** Build delete_project instruction. Caller signs and sends. */
export async function buildDeleteProjectTx(
  program: Program<Idl>,
  owner: PublicKey,
  projectPk: PublicKey,
  projectAuthority: PublicKey,
  vault: PublicKey,
  participationMint: PublicKey
): Promise<Transaction> {
  const tx = await (program.methods as any)
    .deleteProject()
    .accountsStrict({
      owner,
      project: projectPk,
      projectAuthority,
      vault,
      participationMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .transaction();
  return tx;
}

/** Build deposit instruction. Optionally prepend create ATA instructions. */
export async function buildDepositTx(
  program: Program<Idl>,
  buyer: PublicKey,
  projectPk: PublicKey,
  vault: PublicKey,
  participationMint: PublicKey,
  usdcMint: PublicKey,
  amountLamports: number,
  options?: {
    createBuyerUsdcAta?: boolean;
    createBuyerParticipationAta?: boolean;
  }
): Promise<{ tx: Transaction; buyerUsdcAta: PublicKey; buyerParticipationAta: PublicKey }> {
  const projectAuthority = projectAuthorityPda(projectPk);
  const buyerAccountPda = buyerPda(projectPk, buyer);
  const buyerUsdcAta = getAssociatedTokenAddressSync(
    usdcMint,
    buyer,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const buyerParticipationAta = getAssociatedTokenAddressSync(
    participationMint,
    buyer,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const tx = new Transaction();
  if (options?.createBuyerUsdcAta) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        buyer,
        buyerUsdcAta,
        buyer,
        usdcMint
      )
    );
  }
  if (options?.createBuyerParticipationAta) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        buyer,
        buyerParticipationAta,
        buyer,
        participationMint
      )
    );
  }

  const depositIx = await (program.methods as any)
    .deposit(new BN(amountLamports))
    .accountsStrict({
      buyer,
      buyerAccount: buyerAccountPda,
      project: projectPk,
      vault,
      buyerUsdcAta,
      buyerParticipationAta,
      participationMint,
      usdcMint,
      projectAuthority,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  tx.add(depositIx);
  return { tx, buyerUsdcAta, buyerParticipationAta };
}

/** Build refund instruction. */
export async function buildRefundTx(
  program: Program<Idl>,
  buyer: PublicKey,
  buyerAccountPda: PublicKey,
  projectPk: PublicKey,
  projectAuthority: PublicKey,
  vault: PublicKey,
  buyerUsdcAta: PublicKey,
  buyerParticipationAta: PublicKey,
  participationMint: PublicKey,
  usdcMint: PublicKey
): Promise<Transaction> {
  const tx = await (program.methods as any)
    .refund()
    .accountsStrict({
      buyer,
      buyerAccount: buyerAccountPda,
      project: projectPk,
      projectAuthority,
      vault,
      buyerUsdcAta,
      buyerParticipationAta,
      participationMint,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .transaction();
  return tx;
}
