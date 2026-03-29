import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Radar, FileBarChart, ShieldAlert } from "lucide-react";

import { FooterCta } from "@/components/landing/footer-cta";
import { HeroActions } from "@/components/landing/hero-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getPublicApiBase } from "@/lib/api";

const features = [
  {
    title: "Expiry radar",
    description: "Track upcoming expiries across vendors and licence types.",
    icon: Radar
  },
  {
    title: "Risk scoring",
    description: "Identify high-risk vendors before issues become incidents.",
    icon: ShieldAlert
  },
  {
    title: "Automated reports",
    description: "Generate PDF reports instantly for stakeholders.",
    icon: FileBarChart
  }
] as const;

export default async function HomePage() {
  const apiBase = getPublicApiBase();
  const demoPdfHref = `${apiBase}/reports/mvp.pdf`;

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b bg-card/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-sm font-semibold tracking-tight">RMLIS</span>
          <nav className="flex items-center gap-3">
            <Show when="signed-in">
              <span className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <UserButton />
              </span>
            </Show>
            <Show when="signed-out">
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="outline" size="sm">
                    Sign up
                  </Button>
                </SignUpButton>
              </div>
            </Show>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center md:py-24">
        <p className="text-muted-foreground max-w-xl text-xs uppercase tracking-widest">
          Pilot / demonstration
        </p>
        <h1 className="text-foreground max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          Regulatory Intelligence System (RMLIS)
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg md:text-xl">
          Real-time monitoring of vendor license compliance
        </p>
        <Show when="signed-out">
          <HeroActions demoPdfHref={demoPdfHref} />
        </Show>
        <Show when="signed-in">
          <Button size="lg" asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </Show>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Context: Nigerian Midstream and Downstream Petroleum Regulatory
          Authority (NMDPRA) vendor licensing — informational demo only.
        </p>
      </section>

      <section className="bg-muted/40 border-y py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 md:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border-border/80 shadow-sm">
              <CardHeader>
                <Icon className="text-primary mb-2 size-8" aria-hidden />
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="mb-6 text-center text-2xl font-semibold">
          Sample report
        </h2>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          Open the latest MVP PDF in a new tab (recommended over embedding while
          CSP is strict).
        </p>
        <div className="flex justify-center">
          <Button variant="outline" size="lg" asChild>
            <a href={demoPdfHref} target="_blank" rel="noreferrer">
              View sample report
            </a>
          </Button>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Start monitoring compliance today
          </h2>
          <Show when="signed-out">
            <FooterCta />
          </Show>
          <Show when="signed-in">
            <Button
              size="lg"
              variant="secondary"
              className="text-secondary-foreground"
              asChild
            >
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </Show>
        </div>
      </section>

      <footer className="text-muted-foreground border-t py-8 text-center text-sm">
        <div className="mx-auto max-w-5xl space-y-2 px-4">
          <p>RMLIS — Regulatory Intelligence System</p>
          <p>
            Powered by Techivano ·{" "}
            <a
              href="https://eam.techivano.com"
              className="text-primary underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              eam.techivano.com
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
