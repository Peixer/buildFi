import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Construction financing, reimagined
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            BuildFi is a programmable stablecoin escrow protocol for construction
            on Solana. Fund real-world projects through milestone-based
            releases—deposit USDC, earn participation tokens, and support
            builders with transparent, on-chain flows.
          </p>
          <div className="mt-10">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Explore projects
            </Link>
          </div>
        </section>
        <section className="mt-24 grid gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Milestone-based
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Funds stay in escrow until milestones are approved, then release
              automatically to builders.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Participation tokens
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Each deposit mints a token—proof of contribution and eligibility
              for builder-defined benefits.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              On Solana
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Fast, low-cost stablecoin flows and programmable escrow via
              Solana smart contracts.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
