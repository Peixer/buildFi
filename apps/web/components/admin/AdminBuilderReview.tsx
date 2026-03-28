export function AdminBuilderReview() {
  return (
    <section className="space-y-6" id="builder-review">
      <h3 className="text-primary flex items-center gap-2 text-xl font-bold">
        <span className="material-symbols-outlined text-secondary">verified_user</span>
        Builder Credentials Review
      </h3>
      <div className="space-y-4">
        <div className="border-outline-variant/10 bg-surface-container-lowest hover:bg-surface-container-low group flex items-center justify-between rounded-xl border p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="bg-surface-container-high font-headline text-primary flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold">
              AC
            </div>
            <div>
              <h4 className="text-primary font-bold">Apex Construction Group</h4>
              <p className="text-on-surface-variant text-xs">
                Applied 2 days ago • Commercial Specialist
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold tracking-tight text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-200">
              Pending Verification
            </span>
            <button
              type="button"
              className="bg-primary text-on-primary hover:bg-primary-container rounded-md px-5 py-2.5 text-xs font-bold transition-colors"
            >
              Review Docs
            </button>
          </div>
        </div>
        <div className="border-outline-variant/10 bg-surface-container-lowest hover:bg-surface-container-low group flex items-center justify-between rounded-xl border p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="bg-surface-container-high font-headline text-primary flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold">
              LH
            </div>
            <div>
              <h4 className="text-primary font-bold">Lumina Homes Ltd.</h4>
              <p className="text-on-surface-variant text-xs">
                Applied 5 days ago • Residential Developer
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="bg-error-container text-on-error-container rounded-full px-3 py-1 text-[10px] font-bold tracking-tight uppercase">
              Documents Incomplete
            </span>
            <button
              type="button"
              className="bg-primary text-on-primary hover:bg-primary-container rounded-md px-5 py-2.5 text-xs font-bold transition-colors"
            >
              Review Docs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
