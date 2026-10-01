"use client";

import { FileUp, UploadCloud } from "lucide-react";

import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { dataSourceKpis, datasets } from "@/lib/mock-data";

export default function DataSourcesPage() {
  return (
    <div>
      <PageHeader title="Data Sources" subtitle="Monitor source health, uploaded datasets, and data quality signals." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dataSourceKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Upload data" subtitle="Add CSV or Excel dataset">
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h4 className="mt-4 text-lg font-semibold text-slate-900">Drag and drop files here</h4>
            <p className="mt-2 text-sm text-slate-500">CSV, Excel, or parquet files accepted</p>
            <div className="mt-5 flex justify-center gap-3">
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">CSV upload</button>
              <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">Excel upload</button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Dataset overview" subtitle="Source quality and ingestion status">
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span className="flex items-center gap-2"><FileUp className="h-4 w-4" /> Recent upload</span>
              <span className="font-medium text-slate-900">sales_q3.csv</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span>Rows processed</span>
              <span className="font-medium text-slate-900">8.4M</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span>Quality score</span>
              <span className="font-medium text-slate-900">97.3%</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span>Connected sources</span>
              <span className="font-medium text-slate-900">24</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Dataset table" subtitle="Registered source inventory">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Filename</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Rows</th>
                  <th className="px-4 py-3 font-medium">Upload date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Quality score</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset) => (
                  <tr key={dataset.filename} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{dataset.filename}</td>
                    <td className="px-4 py-3">{dataset.type}</td>
                    <td className="px-4 py-3">{dataset.rows.toLocaleString()}</td>
                    <td className="px-4 py-3">{dataset.uploadDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={dataset.status}
                        tone={dataset.status === "Ready" ? "success" : dataset.status === "Processing" ? "warning" : "danger"}
                      />
                    </td>
                    <td className="px-4 py-3">{dataset.qualityScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
