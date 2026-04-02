import { Building2, Scale, Shield } from "lucide-react";

const audiences = [
  {
    title: "For regulators",
    body: "Oversight-ready views, evidence trails, and consistent reporting across operators.",
    icon: Scale
  },
  {
    title: "For operators",
    body: "One place to track asset-level licences, expiries, and vendor exposure.",
    icon: Building2
  },
  {
    title: "For compliance teams",
    body: "Proactive alerts, risk ranking, and audit packs without spreadsheet chaos.",
    icon: Shield
  }
] as const;

const cardClass =
  "rounded-xl border border-white/5 bg-gradient-to-b from-[#1a1410]/95 to-black/90 p-6 shadow-lg shadow-black/25 transition duration-200 hover:scale-[1.02] hover:border-[#deaf5f]/20 hover:shadow-xl";

export function LandingWhoItsFor() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h2 className="font-heading text-center text-2xl font-semibold text-brand-gold md:text-3xl">
        Who it&apos;s for
      </h2>
      <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center text-sm">
        Built for high-stakes licensing workflows — clarity for every stakeholder.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {audiences.map(({ title, body, icon: Icon }) => (
          <div key={title} className={cardClass}>
            <Icon className="mb-4 size-9 text-brand-gold/90" aria-hidden />
            <h3 className="font-heading text-lg font-medium text-white">{title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
