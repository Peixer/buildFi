import Link from "next/link";
import type { Project } from "@/lib/types";

function formatFundingTarget(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function ProjectCard({ project }: { project: Project }) {
  const milestonesSummary =
    project.milestones.length > 0
      ? project.milestones.map((m) => `${m.name} (${m.percentage}%)`).join(" · ")
      : "No milestones";

  return (
    <Link href={`/project/${project.id}`}>
      <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {project.name}
        </h2>
      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
        {project.description}
      </p>
      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <div>
          <dt className="sr-only">Funding target</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-50">
            {formatFundingTarget(project.funding_target)} USDC
          </dd>
        </div>
        <div className="min-w-0 flex-1">
          <dt className="sr-only">Milestones</dt>
          <dd className="truncate text-zinc-600 dark:text-zinc-400">
            {milestonesSummary}
          </dd>
        </div>
      </dl>
    </article>
    </Link>
  );
}
