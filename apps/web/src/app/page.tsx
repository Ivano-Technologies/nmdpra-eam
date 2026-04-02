import { getPublicApiBase } from "@/lib/api";
import { PoweredByTechivano } from "@/components/brand/powered-by-techivano";
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  PRODUCT_LINE,
  PRODUCT_NAME
} from "@/lib/brand";
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
    <main className="flex flex-1 flex-col bg-gradient-to-b from-black to-[#14100d] text-[#f5f5f5]">
      <LandingTopNav />
      <LandingHero demoPdfHref={demoPdfHref} />
      <LandingTrustStrip />
      <LandingFeatures />
      <LandingWhoItsFor />
      <LandingShowcase />
      <LandingAiLayer />
      <LandingFinalCta />
      <footer className="text-muted-foreground border-t border-white/5 py-8 text-center text-sm">
        <div className="mx-auto max-w-5xl space-y-3 px-4">
          <p className="font-medium text-foreground/90">{BRAND_NAME}</p>
          <p className="text-foreground/85 text-sm font-semibold">{PRODUCT_NAME}</p>
          <p className="text-muted-foreground text-xs">{PRODUCT_LINE}</p>
          <p className="text-slate-400 text-xs md:text-sm">{BRAND_TAGLINE}</p>
          <p>
            <a
              href="https://eam.techivano.com"
              className="text-brand-gold underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              eam.techivano.com
            </a>
          </p>
          <div className="pt-2">
            <PoweredByTechivano className="text-center" />
          </div>
        </div>
      </footer>
    </main>
  );
}
