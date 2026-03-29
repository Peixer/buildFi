import Link from "next/link";

export default function BuildersPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            For builders
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Raise milestone-based capital on Solana with programmable USDC escrow.
            List your project, define milestones, and give backers transparent,
            on-chain visibility into funding and releases.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              List a project
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Browse marketplace
            </Link>
          </div>
          <p className="mt-12 text-sm text-zinc-500 dark:text-zinc-400">
            Builder guidelines and verification — coming soon.
          </p>
        </section>
      </main>
    </div>
  );
}
