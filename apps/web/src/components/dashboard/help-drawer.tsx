"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const GLOSSARY: Array<{ term: string; def: string }> = [
  {
    term: "Expiry bands",
    def: "Licences are grouped by how soon they expire: expired, critical (≤30 days), warning (31–60 days), or safe (>60 days)."
  },
  {
    term: "Risk score",
    def: "A composite score used to rank vendors; higher values indicate more attention needed."
  },
  {
    term: "MVP report",
    def: "The current compliance snapshot generated from ingested licence data."
  }
];

export function HelpDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground gap-1.5"
        onClick={() => setOpen(true)}
        aria-expanded={open}
      >
        <HelpCircle className="size-4" aria-hidden />
        Help
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[90] bg-black/40"
            aria-label="Close help"
            onClick={() => setOpen(false)}
          />
          <div
            className="border-border bg-background fixed top-0 right-0 z-[95] flex h-full w-full max-w-md flex-col border-l shadow-lg"
            role="dialog"
            aria-labelledby="help-drawer-title"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 id="help-drawer-title" className="text-lg font-semibold">
                Help
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Glossary</CardTitle>
                  <CardDescription>Quick definitions for dashboard terms.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {GLOSSARY.map(({ term, def }) => (
                    <div key={term}>
                      <p className="text-foreground font-medium">{term}</p>
                      <p className="text-muted-foreground">{def}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {process.env.NEXT_PUBLIC_HELP_VIDEO_UPLOAD?.trim() ? (
                <p className="text-sm">
                  <a
                    href={process.env.NEXT_PUBLIC_HELP_VIDEO_UPLOAD.trim()}
                    className="text-primary font-medium underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Watch: data upload walkthrough
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
