import type { Metadata } from "next";
import { fetchAllProjects } from "@/lib/program";
import type { Project } from "@/lib/types";
import { ExploreView } from "@/components/ExploreView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore — BuildFi",
  description:
    "Browse construction projects funded through BuildFi escrow on Solana.",
};

export default async function ExplorePage() {
  let projects: Project[] = [];
  let error: string | null = null;

  try {
    projects = await fetchAllProjects();
  } catch (e) {
    error =
      e instanceof Error ? e.message : "Unable to load projects. Check RPC and try again.";
  }

  return <ExploreView projects={projects} error={error} />;
}
