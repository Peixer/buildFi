import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchProject, getConnection } from "@/lib/program";
import { getAccount } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { ProjectView } from "./ProjectView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { address } = await params;
  const project = await fetchProject(address);
  if (!project) {
    return { title: "Project — BuildFi" };
  }
  const title = project.name
    ? `${project.name} — BuildFi`
    : "Project — BuildFi";
  return {
    title,
    description:
      project.description?.slice(0, 160) ||
      "View funding progress, milestones, and participate through BuildFi on Solana.",
  };
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
