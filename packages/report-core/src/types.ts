import { z } from "zod";

export type VegaLiteSpec = Record<string, unknown>;

export type ReportSection =
  | { type: "text"; content: string }
  | { type: "table"; columns: string[]; rows: unknown[][] }
  | { type: "chart"; spec: VegaLiteSpec; title?: string };

export type Report = {
  meta: {
    title: string;
    generatedAt: string;
  };
  sections: ReportSection[];
};

const TableSectionSchema = z.object({
  type: z.literal("table"),
  columns: z.array(z.string()).min(1),
  rows: z.array(z.array(z.unknown()))
});

const TextSectionSchema = z.object({
  type: z.literal("text"),
  content: z.string().min(1)
});

const ChartSectionSchema = z.object({
  type: z.literal("chart"),
  spec: z.record(z.unknown()),
  title: z.string().optional()
});

export const ReportSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    generatedAt: z
      .string()
      .datetime({ offset: true })
  }),
  sections: z.array(z.union([TextSectionSchema, TableSectionSchema, ChartSectionSchema])).min(1)
});

export function validateReport(input: unknown): Report {
  return ReportSchema.parse(input) as Report;
}
