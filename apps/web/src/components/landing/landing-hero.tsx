"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

type LandingHeroProps = {
  demoPdfHref: string;
};

export function LandingHero({ demoPdfHref }: LandingHeroProps) {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 pb-16 pt-12 text-center md:pb-24">
      <p className="text-muted-foreground mb-4 max-w-xl text-xs uppercase tracking-widest">
        Pilot / demonstration
      </p>
      <h1 className="font-heading text-brand-gold max-w-4xl text-4xl font-semibold tracking-tight drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] md:text-6xl">
        Stay Ahead of Regulatory Risk
      </h1>
      <p className="text-muted-foreground mt-4 max-w-2xl text-lg md:text-xl">
        Track licenses, detect compliance gaps, and generate audit-ready reports — all in one
        platform.
      </p>
      <Show when="signed-out">
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <SignUpButton mode="modal">
            <Button
              size="lg"
              className="bg-brand-gold text-black hover:bg-brand-gold/90"
            >
              Get Started
            </Button>
          </SignUpButton>
          <Button variant="outline" size="lg" className="border-white/10 bg-transparent" asChild>
            <a href={demoPdfHref} target="_blank" rel="noreferrer">
              <FileText className="mr-2 size-4" />
              View Demo
            </a>
          </Button>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" className="bg-brand-gold text-black hover:bg-brand-gold/90" asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </Show>
      <p className="text-muted-foreground mt-8 max-w-2xl text-sm">
        Context: Nigerian Midstream and Downstream Petroleum Regulatory Authority
        (NMDPRA) vendor licensing — informational demo only.
      </p>
    </section>
  );
}

export function LandingTopNav() {
  return (
    <header className="border-b border-white/5 bg-[#0F172A]/85 sticky top-0 z-50 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <span className="font-heading text-sm font-semibold tracking-tight text-white">
          RMLIS
        </span>
        <nav className="flex items-center gap-3">
          <Show when="signed-in">
            <span className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white/90 hover:bg-white/10" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserButton />
            </span>
          </Show>
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-white/90 hover:bg-white/10">
                  Login
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  Sign up
                </Button>
              </SignUpButton>
            </div>
          </Show>
        </nav>
      </div>
    </header>
  );
}
