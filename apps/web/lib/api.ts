/**
 * Legacy REST API client. No longer used; the web app uses the BuildFi program on Solana.
 * Kept for reference or optional future use.
 */

import type { Project } from "./types";

const getApiBase = () =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function fetchProjects(): Promise<Project[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/projects`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch projects: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchProject(id: string): Promise<Project | null> {
  const base = getApiBase();
  const res = await fetch(`${base}/projects/${id}`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Failed to fetch project: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
