"use client";

import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function LandingFinalCta() {
  return (
    <section className="border-border bg-muted/80 border-y py-16 dark:bg-muted/40">
      <div className="mx-auto flex max-w-5xl justify-center px-4">
        <Show when="signed-out">
          <SignUpButton mode="modal">
            <Button size="lg" className="bg-black font-semibold text-white hover:bg-black/90">
              Get Started
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <Button
            size="lg"
            className="bg-black font-semibold text-white hover:bg-black/90"
            asChild
          >
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </Show>
      </div>
    </section>
  );
}
