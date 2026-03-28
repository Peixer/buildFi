"use client";

import type { ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

const sidebarLink =
  "text-[#40484c] dark:text-[#f3f4f5] opacity-80 hover:bg-[#ffffff]/50 dark:hover:bg-[#40484c]/50 flex items-center gap-3 rounded-md px-3 py-2 transition-all duration-150 active:scale-[0.98]";

const sidebarLinkActive =
  "bg-[#ffffff] dark:bg-[#40484c] text-[#003345] dark:text-[#f8f9fa] shadow-sm " +
  sidebarLink.replace("opacity-80 ", "font-semibold ");

function walletInitials(address: string): string {
  return address.slice(0, 2).toUpperCase();
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { logout } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const address = wallet?.address ?? "";

  return (
    <div className="bg-background text-on-surface flex min-h-screen">
      <aside className="border-surface-container-low dark:border-on-surface-variant/20 bg-surface-container-low dark:bg-inverse-surface fixed top-0 left-0 z-50 flex h-screen w-64 flex-col gap-2 border-r p-4">
        <div className="mb-8 px-2">
          <h2 className="text-primary dark:text-surface text-lg font-bold tracking-tight">
            Admin Console
          </h2>
          <p className="font-body text-on-surface-variant dark:text-surface-container-low text-xs opacity-70">
            Institutional Access
          </p>
        </div>
        <nav className="flex flex-1 flex-col space-y-1">
          <a className={sidebarLinkActive} href="#project-oversight">
            <span className="material-symbols-outlined text-xl">analytics</span>
            <span className="font-body text-sm">Project Oversight</span>
          </a>
          <a className={sidebarLink} href="#builder-review">
            <span className="material-symbols-outlined text-xl">verified_user</span>
            <span className="font-body text-sm">Builder Verification</span>
          </a>
          <a className={sidebarLink} href="#access-security">
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
            <span className="font-body text-sm">User Access Control</span>
          </a>
          <a className={sidebarLink} href="#security-logs">
            <span className="material-symbols-outlined text-xl">security</span>
            <span className="font-body text-sm">Security Audit</span>
          </a>
        </nav>
        <div className="border-outline-variant/20 mt-auto space-y-1 border-t pt-4">
          <button
            type="button"
            className="bg-primary text-on-primary hover:bg-primary-container mb-4 w-full rounded-md py-2.5 text-sm font-semibold transition-colors"
            onClick={() => {
              window.alert("Audit report generation is not wired yet.");
            }}
          >
            Generate Audit Report
          </button>
          <a className={sidebarLink} href="#">
            <span className="material-symbols-outlined text-xl">help_center</span>
            <span className="font-body text-sm">Support</span>
          </a>
          <button type="button" className={sidebarLink} onClick={() => logout()}>
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-body text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex min-h-screen flex-1 flex-col">
        <header className="border-surface-container-low dark:border-on-surface-variant/20 bg-background dark:bg-inverse-surface sticky top-0 z-40 flex w-full items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-8">
            <h1 className="text-primary dark:text-surface font-headline text-xl font-black tracking-tight">
              BuildFi
            </h1>
            <div className="hidden items-center gap-6 md:flex">
              <div className="flex items-center gap-2">
                <span className="bg-secondary h-2 w-2 rounded-full" />
                <span className="text-secondary text-xs font-bold tracking-wider uppercase dark:text-secondary">
                  System Health: Optimal
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">
                  lock
                </span>
                <span className="text-on-surface-variant dark:text-surface-container-low text-xs font-bold tracking-wider uppercase">
                  Network: Secure
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="text-on-surface-variant dark:text-surface-container-low hover:bg-surface-container-low dark:hover:bg-on-surface-variant rounded-full p-2 transition-colors"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button
                type="button"
                className="text-on-surface-variant dark:text-surface-container-low hover:bg-surface-container-low dark:hover:bg-on-surface-variant rounded-full p-2 transition-colors"
                aria-label="Settings"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
            <div className="bg-outline-variant/30 mx-1 h-8 w-px" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-on-surface text-sm leading-none font-semibold">Admin User</p>
                <p className="text-on-surface-variant text-[10px] font-medium">
                  Super Administrator
                </p>
              </div>
              <div
                className="border-outline-variant/20 font-headline text-primary flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold"
                title={address}
              >
                {address ? walletInitials(address) : "—"}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl flex-1 space-y-12 p-8">{children}</div>
        <div className="h-12 shrink-0" />
      </main>
    </div>
  );
}
