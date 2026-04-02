"use client";

import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export function LandingFinalCta() {
  return (
    <section className="bg-brand-gold py-16 text-black">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center">
        <h2 className="font-heading text-3xl font-semibold md:text-4xl">
          Stay compliant. Stay ahead.
        </h2>
        <Show when="signed-out">
          <SignUpButton mode="modal">
            <Button size="lg" className="bg-[#0F172A] font-semibold text-white hover:bg-[#0F172A]/90">
              Get Started
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <Button
            size="lg"
            className="bg-[#0F172A] font-semibold text-white hover:bg-[#0F172A]/90"
            asChild
          >
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </Show>
      </div>
    </section>
  );
}
