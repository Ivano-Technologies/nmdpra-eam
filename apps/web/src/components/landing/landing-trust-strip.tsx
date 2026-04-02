export function LandingTrustStrip() {
  return (
    <section className="border-y border-white/5 py-10 text-center">
      <p className="text-sm text-gray-400">
        Trusted by regulators, operators, and compliance teams
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs text-gray-500">
        <span>Real-time monitoring</span>
        <span>Audit-ready reporting</span>
        <span>Risk intelligence</span>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-8 text-sm">
        <div>
          <p className="font-heading text-brand-gold text-xl">1,200+</p>
          <p className="text-gray-500">Licences tracked</p>
        </div>
        <div>
          <p className="font-heading text-brand-gold text-xl">30+</p>
          <p className="text-gray-500">Organizations</p>
        </div>
        <div>
          <p className="font-heading text-brand-gold text-xl">99.9%</p>
          <p className="text-gray-500">Uptime</p>
        </div>
      </div>
    </section>
  );
}
