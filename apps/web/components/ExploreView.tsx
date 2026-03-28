"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { ExploreMap } from "@/components/explore/ExploreMap";
import { ExploreProjectCard } from "@/components/ExploreProjectCard";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";

type ViewMode = "grid" | "map";

export function ExploreView({
  projects,
  error,
}: {
  projects: Project[];
  error: string | null;
}) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [projects, query]);

  const selectedForUi = useMemo(() => {
    if (!selectedProjectId) return null;
    return filtered.some((p) => p.id === selectedProjectId)
      ? selectedProjectId
      : null;
  }, [filtered, selectedProjectId]);

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  useEffect(() => {
    if (!selectedForUi) return;
    const el = cardRefs.current.get(selectedForUi);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedForUi]);

  const searchToolbar = (
    <section
      className={
        viewMode === "map"
          ? "border-outline-variant/10 shrink-0 border-b bg-white px-6 py-6 dark:bg-zinc-900"
          : "mx-auto mb-10 max-w-6xl"
      }
    >
      {viewMode === "grid" && (
        <>
          <h1 className="mb-2 font-headline text-4xl font-extrabold text-primary">
            Explore investment opportunities
          </h1>
          <p className="mb-8 font-body text-on-surface-variant">
            Connect with builders and fund construction milestones through on-chain
            escrow.
          </p>
        </>
      )}
      {viewMode === "map" && (
        <h1 className="font-headline text-primary mb-4 text-2xl font-extrabold">
          Explore investment opportunities
        </h1>
      )}
      <div className="flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white p-2 shadow-sm dark:bg-zinc-900">
        <div className="flex flex-1 items-center gap-3 px-4">
          <span className="material-symbols-outlined text-outline">search</span>
          <input
            className="font-body placeholder:text-outline-variant w-full border-none bg-transparent text-sm text-on-surface focus:ring-0 dark:text-zinc-100"
            placeholder="Search by name, description, or builder address"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search projects"
          />
        </div>
        <button
          type="button"
          className="rounded-lg bg-[#004B63] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-primary"
        >
          Search projects
        </button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm font-semibold text-on-surface-variant">
          <span className="font-bold text-primary">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "project" : "projects"} found
        </div>
        <div className="bg-surface-container-low flex items-center rounded-lg p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={
              viewMode === "grid"
                ? "text-primary flex items-center gap-2 rounded-md bg-white px-4 py-1.5 text-xs font-bold shadow-sm dark:bg-zinc-700 dark:text-secondary-fixed"
                : "text-on-surface-variant flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold hover:bg-white/50 dark:hover:bg-zinc-800"
            }
          >
            <span className="material-symbols-outlined text-sm">grid_view</span>
            Grid view
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={
              viewMode === "map"
                ? "text-primary flex items-center gap-2 rounded-md bg-white px-4 py-1.5 text-xs font-bold shadow-sm dark:bg-zinc-700 dark:text-secondary-fixed"
                : "text-on-surface-variant flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold hover:bg-white/50 dark:hover:bg-zinc-800"
            }
          >
            <span className="material-symbols-outlined text-sm">map</span>
            Map view
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <div className="bg-surface flex min-h-screen flex-col">
      <main
        className={
          viewMode === "map"
            ? "bg-surface-bright flex min-h-0 flex-1 flex-col"
            : "bg-surface-bright mx-auto w-full max-w-[1920px] flex-1 p-8"
        }
      >
        {searchToolbar}

        {error && (
          <div
            className={
              viewMode === "map"
                ? "mx-6 mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                : "mx-auto mb-8 max-w-6xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
            }
            role="alert"
          >
            {error}
          </div>
        )}

        {!error && filtered.length === 0 && projects.length === 0 && (
          <p
            className={
              viewMode === "map"
                ? "text-on-surface-variant px-6 py-4"
                : "text-on-surface-variant mx-auto max-w-6xl"
            }
          >
            No projects yet. Create one to get started.
          </p>
        )}

        {!error && filtered.length === 0 && projects.length > 0 && (
          <p
            className={
              viewMode === "map"
                ? "text-on-surface-variant px-6 py-4"
                : "text-on-surface-variant mx-auto max-w-6xl"
            }
          >
            No projects match your search.
          </p>
        )}

        {viewMode === "grid" && !error && filtered.length > 0 && (
          <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ExploreProjectCard key={project.id} project={project} />
            ))}
          </section>
        )}

        {viewMode === "map" && !error && filtered.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col md:h-[calc(100dvh-5.5rem)] md:flex-row">
            <aside className="border-outline-variant/20 flex h-[min(50vh,480px)] min-h-0 w-full flex-col overflow-hidden border-r bg-white md:h-full md:w-[40%] dark:bg-zinc-900">
              <div className="border-outline-variant/10 shrink-0 border-b px-6 py-6">
                <h2 className="font-headline text-primary text-2xl font-extrabold">
                  Active projects
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "opportunity" : "opportunities"} on the map
                </p>
              </div>
              <div className="hide-scrollbar flex-1 space-y-8 overflow-y-auto px-6 py-6">
                {filtered.map((project) => (
                  <div
                    key={project.id}
                    ref={(el) => setCardRef(project.id, el)}
                    role="presentation"
                    onClick={() => setSelectedProjectId(project.id)}
                    className={
                      selectedForUi === project.id
                        ? "ring-secondary rounded-xl ring-2 ring-offset-2"
                        : ""
                    }
                  >
                    <ExploreProjectCard project={project} />
                  </div>
                ))}
              </div>
            </aside>
            <div className="bg-surface-container-low relative min-h-[320px] flex-1 md:min-h-0 md:w-[60%]">
              <ExploreMap
                projects={filtered}
                selectedProjectId={selectedForUi}
                onMarkerClick={setSelectedProjectId}
              />
            </div>
          </div>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
}
