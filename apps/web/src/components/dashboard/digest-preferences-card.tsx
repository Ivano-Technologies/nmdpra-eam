"use client";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { DigestPreferences } from "@/types/user-preferences";

type Props = {
  digest: DigestPreferences | undefined;
  saving: boolean;
  onSave: (next: DigestPreferences) => void | Promise<void>;
};

function minutesToTimeStr(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = Math.round(m) % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function timeStrToMinutes(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) {
    return 22 * 60;
  }
  const h = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
  return h * 60 + min;
}

export function DigestPreferencesCard({ digest, saving, onSave }: Props) {
  const freq: "daily" | "weekly" | "off" =
    digest?.frequency ?? digest?.emailFrequency ?? "weekly";
  const startStr = useMemo(() => {
    if (digest?.quietHours && typeof digest.quietHours.start === "number") {
      return minutesToTimeStr(digest.quietHours.start);
    }
    return digest?.quietHoursStart ?? "22:00";
  }, [digest]);

  const endStr = useMemo(() => {
    if (digest?.quietHours && typeof digest.quietHours.end === "number") {
      return minutesToTimeStr(digest.quietHours.end);
    }
    return digest?.quietHoursEnd ?? "07:00";
  }, [digest]);

  const [frequency, setFrequency] = useState(freq);
  const [quietStart, setQuietStart] = useState(startStr);
  const [quietEnd, setQuietEnd] = useState(endStr);
  const [inAppBanner, setInAppBanner] = useState(
    digest?.inAppBanner ?? digest?.inAppOnly ?? true
  );

  const submit = useCallback(() => {
    const qhStart = timeStrToMinutes(quietStart);
    const qhEnd = timeStrToMinutes(quietEnd);
    void onSave({
      frequency,
      emailFrequency: frequency,
      quietHours: { start: qhStart, end: qhEnd },
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd,
      inAppOnly: inAppBanner,
      inAppBanner
    });
  }, [frequency, quietStart, quietEnd, inAppBanner, onSave]);

  return (
    <Card className="scroll-mt-28">
      <CardHeader>
        <CardTitle className="text-xl font-medium">Digest & quiet hours</CardTitle>
        <CardDescription>
          Preferences for report cadence (used with email subscriptions). Phase 3
          will unify with a notification dispatcher.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="digest-freq" className="text-sm font-medium">
            Email digest frequency
          </label>
          <select
            id="digest-freq"
            className="border-input bg-background w-full max-w-xs rounded-md border px-3 py-2 text-sm"
            value={frequency ?? "weekly"}
            onChange={(e) =>
              setFrequency(
                e.target.value as "daily" | "weekly" | "off"
              )
            }
          >
            <option value="off">Off (in-app only)</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="quiet-start" className="text-sm font-medium">
              Quiet hours start
            </label>
            <input
              id="quiet-start"
              type="time"
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="quiet-end" className="text-sm font-medium">
              Quiet hours end
            </label>
            <input
              id="quiet-end"
              type="time"
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="border-input mt-1 size-4 rounded"
            checked={inAppBanner}
            onChange={(e) => setInAppBanner(e.target.checked)}
          />
          <span>Show in-app summary banner on login (when digest matches)</span>
        </label>
        <Button type="button" onClick={submit} disabled={saving}>
          {saving ? "Saving…" : "Save digest preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
