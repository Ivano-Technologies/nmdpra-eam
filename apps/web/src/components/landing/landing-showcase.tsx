"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ShowcaseItem = {
  title: string;
  description: string;
  src: string;
  alt: string;
  reverse?: boolean;
};

const items: ShowcaseItem[] = [
  {
    title: "See all your licences in one place",
    description: "Unified visibility across assets, vendors, and licence types.",
    src: "/dashboard-overview.png",
    alt: "Dashboard overview with KPIs and risk summary"
  },
  {
    title: "Identify risks before regulators do",
    description: "Ranked risk scores and expiry signals so you act first.",
    src: "/risk-overview.png",
    alt: "Risk ranking and alerts",
    reverse: true
  },
  {
    title: "Generate reports in seconds",
    description: "Export-ready PDFs and email delivery for audit workflows.",
    src: "/reports.png",
    alt: "Reports and export options"
  }
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function ShowcaseRow({ item }: { item: ShowcaseItem }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-2 md:gap-12"
    >
      <div
        className={cn(
          "transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100",
          item.reverse ? "md:order-2" : "",
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        )}
      >
        <h2 className="font-heading text-2xl font-semibold text-brand-gold md:text-3xl">
          {item.title}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm md:text-base">{item.description}</p>
      </div>
      <div
        className={cn(
          "transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100",
          item.reverse ? "md:order-1" : "",
          visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        )}
        style={{ transitionDelay: visible ? "80ms" : "0ms" }}
      >
        <div className="border-border bg-foreground/95 rounded-xl border p-2 shadow-2xl shadow-black/25 dark:bg-black dark:shadow-black/40">
          <div className="flex gap-2 px-2 pb-2 pt-1" aria-hidden>
            <span className="size-2 rounded-full bg-red-500" />
            <span className="size-2 rounded-full bg-yellow-500" />
            <span className="size-2 rounded-full bg-[#deaf5f]" />
          </div>
          <div className="bg-card rounded-lg p-2">
            <Image
              src={item.src}
              alt={item.alt}
              width={1200}
              height={675}
              className="h-auto w-full rounded-md"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={item.src === "/dashboard-overview.png"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingShowcase() {
  return (
    <section className="space-y-20 py-20 md:space-y-28 md:py-28" aria-label="Product showcase">
      {items.map((item) => (
        <ShowcaseRow key={item.src} item={item} />
      ))}
    </section>
  );
}
