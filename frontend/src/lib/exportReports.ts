export type ExportSection = {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  /** Merge repeated values in the first column (category) for CSV/PDF exports only */
  mergeCategoryColumn?: boolean;
};

export type ExportSummaryItem = {
  label: string;
  value: string;
  /** Highlight this row in PDF summary and matching section rows */
  highlight?: boolean;
};

export type ExportReportPayload = {
  title: string;
  subtitle?: string;
  filename: string;
  summary?: ExportSummaryItem[];
  sections: ExportSection[];
  /** PDF table header color theme (CSV exports are unchanged) */
  pdfTheme?: PdfReportThemeKey;
};

export type PdfReportTheme = {
  header: [number, number, number];
  grandTotalFill: [number, number, number];
  grandTotalText: [number, number, number];
};

export const PDF_REPORT_THEMES = {
  dailySales: {
    header: [74, 68, 209],
    grandTotalFill: [224, 231, 255],
    grandTotalText: [67, 56, 202],
  },
  monthlyPnl: {
    header: [22, 163, 74],
    grandTotalFill: [220, 252, 231],
    grandTotalText: [21, 128, 61],
  },
  dailyStock: {
    header: [219, 39, 119],
    grandTotalFill: [252, 231, 243],
    grandTotalText: [190, 24, 93],
  },
  purchasing: {
    header: [234, 88, 12],
    grandTotalFill: [255, 237, 213],
    grandTotalText: [194, 65, 12],
  },
  sales: {
    header: [37, 99, 235],
    grandTotalFill: [219, 234, 254],
    grandTotalText: [29, 78, 216],
  },
  topProducts: {
    header: [13, 148, 136],
    grandTotalFill: [204, 251, 241],
    grandTotalText: [15, 118, 110],
  },
  overview: {
    header: [79, 70, 229],
    grandTotalFill: [224, 231, 255],
    grandTotalText: [67, 56, 202],
  },
} satisfies Record<string, PdfReportTheme>;

export type PdfReportThemeKey = keyof typeof PDF_REPORT_THEMES;

const DEFAULT_PDF_THEME: PdfReportTheme = PDF_REPORT_THEMES.overview;

export function getPdfReportTheme(key?: PdfReportThemeKey): PdfReportTheme {
  return key ? PDF_REPORT_THEMES[key] : DEFAULT_PDF_THEME;
}

export const SHOP_NAME = process.env.NEXT_PUBLIC_SHOP_NAME || "SISILA BEER";

export function buildDocumentTitle(reportTitle: string): string {
  return `${SHOP_NAME} - ${reportTitle.toUpperCase()}`;
}

type PdfCell =
  | string
  | {
      content: string;
      rowSpan?: number;
      styles?: {
        valign?: "top" | "middle" | "bottom";
        fillColor?: [number, number, number];
        textColor?: [number, number, number];
        fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
      };
    };


function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isGrandTotalLabel(label: string): boolean {
  return label.toLowerCase().includes("grand total");
}

function isHighlightLabel(label: string, highlights: Set<string>): boolean {
  const normalized = normalizeLabel(label);
  for (const highlight of highlights) {
    const normalizedHighlight = normalizeLabel(highlight);
    if (
      normalized === normalizedHighlight ||
      normalized.includes(normalizedHighlight) ||
      normalizedHighlight.includes(normalized)
    ) {
      return true;
    }
  }
  return false;
}

function collectHighlightLabels(summary?: ExportSummaryItem[]): Set<string> {
  const labels = new Set<string>();
  summary?.forEach((item) => {
    if (!item.highlight) return;
    labels.add(item.label);
    if (normalizeLabel(item.label) === "nettotal") {
      labels.add("Grand Total (Net)");
    }
    if (normalizeLabel(item.label) === "revenue") {
      labels.add("Total Revenue");
    }
  });
  return labels;
}

function getFirstCellContent(row: (string | number)[] | PdfCell[]): string {
  const first = row[0];
  if (typeof first === "object" && first !== null && "content" in first) {
    return String(first.content);
  }
  return String(first ?? "");
}

function isGrandTotalRow(row: (string | number)[] | PdfCell[]): boolean {
  return isGrandTotalLabel(getFirstCellContent(row));
}

function themedPdfRow(
  row: (string | number)[],
  theme: PdfReportTheme = DEFAULT_PDF_THEME
): PdfCell[] {
  return row.map((cell, index) => ({
    content: String(cell ?? ""),
    styles: {
      fillColor: theme.grandTotalFill,
      textColor: theme.grandTotalText,
      fontStyle: "bold" as const,
      ...(index === 0 ? { valign: "middle" as const } : {}),
    },
  }));
}

function grandTotalPdfRow(
  row: (string | number)[],
  theme: PdfReportTheme = DEFAULT_PDF_THEME
): PdfCell[] {
  return themedPdfRow(row, theme);
}

function highlightPdfRow(
  row: (string | number)[],
  theme: PdfReportTheme = DEFAULT_PDF_THEME
): PdfCell[] {
  return themedPdfRow(row, theme);
}

function mergeCategoryColumnRows(
  rows: (string | number)[][],
  pdfTheme: PdfReportTheme = DEFAULT_PDF_THEME
): {
  csvRows: (string | number)[][];
  pdfRows: PdfCell[][];
} {
  const csvRows: (string | number)[][] = [];
  const pdfRows: PdfCell[][] = [];

  let index = 0;
  while (index < rows.length) {
    const row = rows[index];
    const firstCell = String(row[0] ?? "");

    if (isGrandTotalLabel(firstCell)) {
      csvRows.push(row);
      pdfRows.push(grandTotalPdfRow(row, pdfTheme));
      index += 1;
      continue;
    }

    const category = firstCell;
    let groupEnd = index + 1;
    while (
      groupEnd < rows.length &&
      String(rows[groupEnd][0] ?? "") === category &&
      !isGrandTotalLabel(String(rows[groupEnd][0] ?? ""))
    ) {
      groupEnd += 1;
    }

    const span = groupEnd - index;

    for (let i = index; i < groupEnd; i += 1) {
      const current = rows[i];
      if (i === index) {
        csvRows.push(current);
        pdfRows.push([
          { content: category, rowSpan: span, styles: { valign: "middle" } },
          ...current.slice(1).map(String),
        ]);
      } else {
        csvRows.push(["", ...current.slice(1)]);
        pdfRows.push(current.slice(1).map(String));
      }
    }

    index = groupEnd;
  }

  return { csvRows, pdfRows };
}

function prepareSectionRows(
  section: ExportSection,
  pdfTheme: PdfReportTheme = DEFAULT_PDF_THEME,
  highlightLabels: Set<string> = new Set()
) {
  if (!section.mergeCategoryColumn) {
    const csvRows = section.rows;
    const pdfRows = section.rows.map((row) => {
      if (isGrandTotalRow(row)) return grandTotalPdfRow(row, pdfTheme);
      if (isHighlightLabel(getFirstCellContent(row), highlightLabels)) {
        return highlightPdfRow(row, pdfTheme);
      }
      return row.map(String);
    });
    return { csvRows, pdfRows };
  }
  return mergeCategoryColumnRows(section.rows, pdfTheme);
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportReportCsv(payload: ExportReportPayload) {
  const lines: string[] = [];
  const generatedAt = new Date().toLocaleString("en-LK");
  const documentTitle = buildDocumentTitle(payload.title);

  lines.push(documentTitle);
  lines.push("");
  if (payload.subtitle) lines.push(`Period,${escapeCsvCell(payload.subtitle)}`);
  lines.push(`Generated,${escapeCsvCell(generatedAt)}`);
  lines.push("");

  if (payload.summary?.length) {
    lines.push("Summary");
    payload.summary.forEach((item) => {
      lines.push(`${escapeCsvCell(item.label)},${escapeCsvCell(item.value)}`);
    });
    lines.push("");
  }

  payload.sections.forEach((section, index) => {
    if (index > 0) lines.push("");
    lines.push(escapeCsvCell(section.title));
    lines.push(section.headers.map(escapeCsvCell).join(","));
    const { csvRows } = prepareSectionRows(section);
    csvRows.forEach((row) => {
      if (isGrandTotalRow(row)) {
        lines.push("");
      }
      lines.push(row.map(escapeCsvCell).join(","));
    });
  });

  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${payload.filename}.csv`);
}

export async function exportReportPdf(payload: ExportReportPayload) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const pdfTheme = getPdfReportTheme(payload.pdfTheme);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  const documentTitle = buildDocumentTitle(payload.title);
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(30, 41, 59);
  doc.text(documentTitle, centerX, y, { align: "center" });
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);

  if (payload.subtitle) {
    doc.text(payload.subtitle, centerX, y, { align: "center" });
    y += 5;
  }

  doc.text(`Generated: ${new Date().toLocaleString("en-LK")}`, centerX, y, {
    align: "center",
  });
  y += 10;
  doc.setTextColor(0);

  const highlightLabels = collectHighlightLabels(payload.summary);

  if (payload.summary?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Summary", 14, y);
    y += 2;

    const summaryRows = payload.summary.map((item) =>
      item.highlight ? highlightPdfRow([item.label, item.value], pdfTheme) : [item.label, item.value]
    );

    autoTable(doc, {
      startY: y + 2,
      head: [["Metric", "Value"]],
      body: summaryRows as unknown as Parameters<typeof autoTable>[1]["body"],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, valign: "middle" },
      headStyles: {
        fillColor: pdfTheme.header,
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 72 },
        1: { halign: "right" },
      },
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
      didParseCell: (hookData) => {
        if (hookData.section !== "body") return;
        const sourceRow = summaryRows[hookData.row.index];
        if (!sourceRow || !Array.isArray(sourceRow)) return;

        const sourceCell = sourceRow[hookData.column.index];
        if (
          typeof sourceCell === "object" &&
          sourceCell !== null &&
          "styles" in sourceCell &&
          sourceCell.styles
        ) {
          if (sourceCell.styles.fillColor) {
            hookData.cell.styles.fillColor = sourceCell.styles.fillColor;
          }
          if (sourceCell.styles.textColor) {
            hookData.cell.styles.textColor = sourceCell.styles.textColor;
          }
          if (sourceCell.styles.fontStyle) {
            hookData.cell.styles.fontStyle = sourceCell.styles.fontStyle;
          }
        }
      },
    });

    const docWithSummary = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    y = (docWithSummary.lastAutoTable?.finalY ?? y) + 8;
  }

  payload.sections.forEach((section) => {
    if (y > 250) {
      doc.addPage();
      y = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(section.title, 14, y);
    y += 2;

    const { pdfRows } = prepareSectionRows(section, pdfTheme, highlightLabels);

    autoTable(doc, {
      startY: y + 2,
      head: [section.headers],
      body: pdfRows as unknown as Parameters<typeof autoTable>[1]["body"],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, valign: "middle" },
      headStyles: {
        fillColor: pdfTheme.header,
        textColor: 255,
        fontStyle: "bold",
      },
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
      didParseCell: (hookData) => {
        if (hookData.section !== "body") return;
        const sourceRow = pdfRows[hookData.row.index];
        if (!sourceRow) return;

        const sourceCell = sourceRow[hookData.column.index];
        if (
          typeof sourceCell === "object" &&
          sourceCell !== null &&
          "styles" in sourceCell &&
          sourceCell.styles
        ) {
          if (sourceCell.styles.fillColor) {
            hookData.cell.styles.fillColor = sourceCell.styles.fillColor;
          }
          if (sourceCell.styles.textColor) {
            hookData.cell.styles.textColor = sourceCell.styles.textColor;
          }
          if (sourceCell.styles.fontStyle) {
            hookData.cell.styles.fontStyle = sourceCell.styles.fontStyle;
          }
          return;
        }

        if (!isGrandTotalRow(sourceRow)) return;

        hookData.cell.styles.fillColor = pdfTheme.grandTotalFill;
        hookData.cell.styles.textColor = pdfTheme.grandTotalText;
        hookData.cell.styles.fontStyle = "bold";
      },
    });

    const docWithTable = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    y = (docWithTable.lastAutoTable?.finalY ?? y) + 10;
  });

  doc.save(`${payload.filename}.pdf`);
}

export function buildExportFilename(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}`.toLowerCase().replace(/\s+/g, "-");
}
