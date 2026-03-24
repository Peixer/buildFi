import { notFound } from "next/navigation";
import { fetchProject, getConnection } from "@/lib/program";
import { getAccount } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { Project } from "@/lib/types";
import { ProjectView } from "./ProjectView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ address: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { address } = await params;
  const project = await fetchProject(address);
  if (!project) notFound();

  let vaultBalance = 0;
  try {
    const connection = getConnection();
    const acc = await getAccount(connection, new PublicKey(project.vault));
    vaultBalance = Number(acc.amount);
  } catch {
    // Vault may not exist or be closed
  }

  return (
    <ProjectView project={project} vaultBalance={vaultBalance} />
  );
}
