"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { FileText } from "lucide-react";

import { TechivanoLogo } from "@/components/brand/techivano-logo";
import { Button } from "@/components/ui/button";

type LandingHeroProps = {
  demoPdfHref: string;
};

const heroCtaBase =
  "landing-cta-3d min-h-12 px-5 py-3 text-sm sm:min-h-14 sm:px-8 sm:py-3.5 sm:text-base";

export function LandingHero({ demoPdfHref }: LandingHeroProps) {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 pb-16 pt-12 text-center md:pb-24">
      <h1 className="font-brand text-[#D4AF37] max-w-[min(100%,42rem)] text-5xl font-bold leading-none tracking-[0.08em] sm:text-6xl md:text-7xl lg:text-8xl">
        IVANO IQ
      </h1>
      <Show when="signed-out">
        <div className="mt-10 flex w-full max-w-xl flex-wrap items-center justify-center gap-4 sm:gap-5">
          <SignUpButton mode="modal">
            <Button
              size="lg"
              className={`${heroCtaBase} bg-black text-white hover:bg-black/90 dark:bg-brand-gold dark:text-black dark:hover:bg-brand-gold/90`}
            >
              Get Started
            </Button>
          </SignUpButton>
          <Button variant="outline" size="lg" className={`${heroCtaBase} border-border bg-background/80`} asChild>
            <a href={demoPdfHref} target="_blank" rel="noreferrer">
              <FileText className="mr-2 size-4 shrink-0" />
              View Demo
            </a>
          </Button>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="mt-10 flex w-full max-w-2xl flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:gap-5">
          <Button
            size="lg"
            className={`${heroCtaBase} bg-black text-white hover:bg-black/90 dark:bg-brand-gold dark:text-black dark:hover:bg-brand-gold/90`}
            asChild
          >
            <a href="#platform">Explore the platform</a>
          </Button>
          <Button
            size="lg"
            className={`${heroCtaBase} bg-black text-white hover:bg-black/90 dark:bg-brand-gold dark:text-black dark:hover:bg-brand-gold/90`}
            asChild
          >
            <Link href="/dashboard">Open Dashboard</Link>
          </Button>
        </div>
      </Show>
    </section>
  );
}

export function LandingTopNav() {
  return (
    <header className="bg-app-header-glass sticky top-0 z-50 border-border border-b backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <TechivanoLogo
          href="/"
          size="sm"
          markVariant="gold"
          compact="responsive"
          motion="hover-tilt"
          className="min-w-0"
        />
        <nav className="flex items-center gap-3">
          <Show when="signed-in">
            <span className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-foreground/90 hover:bg-muted" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserButton />
            </span>
          </Show>
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-foreground/90 hover:bg-muted">
                  Login
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border bg-muted/50 text-foreground hover:bg-muted"
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
