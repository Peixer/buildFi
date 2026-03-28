"use client";

import { AdminBuilderReview } from "./AdminBuilderReview";
import { AdminGate } from "./AdminGate";
import { AdminProjectOversight } from "./AdminProjectOversight";
import { AdminSecuritySection } from "./AdminSecuritySection";
import { AdminShell } from "./AdminShell";

export function AdminPage() {
  return (
    <AdminGate>
      <AdminShell>
        <div className="space-y-12">
          <AdminProjectOversight />
          <AdminBuilderReview />
          <AdminSecuritySection />
        </div>
      </AdminShell>
    </AdminGate>
  );
}
