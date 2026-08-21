"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { FaFileCsv, FaFilePdf } from "react-icons/fa";
import {
  exportReportCsv,
  exportReportPdf,
  type ExportReportPayload,
} from "@/lib/exportReports";

type Props = {
  payload: ExportReportPayload;
  disabled?: boolean;
};

export default function ReportExportButtons({ payload, disabled }: Props) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const hasData = payload.sections.some((section) => section.rows.length > 0);

  const handleCsv = () => {
    if (!hasData) {
      toast.error("No data to export");
      return;
    }
    try {
      setExporting("csv");
      exportReportCsv(payload);
      toast.success("CSV downloaded");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setExporting(null);
    }
  };

  const handlePdf = async () => {
    if (!hasData) {
      toast.error("No data to export");
      return;
    }
    try {
      setExporting("pdf");
      await exportReportPdf(payload);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to export PDF");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCsv}
        disabled={disabled || exporting !== null || !hasData}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <FaFileCsv size={12} />
        {exporting === "csv" ? "Exporting..." : "Download CSV"}
      </button>
      <button
        type="button"
        onClick={handlePdf}
        disabled={disabled || exporting !== null || !hasData}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <FaFilePdf size={12} />
        {exporting === "pdf" ? "Exporting..." : "Download PDF"}
      </button>
    </div>
  );
}
