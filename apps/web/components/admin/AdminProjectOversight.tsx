export function AdminProjectOversight() {
  return (
    <section className="space-y-6" id="project-oversight">
      <div className="border-outline-variant/10 border-b pb-6">
        <h2 className="font-headline text-primary text-3xl font-extrabold tracking-tight">
          Project Oversight
        </h2>
        <p className="text-on-surface-variant mt-1">
          Institutional monitoring of active funding and builder compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border-outline-variant/10 bg-surface-container-lowest flex flex-col justify-between rounded-2xl border p-8 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-[0.2em]">
              Total AUM
            </p>
            <span className="material-symbols-outlined text-tertiary text-xl">
              payments
            </span>
          </div>
          <p className="text-primary font-headline text-5xl font-black">$124.8M</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-secondary flex items-center gap-0.5 text-xs font-semibold">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              12.5%
            </span>
            <span className="text-on-surface-variant text-xs">vs last month</span>
          </div>
        </div>

        <div className="border-outline-variant/10 bg-surface-container-lowest flex flex-col justify-between rounded-2xl border p-8 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-on-surface-variant text-xs font-bold uppercase tracking-[0.2em]">
              Active Projects
            </p>
            <span className="material-symbols-outlined text-secondary text-xl">
              apartment
            </span>
          </div>
          <p className="text-primary font-headline text-5xl font-black">42</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-secondary flex items-center gap-0.5 text-xs font-semibold">
              <span className="material-symbols-outlined text-xs">add</span>4
            </span>
            <span className="text-on-surface-variant text-xs">new this quarter</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-primary flex items-center gap-2 text-xl font-bold">
            <span className="material-symbols-outlined text-secondary">account_balance</span>
            Project Funding Management
          </h3>
          <button
            type="button"
            className="text-secondary flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            View all projects{" "}
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>

        <div className="border-outline-variant/10 bg-surface-container-lowest overflow-hidden rounded-xl border shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low border-outline-variant/10 border-b">
                <th className="text-on-surface-variant px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Project Name
                </th>
                <th className="text-on-surface-variant px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Funding Stage
                </th>
                <th className="text-on-surface-variant px-6 py-4 text-[10px] font-bold uppercase tracking-widest">
                  Goal Status
                </th>
                <th className="text-on-surface-variant px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-outline-variant/5 divide-y">
              <tr className="hover:bg-surface-container-low/30 group transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-surface-container-high h-10 w-10 overflow-hidden rounded">
                      <div className="bg-secondary-container/40 h-full w-full" aria-hidden />
                    </div>
                    <span className="text-primary font-bold">The Riverside Tower</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="bg-secondary-container text-on-secondary-container inline-flex items-center rounded px-2 py-1 text-[11px] font-bold uppercase">
                    Raising
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="w-32">
                    <div className="text-on-surface-variant mb-1 flex justify-between text-[10px] font-bold">
                      <span>72%</span>
                      <span>$12M</span>
                    </div>
                    <div className="bg-surface-variant h-1.5 w-full overflow-hidden rounded-full">
                      <div className="from-secondary to-secondary-fixed-dim h-full w-[72%] bg-gradient-to-r" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="bg-secondary-container/30 text-secondary hover:bg-secondary-container/50 rounded-md px-3 py-1.5 text-xs font-bold transition-colors"
                    >
                      Approve Stage Change
                    </button>
                    <button
                      type="button"
                      className="text-on-surface-variant hover:text-primary p-1.5 transition-colors"
                      aria-label="Edit"
                    >
                      <span className="material-symbols-outlined text-xl">edit_note</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low/30 group transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-surface-container-high h-10 w-10 overflow-hidden rounded">
                      <div className="bg-primary/20 h-full w-full" aria-hidden />
                    </div>
                    <span className="text-primary font-bold">Harbor View Mixed Use</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="bg-surface-container-high text-on-surface-variant inline-flex items-center rounded px-2 py-1 text-[11px] font-bold uppercase">
                    Pre-Funding
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="w-32">
                    <div className="text-on-surface-variant mb-1 flex justify-between text-[10px] font-bold">
                      <span>0%</span>
                      <span>$4.5M</span>
                    </div>
                    <div className="bg-surface-variant h-1.5 w-full overflow-hidden rounded-full">
                      <div className="from-secondary to-secondary-fixed-dim h-full w-0 bg-gradient-to-r" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="bg-secondary-container/30 text-secondary hover:bg-secondary-container/50 rounded-md px-3 py-1.5 text-xs font-bold transition-colors"
                    >
                      Approve Stage Change
                    </button>
                    <button
                      type="button"
                      className="text-on-surface-variant hover:text-primary p-1.5 transition-colors"
                      aria-label="Edit"
                    >
                      <span className="material-symbols-outlined text-xl">edit_note</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
