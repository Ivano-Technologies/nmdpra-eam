"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { parseOrgId } from "@/lib/tenant";

type ExcelUploadCardProps = {
  onUploadSuccess?: () => void | Promise<void>;
};

export function ExcelUploadCard({ onUploadSuccess }: ExcelUploadCardProps = {}) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const metaOrg = parseOrgId(user?.publicMetadata);
  const [orgIdInput, setOrgIdInput] = useState("");

  const needsOrgField = !metaOrg;

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const input = form.elements.namedItem("file") as HTMLInputElement;
      const file = input?.files?.[0];
      if (!file) {
        toast.error("Choose an Excel file first.");
        return;
      }
      if (!rightsConfirmed) {
        toast.error("Confirm that you have the right to upload and process this data.");
        return;
      }
      setUploading(true);
      try {
        const token = await getToken();
        const fd = new FormData();
        fd.append("file", file);
        if (needsOrgField && orgIdInput.trim()) {
          fd.append("orgId", orgIdInput.trim());
        }
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          imported?: number;
          warnings?: string[];
        };
        if (!res.ok) {
          throw new Error(body.error ?? `Upload failed (${res.status})`);
        }
        await fetch("/api/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "upload" })
        }).catch(() => undefined);
        toast.success(
          `Imported ${body.imported ?? 0} row(s).${body.warnings?.length ? " See warnings in response." : ""}`
        );
        await onUploadSuccess?.();
        input.value = "";
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [getToken, needsOrgField, orgIdInput, onUploadSuccess, rightsConfirmed]
  );

  return (
    <Card
      id="section-data-upload"
      className="scroll-mt-28 transition-shadow duration-150 hover:shadow-md"
    >
      <CardHeader>
        <CardTitle className="text-xl font-medium flex items-center gap-2">
          <Upload className="size-5" aria-hidden />
          Upload Excel
        </CardTitle>
        <CardDescription>
          Ingest licence rows into Convex for your organization. See the{" "}
          <a
            href="/data-policy"
            className="text-foreground font-medium underline-offset-2 hover:underline"
          >
            data policy (draft)
          </a>
          . Server storage requires{" "}
          <span className="text-foreground font-medium">BLOB_READ_WRITE_TOKEN</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          {needsOrgField ? (
            <div className="space-y-1">
              <label
                htmlFor="upload-org-id"
                className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Organization ID
              </label>
              <input
                id="upload-org-id"
                name="orgId"
                type="text"
                value={orgIdInput}
                onChange={(e) => setOrgIdInput(e.target.value)}
                placeholder="company_123"
                className="border-input bg-background w-full max-w-md rounded-md border px-3 py-2 text-sm"
                required
              />
              <p className="text-muted-foreground text-xs">
                Owners: required when your Clerk account has no orgId. Admins:
                orgId must match Clerk metadata (leave blank if set in Clerk).
              </p>
            </div>
          ) : null}
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(e) => setRightsConfirmed(e.target.checked)}
              className="border-input mt-1 size-4 rounded"
            />
            <span className="text-neutral-700 dark:text-neutral-300">
              I confirm I have the right to upload this file and to have the licence
              data processed and stored for my organization.
            </span>
          </label>
          <div className="space-y-1">
            <label
              htmlFor="upload-file"
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Excel file (.xlsx / .xls)
            </label>
            <input
              id="upload-file"
              name="file"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 dark:file:bg-neutral-800"
              required
            />
          </div>
          <Button type="submit" disabled={uploading || !rightsConfirmed}>
            {uploading ? "Uploading…" : "Upload and ingest"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
