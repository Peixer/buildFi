import Link from "next/link";

export function MarketplaceFooter() {
  return (
    <footer className="bg-primary px-8 py-16 text-white">
      <div className="mx-auto grid max-w-[1920px] grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className="mb-6 font-headline text-2xl font-black tracking-tighter">
            BuildFi
          </h2>
          <p className="mb-8 max-w-xs text-sm leading-relaxed text-on-primary-container">
            Programmable stablecoin escrow for construction projects. Fund milestones with
            confidence on Solana.
          </p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined cursor-pointer hover:text-secondary-fixed">
              language
            </span>
            <span className="material-symbols-outlined cursor-pointer hover:text-secondary-fixed">
              share
            </span>
            <span className="material-symbols-outlined cursor-pointer hover:text-secondary-fixed">
              mail
            </span>
          </div>
        </div>
        <div>
          <h4 className="mb-6 text-sm font-bold tracking-widest text-on-primary-container uppercase">
            Marketplace
          </h4>
          <ul className="space-y-4 text-sm font-medium">
            <li>
              <Link className="transition-colors hover:text-secondary-fixed" href="/explore">
                Explore projects
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-secondary-fixed" href="/create">
                Create project
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-secondary-fixed" href="/wallet">
                My wallet
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-6 text-sm font-bold tracking-widest text-on-primary-container uppercase">
            Builders
          </h4>
          <ul className="space-y-4 text-sm font-medium">
            <li>
              <Link className="transition-colors hover:text-secondary-fixed" href="/create">
                Raise capital
              </Link>
            </li>
            <li>
              <span className="text-white/70">Builder guidelines (soon)</span>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-6 text-sm font-bold tracking-widest text-on-primary-container uppercase">
            Legal &amp; trust
          </h4>
          <ul className="space-y-4 text-sm font-medium">
            <li>
              <span className="text-white/70">Risk disclosure</span>
            </li>
            <li>
              <span className="text-white/70">Privacy policy</span>
            </li>
            <li>
              <span className="text-white/70">Terms of service</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-16 flex max-w-[1920px] flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
        <p className="text-[10px] tracking-[0.2em] text-on-primary-container uppercase">
          © {new Date().getFullYear()} BuildFi. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary-fixed">verified_user</span>
          <span className="text-[10px] font-bold tracking-widest uppercase">
            On-chain escrow
          </span>
        </div>
      </div>
    </footer>
  );
}
