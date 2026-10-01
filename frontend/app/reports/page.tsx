"use client";

import { Download, Eye } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { reports } from "@/lib/mock-data";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and review recurring business reporting packages." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => (
          <SectionCard key={report.name} title={report.name} subtitle={report.type}>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-2">
                <span>Generated</span>
                <span className="font-medium text-slate-900">{report.generatedDate}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Format</span>
                <span className="font-medium text-slate-900">{report.format}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Status</span>
                <StatusBadge
                  label={report.status}
                  tone={report.status === "Ready" ? "success" : report.status === "Processing" ? "warning" : "neutral"}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  <Eye className="h-4 w-4" /> View
                </button>
                <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                  <Download className="h-4 w-4" /> Download
                </button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
