"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fetchMlModels, MLModelRecord, trainMlSuite } from "@/lib/api";

export default function MlModelsPage() {
  const [models, setModels] = useState<MLModelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    fetchMlModels()
      .then((data) => {
        if (active) setModels(data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load model metadata.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  async function handleTrainModels() {
    setTraining(true);
    setError("");
    try {
      await trainMlSuite();
      setModels(await fetchMlModels());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not train the models.");
    } finally {
      setTraining(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="ML Models"
        subtitle="Operational model catalog and performance monitoring."
        action={<button type="button" onClick={handleTrainModels} disabled={training} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{training ? "Training…" : "Train models"}</button>}
      />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <span>{error}</span>
          {!models.length && <button type="button" onClick={() => { setError(""); setLoading(true); setRetry((current) => current + 1); }} className="font-medium underline underline-offset-2">Retry</button>}
        </div>
      )}

      <div className="mt-2">
        <SectionCard title="Model inventory" subtitle="Versioned machine learning assets">
          {loading ? <div className="py-10 text-center text-sm text-slate-500" role="status">Loading model catalog…</div> : !models.length ? <div className="py-10 text-center text-sm text-slate-500" role="status">No models have been trained yet.</div> : <div className="overflow-x-auto rounded-xl border border-slate-200">
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
                {models.map((model) => (
                  <tr key={model.model_key} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{model.name}</td>
                    <td className="px-4 py-3">{model.version}</td>
                    <td className="px-4 py-3">{model.algorithm}</td>
                    <td className="px-4 py-3">{model.dataset}</td>
                    <td className="px-4 py-3">{new Date(model.training_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{typeof model.metrics.f1 === "number" ? model.metrics.f1.toFixed(2) : "—"}</td>
                    <td className="px-4 py-3">{typeof model.metrics.roc_auc === "number" ? model.metrics.roc_auc.toFixed(2) : "—"}</td>
                    <td className="px-4 py-3">{typeof model.metrics.rmse === "number" ? model.metrics.rmse.toFixed(2) : typeof model.metrics.training_rmse === "number" ? model.metrics.training_rmse.toFixed(2) : "—"}</td>
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
          </div>}
        </SectionCard>
      </div>
    </div>
  );
}
