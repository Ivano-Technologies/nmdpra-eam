import { BarChart3, FolderOutput, ShieldAlert } from "lucide-react";

const cardLift =
  "transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-white/10 hover:shadow-xl hover:shadow-black/30";

const features = [
  {
    title: "License monitoring",
    description: "Real-time tracking across assets and licence types.",
    icon: BarChart3
  },
  {
    title: "Risk scoring",
    description: "Instant visibility into compliance gaps and exposure.",
    icon: ShieldAlert
  },
  {
    title: "Reporting",
    description: "Export-ready audit reports for stakeholders.",
    icon: FolderOutput
  }
] as const;

export function LandingFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-6 md:grid-cols-3">
        {features.map(({ title, description, icon: Icon }) => (
          <div
            key={title}
            className={`rounded-xl border border-white/5 bg-[#14100d]/90 p-6 shadow-lg shadow-black/20 ${cardLift}`}
          >
            <Icon className="mb-3 size-8 text-brand-gold" aria-hidden />
            <h3 className="font-heading text-lg font-medium text-brand-gold">{title}</h3>
            <p className="mt-2 text-sm text-gray-400">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
