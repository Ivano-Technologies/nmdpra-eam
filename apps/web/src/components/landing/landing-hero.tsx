"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { FileText } from "lucide-react";

import { TechivanoLogo } from "@/components/brand/techivano-logo";
import { Button } from "@/components/ui/button";

type LandingHeroProps = {
  demoPdfHref: string;
};

export function LandingHero({ demoPdfHref }: LandingHeroProps) {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 pb-16 pt-12 text-center md:pb-24">
      <h1 className="font-heading text-foreground max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
        Techivano EAM
      </h1>
      <p className="text-muted-foreground mt-4 max-w-2xl text-lg md:text-xl">
        Operational Intelligence for National Infrastructure
      </p>
      <Show when="signed-out">
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <SignUpButton mode="modal">
            <Button size="lg" className="bg-black font-semibold text-white hover:bg-black/90">
              Get Started
            </Button>
          </SignUpButton>
          <Button variant="outline" size="lg" className="border-border bg-transparent" asChild>
            <a href={demoPdfHref} target="_blank" rel="noreferrer">
              <FileText className="mr-2 size-4" />
              View Demo
            </a>
          </Button>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" className="bg-black font-semibold text-white hover:bg-black/90" asChild>
            <Link href="/dashboard">Go to dashboard</Link>
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
