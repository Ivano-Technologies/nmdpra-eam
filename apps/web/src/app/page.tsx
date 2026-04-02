import { getPublicApiBase } from "@/lib/api";
import { PoweredByTechivano } from "@/components/brand/powered-by-techivano";
import { BRAND_TAGLINE, PRODUCT_LINE } from "@/lib/brand";
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
    <main className="text-foreground flex flex-1 flex-col">
      <LandingTopNav />
      <LandingHero demoPdfHref={demoPdfHref} />
      <LandingTrustStrip />
      <LandingFeatures />
      <LandingWhoItsFor />
      <LandingShowcase />
      <LandingAiLayer />
      <LandingFinalCta />
      <footer className="border-border border-t py-10 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4">
          <p className="text-muted-foreground text-sm">{PRODUCT_LINE}</p>
          <p className="text-muted-foreground text-xs leading-relaxed md:text-sm">{BRAND_TAGLINE}</p>
          <PoweredByTechivano className="text-center" />
        </div>
      </footer>
    </main>
  );
}
