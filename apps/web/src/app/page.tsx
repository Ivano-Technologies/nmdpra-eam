import { getPublicApiBase } from "@/lib/api";
import { LandingAiLayer } from "@/components/landing/landing-ai-layer";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { LandingHero, LandingTopNav } from "@/components/landing/landing-hero";
import { LandingShowcase } from "@/components/landing/landing-showcase";
import { LandingTrustStrip } from "@/components/landing/landing-trust-strip";
import { LandingWhoItsFor } from "@/components/landing/landing-who-its-for";

export default async function HomePage() {
  const apiBase = getPublicApiBase();
  const demoPdfHref = `${apiBase}/reports/mvp.pdf`;

  return (
    <main className="flex flex-1 flex-col bg-gradient-to-b from-[#0F172A] to-[#020617] text-white">
      <LandingTopNav />
      <LandingHero demoPdfHref={demoPdfHref} />
      <LandingTrustStrip />
      <LandingFeatures />
      <LandingWhoItsFor />
      <LandingShowcase />
      <LandingAiLayer />
      <LandingFinalCta />
      <footer className="text-muted-foreground border-t border-white/5 py-8 text-center text-sm">
        <div className="mx-auto max-w-5xl space-y-2 px-4">
          <p>RMLIS — Regulatory Intelligence System</p>
          <p>
            Powered by Techivano ·{" "}
            <a
              href="https://eam.techivano.com"
              className="text-brand-gold underline-offset-4 hover:underline"
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
