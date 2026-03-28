import Link from "next/link";
import type { Project } from "@/lib/types";
import { hashProjectId as hashId, heroImageForProjectId } from "@/lib/project-hero-images";

const USDC_DECIMALS = 6;

const RISK_LABELS = [
  "Moderate Risk",
  "Growth",
  "Balanced",
  "Moderate",
  "Growth",
];

function formatUsdc(raw: number): string {
  const usdc = raw / 10 ** USDC_DECIMALS;
  if (usdc >= 1_000_000) return `$${(usdc / 1_000_000).toFixed(1)}M`;
  if (usdc >= 1_000) return `$${(usdc / 1_000).toFixed(1)}K`;
  return `$${usdc.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function truncateOwner(owner: string): string {
  if (owner.length <= 12) return owner;
  return `${owner.slice(0, 4)}…${owner.slice(-4)}`;
}

function milestoneProgress(project: Project): number {
  if (project.milestone_count <= 0) return 0;
  return Math.round(
    (project.released_milestone_count / project.milestone_count) * 100
  );
}

function stageLabel(project: Project): string {
  if (project.milestone_count === 0) return "Setup";
  if (project.released_milestone_count >= project.milestone_count) {
    return "Fully funded";
  }
  if (project.released_milestone_count === 0) return "Raising";
  return "In progress";
}

export function ExploreProjectCard({
  project,
}: {
  project: Project;
}) {
  const img = heroImageForProjectId(project.id);
  const h = hashId(project.id);
  const risk = RISK_LABELS[h % RISK_LABELS.length];
  const showVerified = h % 5 !== 4;
  const showHighDemand = h % 7 === 0;
  const pct = milestoneProgress(project);
  const target = formatUsdc(project.funding_target);
  const raisedDisplay =
    project.milestone_count > 0
      ? `${pct}% milestones`
      : "—";

  return (
    <article className="group overflow-hidden rounded-xl bg-white shadow-[0_4px_20px_rgba(0,51,69,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,51,69,0.06)] dark:bg-zinc-900">
      <div className="relative h-56 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={img}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {showVerified && (
            <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-[10px] font-bold text-white shadow-md">
              <span
                className="material-symbols-outlined text-[12px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              Verified builder
            </span>
          )}
          {showHighDemand && (
            <span className="rounded bg-tertiary-fixed px-2 py-1 text-[10px] font-bold tracking-wider text-on-tertiary-fixed uppercase shadow-md">
              High demand
            </span>
          )}
        </div>
        <div className="absolute top-4 right-4">
          <span className="rounded bg-white/90 px-2 py-1 text-[10px] font-bold text-primary shadow-sm backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-100">
            {risk}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-headline text-lg leading-tight font-bold text-primary">
            {project.name || "Untitled project"}
          </h3>
          <span className="shrink-0 text-sm font-bold text-secondary">
            {formatUsdc(project.funding_target)} USDC
          </span>
        </div>
        <p className="mb-1 flex items-center gap-1 text-[12px] text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">hub</span>
          Solana
        </p>
        <p className="mb-4 text-[12px] font-semibold text-outline">
          By {truncateOwner(project.owner)}
        </p>
        <p className="mb-6 line-clamp-2 text-[12px] text-on-surface-variant italic">
          &ldquo;{project.description || "No description yet."}&rdquo;
        </p>
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-[11px] font-bold tracking-tight text-on-surface uppercase">
            <span>{raisedDisplay}</span>
            <span>
              Target {target} USDC
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-linear-to-r from-secondary to-secondary-fixed-dim"
              style={{ width: `${Math.min(100, Math.max(pct, 4))}%` }}
            />
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="border-l-2 border-tertiary pl-3">
            <p className="text-[10px] font-bold text-outline-variant uppercase">
              Stage
            </p>
            <p className="text-xs font-bold text-on-surface">{stageLabel(project)}</p>
          </div>
          <div className="border-l-2 border-tertiary pl-3">
            <p className="text-[10px] font-bold text-outline-variant uppercase">
              Milestones
            </p>
            <p className="text-xs font-bold text-on-surface">
              {project.released_milestone_count} / {project.milestone_count}
            </p>
          </div>
        </div>
        <Link
          href={`/project/${project.id}`}
          className="block w-full rounded-lg border-2 border-primary-container py-3 text-center text-sm font-bold text-primary-container transition-all hover:bg-primary-container hover:text-white active:scale-95"
        >
          View project
        </Link>
      </div>
    </article>
  );
}
