"use client";

import { useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { pipelines } from "@/lib/mock-data";

export default function PipelinesPage() {
  const [selectedPipeline, setSelectedPipeline] = useState(pipelines[0]);

  return (
    <div>
      <PageHeader title="Pipelines" subtitle="Data integration and ETL activity monitoring." />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <SectionCard title="Pipeline monitoring" subtitle="Execution status and operational throughput">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Pipeline</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Rows</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Start Time</th>
                  <th className="px-4 py-3 font-medium">End Time</th>
                </tr>
              </thead>
              <tbody>
                {pipelines.map((pipeline) => (
                  <tr key={pipeline.name} className="cursor-pointer border-t border-slate-200 hover:bg-slate-50" onClick={() => setSelectedPipeline(pipeline)}>
                    <td className="px-4 py-3 font-medium text-slate-900">{pipeline.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={pipeline.status}
                        tone={pipeline.status === "SUCCESS" ? "success" : pipeline.status === "RUNNING" ? "warning" : "danger"}
                      />
                    </td>
                    <td className="px-4 py-3">{pipeline.rows.toLocaleString()}</td>
                    <td className="px-4 py-3">{pipeline.duration}</td>
                    <td className="px-4 py-3">{pipeline.startTime}</td>
                    <td className="px-4 py-3">{pipeline.endTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Pipeline details" subtitle="Selected workflow state">
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Pipeline</p>
              <p className="mt-2 font-medium text-slate-900">{selectedPipeline.name}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Status</p>
              <div className="mt-2">
                <StatusBadge
                  label={selectedPipeline.status}
                  tone={selectedPipeline.status === "SUCCESS" ? "success" : selectedPipeline.status === "RUNNING" ? "warning" : "danger"}
                />
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Rows processed</p>
              <p className="mt-2 font-medium text-slate-900">{selectedPipeline.rows.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Timing</p>
              <p className="mt-2 font-medium text-slate-900">{selectedPipeline.startTime} → {selectedPipeline.endTime}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
