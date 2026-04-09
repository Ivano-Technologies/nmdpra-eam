import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer
} from "@react-pdf/renderer";
import { renderChartToSVG } from "./renderChartToSVG";
import type { Report, ReportSection } from "./types";
import { validateReport } from "./types";

type ResolvedSection =
  | { type: "text"; content: string }
  | { type: "table"; columns: string[]; rows: unknown[][] }
  | { type: "chart"; title?: string; svg: string };

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: {
    fontSize: 18,
    marginBottom: 12,
    fontFamily: "Helvetica",
    fontWeight: "bold"
  },
  meta: { fontSize: 9, color: "#444444", marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "bold"
  },
  bodyText: { marginBottom: 8, lineHeight: 1.4 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 4,
    marginBottom: 4
  },
  tableRow: { flexDirection: "row", paddingVertical: 2 },
  cell: { flex: 1, fontSize: 8, paddingRight: 4 },
  chart: { width: 400, height: 220, marginTop: 8, objectFit: "contain" }
});

function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function SectionBlock({ section }: { section: ResolvedSection }) {
  if (section.type === "text") {
    return (
      <View wrap={false}>
        <Text style={styles.bodyText}>{section.content}</Text>
      </View>
    );
  }

  if (section.type === "table") {
    return (
      <View wrap={false}>
        <Text style={styles.sectionTitle}>Table</Text>
        <View style={styles.tableHeader}>
          {section.columns.map((col, ci) => (
            <Text key={ci} style={[styles.cell, { fontWeight: "bold" }]}>
              {col}
            </Text>
          ))}
        </View>
        {section.rows.map((row, ri) => (
          <View key={ri} style={styles.tableRow}>
            {section.columns.map((_, ci) => (
              <Text key={ci} style={styles.cell}>
                {cellText(row[ci])}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  }

  const svgUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    section.svg
  )}`;

  return (
    <View wrap={false}>
      {section.title ? (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      ) : null}
      <Image style={styles.chart} src={svgUri} />
    </View>
  );
}

function ReportDocument({
  report,
  sections
}: {
  report: Report;
  sections: ResolvedSection[];
}) {
  return (
    <Document title={report.meta.title}>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>{report.meta.title}</Text>
        <Text style={styles.meta}>Generated: {report.meta.generatedAt}</Text>
        {sections.map((section, i) => (
          <SectionBlock key={i} section={section} />
        ))}
      </Page>
    </Document>
  );
}

export async function renderReportToPDF(report: Report): Promise<Buffer> {
  const validated = validateReport(report);
  const resolvedSections: ResolvedSection[] = await Promise.all(
    validated.sections.map(async (section: ReportSection) => {
      if (section.type !== "chart") {
        return section;
      }
      const svg = await renderChartToSVG(section.spec);
      return { type: "chart" as const, title: section.title, svg };
    })
  );

  const element = (
    <ReportDocument report={validated} sections={resolvedSections} />
  );
  return renderToBuffer(element);
}
