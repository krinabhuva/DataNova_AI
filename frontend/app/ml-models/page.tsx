"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { mlModels } from "@/lib/mock-data";

export default function MlModelsPage() {
  return (
    <div>
      <PageHeader title="ML Models" subtitle="Operational model catalog and performance monitoring." />

      <div className="mt-2">
        <SectionCard title="Model inventory" subtitle="Versioned machine learning assets">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Algorithm</th>
                  <th className="px-4 py-3 font-medium">Dataset</th>
                  <th className="px-4 py-3 font-medium">Training date</th>
                  <th className="px-4 py-3 font-medium">F1</th>
                  <th className="px-4 py-3 font-medium">ROC-AUC</th>
                  <th className="px-4 py-3 font-medium">RMSE</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {mlModels.map((model) => (
                  <tr key={model.name} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{model.name}</td>
                    <td className="px-4 py-3">{model.version}</td>
                    <td className="px-4 py-3">{model.algorithm}</td>
                    <td className="px-4 py-3">{model.dataset}</td>
                    <td className="px-4 py-3">{model.trainingDate}</td>
                    <td className="px-4 py-3">{model.f1.toFixed(2)}</td>
                    <td className="px-4 py-3">{model.rocAuc.toFixed(2)}</td>
                    <td className="px-4 py-3">{model.rmse.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={model.status}
                        tone={model.status === "Active" ? "success" : model.status === "Preview" ? "warning" : "info"}
                      />
                    </td>
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
