import { BarChart3, FolderOutput, ShieldAlert } from "lucide-react";

const cardLift =
  "transition duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-white/10 hover:shadow-xl hover:shadow-black/30";

const features = [
  {
    title: "Unified Visibility",
    description:
      "One lens across licences and assets — turn fragmented data into a single operational picture.",
    icon: BarChart3
  },
  {
    title: "Intelligent Risk Detection",
    description:
      "Prioritize what matters with explainable signals, not just raw counts.",
    icon: ShieldAlert
  },
  {
    title: "Audit-Ready Intelligence",
    description:
      "Export evidence and narratives stakeholders can defend — insight first, spreadsheets second.",
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
            className={`border-border bg-card rounded-xl border p-6 shadow-lg shadow-black/10 dark:shadow-black/20 ${cardLift}`}
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
