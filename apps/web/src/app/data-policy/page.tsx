import Link from "next/link";

import { PRODUCT_NAME } from "@/lib/brand";

export const metadata = {
  title: `Data policy (draft) — ${PRODUCT_NAME}`
};

export default function DataPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-muted-foreground mb-2 text-xs uppercase tracking-wide">
        Draft — not legal advice
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">Data policy</h1>
      <div className="text-muted-foreground mt-6 space-y-4 text-sm leading-relaxed">
        <p>
          This pilot application processes licence and vendor information that you
          or your organization upload or enter. Data is stored in our providers’
          infrastructure (including database and file storage) to provide the
          dashboard, reporting, and related features.
        </p>
        <p>
          Organization owners can request deletion of organization-scoped data using
          the Owner workspace. Deletion is intended to be irreversible for the data
          covered by that action.
        </p>
        <p>
          For questions about processing in your jurisdiction, consult your legal
          and privacy advisors.
        </p>
      </div>
      <p className="mt-8">
        <Link href="/dashboard" className="text-primary text-sm underline-offset-2 hover:underline">
          Back to dashboard
        </Link>
      </p>
    </main>
  );
}
