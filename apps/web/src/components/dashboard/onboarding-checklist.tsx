"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UserPreferencesDoc } from "@/types/user-preferences";

type Step = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
  hash?: string;
};

type Props = {
  preferences: UserPreferencesDoc | null;
  termsAccepted: boolean;
  orgConfirmed: boolean;
  onDismiss: () => void;
};

export function OnboardingChecklist({
  preferences,
  termsAccepted,
  orgConfirmed,
  onDismiss
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const dismissed = preferences?.onboardingSteps?.checklistDismissed === true;

  const steps: Step[] = useMemo(() => {
    const o = preferences?.onboardingSteps ?? {};
    return [
      {
        id: "terms",
        label: "Accept data usage terms",
        done: termsAccepted || o.termsAccepted === true
      },
      {
        id: "org",
        label: "Confirm organization (org in Clerk or upload form)",
        done: orgConfirmed || o.orgConfirmed === true
      },
      {
        id: "upload",
        label: "Upload your first licence file",
        done: o.firstUpload === true
      },
      {
        id: "subscription",
        label: "Verify a report email subscription (owners)",
        done: o.reportSubscriptionVerified === true
      },
      {
        id: "teammate",
        label: "Invite a teammate",
        done: o.inviteTeammate === true,
        href: "https://clerk.com/docs/organizations/invitations"
      }
    ];
  }, [preferences?.onboardingSteps, termsAccepted, orgConfirmed]);

  const allDone = steps.every((s) => s.done);

  if (dismissed || allDone) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Getting started</CardTitle>
            <CardDescription>
              Complete these steps to get the most from Ivano IQ.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <>
                  Expand <ChevronDown className="ml-1 size-4" aria-hidden />
                </>
              ) : (
                <>
                  Collapse <ChevronUp className="ml-1 size-4" aria-hidden />
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </CardHeader>
      {!collapsed ? (
        <CardContent>
          <ul className="space-y-2 text-sm">
            {steps.map((s) => (
              <li
                key={s.id}
                className={cn(
                  "flex flex-wrap items-center gap-2",
                  s.done && "text-muted-foreground line-through"
                )}
              >
                <span aria-hidden>{s.done ? "✓" : "○"}</span>
                <span>{s.label}</span>
                {s.href && !s.done ? (
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs font-medium underline-offset-2 hover:underline"
                  >
                    Open
                  </a>
                ) : null}
                {s.id === "upload" && !s.done ? (
                  <Link
                    href="/dashboard#section-data-upload"
                    className="text-primary text-xs font-medium underline-offset-2 hover:underline"
                  >
                    Go to upload
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}
