"use client";

import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";

import { TechivanoMark } from "@/components/brand/techivano-mark";
import { PoweredByTechivano } from "@/components/brand/powered-by-techivano";
import { Button } from "@/components/ui/button";

export function LandingFinalCta() {
  return (
    <section className="bg-brand-gold py-16 text-black">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center">
        <div className="group/logo flex flex-col items-center gap-3">
          <TechivanoMark variant="gold" size={44} motion="hover-tilt" decorative />
          <h2 className="font-heading text-3xl font-semibold md:text-4xl">
            Stay compliant. Stay ahead.
          </h2>
        </div>
        <Show when="signed-out">
          <SignUpButton mode="modal">
            <Button size="lg" className="bg-black font-semibold text-[#f5f5f5] hover:bg-black/90">
              Get Started
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <Button
            size="lg"
            className="bg-black font-semibold text-[#f5f5f5] hover:bg-black/90"
            asChild
          >
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </Show>
        <PoweredByTechivano variant="dark" className="opacity-80" />
      </div>
    </section>
  );
}
