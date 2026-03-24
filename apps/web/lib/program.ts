/**
 * BuildFi program client: create Program instance and fetch projects/buyers from chain.
 */

import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  type GetProgramAccountsFilter,
} from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { BUILDFI_PROGRAM_ID, SOLANA_RPC_URL } from "./constants";
import type { Project, ProjectAccount } from "./types";
import { toUiProject } from "./types";

// IDL type for BuildFi (accounts: Project, Buyer)
import buildfiIdl from "./idl/buildfi.json";

const IDL = buildfiIdl as Idl;

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL);
}

/** Dummy wallet for read-only Provider (signTransaction/signAllTransactions never called). */
function dummyWallet() {
  const kp = Keypair.generate();
  return {
    publicKey: kp.publicKey,
    signTransaction: async (tx: unknown) => tx,
    signAllTransactions: async (txs: unknown[]) => txs,
  } as import("@coral-xyz/anchor").Wallet;
}

/**
 * Create a read-only Anchor Program for BuildFi (no wallet needed for fetches).
 */
export function getProgram(connection?: Connection): Program {
  const conn = connection ?? getConnection();
  const programId = new PublicKey(
    process.env.NEXT_PUBLIC_BUILDFI_PROGRAM_ID ?? BUILDFI_PROGRAM_ID
  );
  const provider = new AnchorProvider(conn, dummyWallet(), {
    commitment: "confirmed",
  });
  return new Program(IDL, programId, provider);
}

/**
 * Fetch all projects from the program.
 */
export async function fetchAllProjects(connection?: Connection): Promise<Project[]> {
  const program = getProgram(connection);
  const accounts = await program.account.project.all();
  return accounts.map(({ publicKey, account }) =>
    toUiProject(publicKey, account as unknown as ProjectAccount)
  );
}

/**
 * Fetch a single project by public key. Returns null if not found.
 */
export async function fetchProject(
  address: string,
  connection?: Connection
): Promise<Project | null> {
  const program = getProgram(connection);
  try {
    const account = await program.account.project.fetchNullable(address);
    if (!account) return null;
    const pubkey = new PublicKey(address);
    return toUiProject(pubkey, account as unknown as ProjectAccount);
  } catch {
    return null;
  }
}

/**
 * Fetch projects owned by the given wallet.
 */
export async function fetchProjectsByOwner(
  ownerPublicKey: PublicKey,
  connection?: Connection
): Promise<Project[]> {
  const program = getProgram(connection);
  const filter: GetProgramAccountsFilter = {
    memcmp: { offset: 8, bytes: ownerPublicKey.toBase58() },
  };
  const accounts = await program.account.project.all([filter]);
  return accounts.map(({ publicKey, account }) =>
    toUiProject(publicKey, account as unknown as ProjectAccount)
  );
}

/**
 * Buyer account with project pubkey for UI.
 */
export interface BuyerWithProject {
  buyerAccount: { user: PublicKey; project: PublicKey; amount: { toNumber(): number; toString(): string } };
  projectPubkey: string;
}

/**
 * Fetch all Buyer accounts for the given user wallet.
 */
export async function fetchBuyersByUser(
  userPublicKey: PublicKey,
  connection?: Connection
): Promise<BuyerWithProject[]> {
  const program = getProgram(connection);
  const filter: GetProgramAccountsFilter = {
    memcmp: { offset: 8, bytes: userPublicKey.toBase58() },
  };
  const accounts = await program.account.buyer.all([filter]);
  return accounts.map(({ publicKey: _pk, account }) => ({
    buyerAccount: account as BuyerWithProject["buyerAccount"],
    projectPubkey: (account as { project: PublicKey }).project.toBase58(),
  }));
}