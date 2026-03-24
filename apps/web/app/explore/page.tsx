import { fetchAllProjects } from "@/lib/program";
import type { Project } from "@/lib/types";
import { ProjectCard } from "@/components/ProjectCard";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  let projects: Project[] = [];
  let error: string | null = null;

  try {
    projects = await fetchAllProjects();
  } catch (e) {
    error =
      e instanceof Error ? e.message : "Unable to load projects. Check RPC and try again.";
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Explore projects
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Construction projects funded through BuildFi escrow.
        </p>

        {error && (
          <div
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
            role="alert"
          >
            {error}
          </div>
        )}

        {!error && projects.length === 0 && (
          <p className="mt-8 text-zinc-500 dark:text-zinc-400">
            No projects yet. Create one to get started.
          </p>
        )}

        {!error && projects.length > 0 && (
          <ul className="mt-8 grid gap-6 sm:grid-cols-1">
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
