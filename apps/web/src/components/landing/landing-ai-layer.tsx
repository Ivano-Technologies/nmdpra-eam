import { Bell, Brain, LineChart } from "lucide-react";

const items = [
  {
    title: "Weekly insights",
    body: "Digest what changed in your licence portfolio without manual triage.",
    icon: LineChart
  },
  {
    title: "Risk scoring",
    body: "Prioritize vendors and expiries using consistent, explainable signals.",
    icon: Brain
  },
  {
    title: "Alerts",
    body: "Surface what needs attention before it becomes an audit finding.",
    icon: Bell
  }
] as const;

export function LandingAiLayer() {
  return (
    <section className="border-y border-white/5 bg-[#111827]/40 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="font-heading text-brand-gold text-center text-3xl font-semibold md:text-4xl">
          Smart insights powered by your data
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-center text-sm md:text-base">
          Tie operational signals to decisions — weekly digests, risk ranks, and proactive
          alerts in one place.
        </p>
        <ul className="mt-12 grid gap-8 md:grid-cols-3">
          {items.map(({ title, body, icon: Icon }) => (
            <li
              key={title}
              className="flex flex-col items-center rounded-xl border border-white/5 bg-[#0F172A]/80 p-6 text-center"
            >
              <Icon className="mb-4 size-10 text-brand-gold/90" aria-hidden />
              <h3 className="font-heading text-lg text-white">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
