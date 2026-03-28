"use client";

import { useState } from "react";

export function AdminSecuritySection() {
  const [maintenance, setMaintenance] = useState(false);

  return (
    <section className="space-y-6" id="access-security">
      <h3 className="text-primary flex items-center gap-2 text-xl font-bold">
        <span className="material-symbols-outlined text-secondary">security</span>
        Access Control &amp; System Health
      </h3>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="border-outline-variant/10 bg-surface-container-high rounded-2xl border p-8 shadow-sm">
          <h4 className="text-primary mb-6 flex items-center gap-2 text-base font-bold">
            <span className="material-symbols-outlined text-sm">lock_open</span>
            Access Monitoring
          </h4>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest rounded-xl p-5">
                <p className="text-on-surface-variant mb-1 text-[10px] font-bold uppercase tracking-widest">
                  Active Sessions
                </p>
                <p className="text-primary font-headline text-3xl font-black">08</p>
              </div>
              <div className="bg-surface-container-lowest rounded-xl p-5">
                <p className="text-on-surface-variant mb-1 text-[10px] font-bold uppercase tracking-widest">
                  Failed Logins
                </p>
                <p className="text-error font-headline text-3xl font-black">02</p>
              </div>
            </div>
            <div className="border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between rounded-xl border p-5">
              <div>
                <p className="text-primary text-sm font-bold">Maintenance Mode</p>
                <p className="text-on-surface-variant text-[10px]">
                  Restrict all non-admin access
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center">
                <input
                  className="peer sr-only"
                  type="checkbox"
                  checked={maintenance}
                  onChange={(e) => setMaintenance(e.target.checked)}
                />
                <div className="peer-checked:bg-secondary bg-surface-variant relative h-6 w-11 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-secondary/30 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] rtl:peer-checked:after:-translate-x-full" />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6" id="security-logs">
          <div className="border-primary/10 bg-primary/5 space-y-4 rounded-2xl border p-6">
            <h4 className="text-primary flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              Recent Security Logs
              <span className="material-symbols-outlined text-sm">history</span>
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary mt-0.5 text-sm">
                  info
                </span>
                <p className="text-on-surface text-xs leading-normal">
                  <span className="font-bold">Admin-04</span> changed funding goal for{" "}
                  <span className="font-bold">Riverside Tower</span>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-error mt-0.5 text-sm">
                  warning
                </span>
                <p className="text-on-surface text-xs leading-normal">
                  <span className="font-bold">Unauthorized IP</span> attempted login from Kiev,
                  UA.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-secondary w-full pt-2 text-center text-[10px] font-bold tracking-widest uppercase hover:underline"
            >
              View Security Audit Full Log
            </button>
          </div>

          <div className="border-outline-variant/10 bg-surface-container-low flex items-center justify-around rounded-2xl border p-6">
            <div className="flex items-center gap-4">
              <div className="bg-tertiary h-12 w-0.5" />
              <div>
                <p className="text-primary font-headline text-2xl font-black leading-none">
                  99.98%
                </p>
                <p className="text-on-surface-variant mt-1 text-[10px] font-bold tracking-wider uppercase">
                  Uptime
                </p>
              </div>
            </div>
            <div className="bg-outline-variant/20 h-8 w-px" />
            <div className="flex items-center gap-4">
              <div className="bg-secondary h-12 w-0.5" />
              <div>
                <p className="text-primary font-headline text-2xl font-black leading-none">
                  1.2s
                </p>
                <p className="text-on-surface-variant mt-1 text-[10px] font-bold tracking-wider uppercase">
                  Response
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
