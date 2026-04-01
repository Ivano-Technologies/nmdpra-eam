"use client";

import type { Role } from "@/lib/roles";
import { POLICY_VERSION } from "@/lib/compliance-policy";

type Props = {
  generatedAtIso?: string;
  role: Role;
};

function visibilityLine(role: Role): string {
  switch (role) {
    case "owner":
      return "Data visible to: admins and owners in your organization.";
    case "admin":
      return "Data visible to: admins and owners in your organization.";
    default:
      return "Limited view — contact an admin for full analytics.";
  }
}

export function TrustStrip({ generatedAtIso, role }: Props) {
  return (
    <div className="border-border bg-muted/30 text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border px-3 py-2 text-xs">
      <span>
        <span className="text-foreground font-medium">Policy: </span>v
        {POLICY_VERSION}
      </span>
      {generatedAtIso ? (
        <span>
          <span className="text-foreground font-medium">Report generated: </span>
          {new Date(generatedAtIso).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short"
          })}
        </span>
      ) : (
        <span>
          <span className="text-foreground font-medium">Report: </span>
          not loaded
        </span>
      )}
      <span>{visibilityLine(role)}</span>
    </div>
  );
}
