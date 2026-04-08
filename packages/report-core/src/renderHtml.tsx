import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { Report } from "./types";

type ChartSvgSection = {
  type: "chart";
  title?: string;
  svg: string;
};

type ResolvedSection = Exclude<Report["sections"][number], { type: "chart" }> | ChartSvgSection;

export function renderHtml(report: Report, sections: ResolvedSection[]): string {
  const sectionNodes = sections.map((section, idx) => {
    if (section.type === "text") {
      return h("p", { key: `text-${idx}` }, section.content);
    }
    if (section.type === "table") {
      return h(
        "table",
        { key: `table-${idx}` },
        h(
          "thead",
          null,
          h(
            "tr",
            null,
            ...section.columns.map((c) => h("th", { key: c }, c))
          )
        ),
        h(
          "tbody",
          null,
          ...section.rows.map((row, rowIdx) =>
            h(
              "tr",
              { key: `row-${rowIdx}` },
              ...row.map((cell, colIdx) =>
                h("td", { key: `cell-${rowIdx}-${colIdx}` }, String(cell))
              )
            )
          )
        )
      );
    }
    return h(
      "section",
      { key: `chart-${idx}`, className: "chart" },
      section.title ? h("h2", null, section.title) : null,
      h("div", { dangerouslySetInnerHTML: { __html: section.svg } })
    );
  });

  const markup = renderToStaticMarkup(
    h(
      "html",
      null,
      h(
        "head",
        null,
        h("meta", { charSet: "utf-8" }),
        h("title", null, report.meta.title),
        h("style", null, `
          @page { size: A4; margin: 1.5cm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; }
          h1 { font-size: 22px; margin: 0 0 8px 0; }
          h2 { font-size: 16px; margin: 12px 0 8px 0; }
          .muted { color: #555; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          .chart { margin: 12px 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `)
      ),
      h(
        "body",
        null,
        h("h1", null, report.meta.title),
        h("p", { className: "muted" }, `Generated at: ${report.meta.generatedAt}`),
        ...sectionNodes
      )
    )
  );

  return `<!DOCTYPE html>${markup}`;
}
