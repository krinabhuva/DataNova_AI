"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileUp, Trash2, UploadCloud } from "lucide-react";

import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { deleteDataset, DatasetRecord, fetchDataset, fetchDatasets, uploadDataset } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default function DataSourcesPage() {
  const csvInput = useRef<HTMLInputElement>(null);
  const excelInput = useRef<HTMLInputElement>(null);
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchDatasets()
      .then((records) => {
        if (!active) return;
        setDatasets(records);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Could not load datasets.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const uploaded = await uploadDataset(file);
      setDatasets((current) => [uploaded, ...current.filter((dataset) => dataset.id !== uploaded.id)]);
      setSelectedDataset(uploaded);
      setMessage(`${uploaded.filename} uploaded successfully.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not upload the dataset.");
    } finally {
      setUploading(false);
    }
  }

  function onFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void handleUpload(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void handleUpload(event.dataTransfer.files[0]);
  }

  async function showDetails(datasetId: number) {
    setError("");
    try {
      setSelectedDataset(await fetchDataset(datasetId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load dataset details.");
    }
  }

  async function removeDataset(dataset: DatasetRecord) {
    if (!window.confirm(`Delete ${dataset.filename}? This also removes the raw stored file.`)) return;
    setError("");
    setMessage("");
    try {
      await deleteDataset(dataset.id);
      setDatasets((current) => current.filter((item) => item.id !== dataset.id));
      setSelectedDataset((current) => (current?.id === dataset.id ? null : current));
      setMessage(`${dataset.filename} deleted.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete the dataset.");
    }
  }

  const totalRows = datasets.reduce((sum, dataset) => sum + dataset.row_count, 0);
  const totalBytes = datasets.reduce((sum, dataset) => sum + dataset.file_size_bytes, 0);
  const latestDataset = datasets[0];
  const metrics = [
    { label: "Datasets", value: datasets.length.toLocaleString(), change: "total", description: "raw uploads", trend: "neutral" as const },
    { label: "Rows Uploaded", value: totalRows.toLocaleString(), change: "total", description: "across all datasets", trend: "neutral" as const },
    { label: "Storage Used", value: formatBytes(totalBytes), change: "total", description: "raw object storage", trend: "neutral" as const },
    { label: "Latest Upload", value: latestDataset ? formatDate(latestDataset.uploaded_at).split(",")[0] : "—", change: "latest", description: latestDataset?.filename ?? "no uploads yet", trend: "neutral" as const },
  ];

  return (
    <div>
      <PageHeader title="Data Sources" subtitle="Monitor source health, uploaded datasets, and data quality signals." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <KpiCard key={metric.label} {...metric} />)}
      </div>

      {(error || message) && (
        <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`} role={error ? "alert" : "status"}>
          {error || message}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Upload data" subtitle="Add CSV or Excel dataset">
          <div
            className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
              <UploadCloud className="h-6 w-6" />
            </div>
            <h4 className="mt-4 text-lg font-semibold text-slate-900">Drag and drop files here</h4>
            <p className="mt-2 text-sm text-slate-500">CSV or .xlsx files accepted</p>
            <input ref={csvInput} className="hidden" type="file" accept=".csv,text/csv" onChange={onFileSelected} />
            <input ref={excelInput} className="hidden" type="file" accept=".xlsx" onChange={onFileSelected} />
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => csvInput.current?.click()}
                disabled={uploading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                CSV upload
              </button>
              <button
                type="button"
                onClick={() => excelInput.current?.click()}
                disabled={uploading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
              >
                Excel upload
              </button>
            </div>
            {uploading && <p className="mt-3 text-sm text-slate-500">Uploading…</p>}
          </div>
        </SectionCard>

        <SectionCard title={selectedDataset ? "Dataset details" : "Dataset overview"} subtitle={selectedDataset ? selectedDataset.filename : "Raw storage and upload metadata"}>
          {selectedDataset ? (
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>File type</span><span className="font-medium text-slate-900">{selectedDataset.file_type}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Rows</span><span className="font-medium text-slate-900">{selectedDataset.row_count.toLocaleString()}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Columns</span><span className="font-medium text-slate-900">{selectedDataset.column_count.toLocaleString()}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>File size</span><span className="font-medium text-slate-900">{formatBytes(selectedDataset.file_size_bytes)}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Uploaded</span><span className="font-medium text-slate-900">{formatDate(selectedDataset.uploaded_at)}</span></div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="flex items-center gap-2"><FileUp className="h-4 w-4" /> Recent upload</span>
                <span className="font-medium text-slate-900">{latestDataset?.filename ?? "None"}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Total rows</span><span className="font-medium text-slate-900">{totalRows.toLocaleString()}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Storage used</span><span className="font-medium text-slate-900">{formatBytes(totalBytes)}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Registered datasets</span><span className="font-medium text-slate-900">{datasets.length.toLocaleString()}</span></div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Dataset table" subtitle="Registered source inventory">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Filename</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Rows</th>
                  <th className="px-4 py-3 font-medium">Upload date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">File size</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={7}>Loading datasets…</td></tr>
                ) : error && datasets.length === 0 ? (
                  <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={7}>Datasets could not be loaded.</td></tr>
                ) : datasets.length === 0 ? (
                  <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={7}>No datasets uploaded yet.</td></tr>
                ) : datasets.map((dataset) => (
                  <tr key={dataset.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{dataset.filename}</td>
                    <td className="px-4 py-3">{dataset.file_type}</td>
                    <td className="px-4 py-3">{dataset.row_count.toLocaleString()}</td>
                    <td className="px-4 py-3">{formatDate(dataset.uploaded_at)}</td>
                    <td className="px-4 py-3"><StatusBadge label="Stored" tone="success" /></td>
                    <td className="px-4 py-3">{formatBytes(dataset.file_size_bytes)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => void showDetails(dataset.id)} className="font-medium text-sky-700 hover:text-sky-900">Details</button>
                        <Link href={`/pipelines?datasetId=${dataset.id}`} className="font-medium text-sky-700 hover:text-sky-900">Run ETL</Link>
                        <button
                          type="button"
                          onClick={() => void removeDataset(dataset)}
                          aria-label={`Delete ${dataset.filename}`}
                          className="text-rose-700 hover:text-rose-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
