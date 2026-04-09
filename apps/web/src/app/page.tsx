import { PoweredByTechivano } from "@/components/brand/powered-by-techivano";
import { LandingAiLayer } from "@/components/landing/landing-ai-layer";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { LandingHero, LandingTopNav } from "@/components/landing/landing-hero";
import { LandingShowcase } from "@/components/landing/landing-showcase";

export default async function HomePage() {
  return (
    <main className="text-foreground flex flex-1 flex-col">
      <LandingTopNav />
      <LandingHero />
      <LandingFeatures />
      <LandingShowcase />
      <LandingAiLayer />
      <LandingFinalCta />
      <footer className="text-muted-foreground py-6 text-center text-xs">
        <PoweredByTechivano />
      </footer>
    </main>
  );
}
