export type ExportSection = {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  /** Merge repeated values in the first column (category) for CSV/PDF exports only */
  mergeCategoryColumn?: boolean;
};

export type ExportReportPayload = {
  title: string;
  subtitle?: string;
  filename: string;
  summary?: { label: string; value: string }[];
  sections: ExportSection[];
};

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

const GRAND_TOTAL_FILL: [number, number, number] = [224, 231, 255];
const GRAND_TOTAL_TEXT: [number, number, number] = [67, 56, 202];

function getFirstCellContent(row: (string | number)[] | PdfCell[]): string {
  const first = row[0];
  if (typeof first === "object" && first !== null && "content" in first) {
    return String(first.content);
  }
  return String(first ?? "");
}

function isGrandTotalRow(row: (string | number)[] | PdfCell[]): boolean {
  return getFirstCellContent(row).toLowerCase() === "grand total";
}

function grandTotalPdfRow(row: (string | number)[]): PdfCell[] {
  return row.map((cell, index) => ({
    content: String(cell ?? ""),
    styles: {
      fillColor: GRAND_TOTAL_FILL,
      textColor: GRAND_TOTAL_TEXT,
      fontStyle: "bold" as const,
      ...(index === 0 ? { valign: "middle" as const } : {}),
    },
  }));
}

function mergeCategoryColumnRows(rows: (string | number)[][]): {
  csvRows: (string | number)[][];
  pdfRows: PdfCell[][];
} {
  const csvRows: (string | number)[][] = [];
  const pdfRows: PdfCell[][] = [];

  let index = 0;
  while (index < rows.length) {
    const row = rows[index];
    const firstCell = String(row[0] ?? "");

    // Keep summary rows like "Grand Total" unmerged
    if (firstCell.toLowerCase() === "grand total") {
      csvRows.push(row);
      pdfRows.push(grandTotalPdfRow(row));
      index += 1;
      continue;
    }

    const category = firstCell;
    let groupEnd = index + 1;
    while (
      groupEnd < rows.length &&
      String(rows[groupEnd][0] ?? "") === category &&
      String(rows[groupEnd][0] ?? "").toLowerCase() !== "grand total"
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

function prepareSectionRows(section: ExportSection) {
  if (!section.mergeCategoryColumn) {
    const csvRows = section.rows;
    const pdfRows = section.rows.map((row) =>
      isGrandTotalRow(row) ? grandTotalPdfRow(row) : row.map(String)
    );
    return { csvRows, pdfRows };
  }
  return mergeCategoryColumnRows(section.rows);
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

  lines.push(`Report,${escapeCsvCell(payload.title)}`);
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

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(payload.title, 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);

  if (payload.subtitle) {
    doc.text(payload.subtitle, 14, y);
    y += 5;
  }

  doc.text(`Generated: ${new Date().toLocaleString("en-LK")}`, 14, y);
  y += 8;
  doc.setTextColor(0);

  if (payload.summary?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Summary", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    payload.summary.forEach((item) => {
      doc.text(`${item.label}: ${item.value}`, 14, y);
      y += 5;
    });
    y += 4;
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

    const { pdfRows } = prepareSectionRows(section);

    autoTable(doc, {
      startY: y + 2,
      head: [section.headers],
      body: pdfRows as unknown as Parameters<typeof autoTable>[1]["body"],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, valign: "middle" },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
      didParseCell: (hookData) => {
        if (hookData.section !== "body") return;
        const sourceRow = pdfRows[hookData.row.index];
        if (!sourceRow || !isGrandTotalRow(sourceRow)) return;

        hookData.cell.styles.fillColor = GRAND_TOTAL_FILL;
        hookData.cell.styles.textColor = GRAND_TOTAL_TEXT;
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
