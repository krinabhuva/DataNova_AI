"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DatasetRecord,
  executePipeline,
  fetchDatasets,
  fetchPipelineRuns,
  PipelineRunRecord,
} from "@/lib/api";

function splitColumns(value: string): string[] {
  return value.split(",").map((column) => column.trim()).filter(Boolean);
}

function destinationFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const normalized = base.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  return `${normalized || "dataset"}_cleaned`.slice(0, 63);
}

function parseRenames(value: string): Record<string, string> {
  return Object.fromEntries(
    value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const separator = line.indexOf("=");
      if (separator < 1 || separator === line.length - 1) {
        throw new Error("Enter each rename as source=destination on a separate line.");
      }
      return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    }),
  );
}

function statusTone(status: PipelineRunRecord["status"]): "success" | "warning" | "danger" {
  if (status === "SUCCESS") return "success";
  if (status === "RUNNING") return "warning";
  return "danger";
}

function PipelinesContent() {
  const searchParams = useSearchParams();
  const requestedDatasetId = searchParams.get("datasetId");
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [runs, setRuns] = useState<PipelineRunRecord[]>([]);
  const [selectedRun, setSelectedRun] = useState<PipelineRunRecord | null>(null);
  const [datasetId, setDatasetId] = useState("");
  const [destinationTable, setDestinationTable] = useState("");
  const [numericColumns, setNumericColumns] = useState("");
  const [dateColumns, setDateColumns] = useState("");
  const [dropColumns, setDropColumns] = useState("");
  const [lowercaseColumns, setLowercaseColumns] = useState("");
  const [uppercaseColumns, setUppercaseColumns] = useState("");
  const [renameRules, setRenameRules] = useState("");
  const [missingAction, setMissingAction] = useState<"keep" | "drop_row" | "fill">("keep");
  const [fillValue, setFillValue] = useState("");
  const [duplicateAction, setDuplicateAction] = useState<"drop" | "keep">("drop");
  const [trimStrings, setTrimStrings] = useState(true);
  const [normalizeHeaders, setNormalizeHeaders] = useState(true);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetchDatasets(), fetchPipelineRuns()])
      .then(([datasetRecords, pipelineRuns]) => {
        if (!active) return;
        setDatasets(datasetRecords);
        setRuns(pipelineRuns);
        const requested = requestedDatasetId && datasetRecords.some((item) => item.id === Number(requestedDatasetId))
          ? requestedDatasetId
          : "";
        const initialDatasetId = requested || (datasetRecords[0] ? String(datasetRecords[0].id) : "");
        setDatasetId(initialDatasetId);
        const initialDataset = datasetRecords.find((item) => String(item.id) === initialDatasetId);
        if (initialDataset) setDestinationTable(destinationFromFilename(initialDataset.filename));
        setSelectedRun(pipelineRuns[0] ?? null);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load ETL data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [requestedDatasetId]);

  function selectDataset(value: string) {
    setDatasetId(value);
    const dataset = datasets.find((item) => String(item.id) === value);
    if (dataset) setDestinationTable(destinationFromFilename(dataset.filename));
  }

  async function submitRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedId = Number(datasetId);
    if (!Number.isInteger(selectedId) || selectedId < 1) {
      setError("Select a dataset before running ETL.");
      return;
    }
    let renameColumns: Record<string, string>;
    try {
      renameColumns = parseRenames(renameRules);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Rename rules are invalid.");
      return;
    }
    setRunning(true);
    setError("");
    setMessage("");
    try {
      const run = await executePipeline({
        dataset_id: selectedId,
        destination_table: destinationTable,
        missing_value_action: missingAction,
        fill_value: fillValue,
        duplicate_action: duplicateAction,
        numeric_columns: splitColumns(numericColumns),
        date_columns: splitColumns(dateColumns),
        drop_columns: splitColumns(dropColumns),
        lowercase_columns: splitColumns(lowercaseColumns),
        uppercase_columns: splitColumns(uppercaseColumns),
        rename_columns: renameColumns,
        trim_strings: trimStrings,
        normalize_headers: normalizeHeaders,
      });
      setRuns((current) => [run, ...current.filter((item) => item.id !== run.id)]);
      setSelectedRun(run);
      setMessage(run.status === "SUCCESS" ? "ETL completed and output was loaded." : "ETL failed; see the run errors.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not start the ETL pipeline.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <PageHeader title="Pipelines" subtitle="Extract, validate, clean, transform, and load registered datasets." />

      {(error || message) && (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`} role={error ? "alert" : "status"}>
          {error || message}
        </div>
      )}

      <SectionCard title="Run ETL" subtitle="CSV and Excel sources are read from raw storage; output is loaded into PostgreSQL.">
        {loading ? (
          <p className="text-sm text-slate-500">Loading datasets and pipeline history…</p>
        ) : datasets.length === 0 ? (
          <p className="text-sm text-slate-500">Upload a CSV or Excel dataset in Data Sources before starting a pipeline.</p>
        ) : (
          <form onSubmit={(event) => void submitRun(event)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Source dataset
                <select value={datasetId} onChange={(event) => selectDataset(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  {datasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.filename}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                PostgreSQL destination table
                <input required pattern="[A-Za-z_][A-Za-z0-9_]*" maxLength={63} value={destinationTable} onChange={(event) => setDestinationTable(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                <span className="mt-1 block text-xs font-normal text-slate-500">Use customers, products, orders, sales, or inventory for structured storage.</span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Numeric columns
                <input value={numericColumns} onChange={(event) => setNumericColumns(event.target.value)} placeholder="revenue, quantity" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Date columns
                <input value={dateColumns} onChange={(event) => setDateColumns(event.target.value)} placeholder="order_date" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Drop columns
                <input value={dropColumns} onChange={(event) => setDropColumns(event.target.value)} placeholder="internal_note" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Lowercase values in
                <input value={lowercaseColumns} onChange={(event) => setLowercaseColumns(event.target.value)} placeholder="region" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Uppercase values in
                <input value={uppercaseColumns} onChange={(event) => setUppercaseColumns(event.target.value)} placeholder="country_code" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Rename columns
                <textarea value={renameRules} onChange={(event) => setRenameRules(event.target.value)} placeholder={"old_name=new_name\nanother=renamed"} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Missing values
                <select value={missingAction} onChange={(event) => setMissingAction(event.target.value as typeof missingAction)} className="mt-1.5 block rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <option value="keep">Keep as NULL</option>
                  <option value="drop_row">Reject row</option>
                  <option value="fill">Fill with value</option>
                </select>
              </label>
              {missingAction === "fill" && (
                <label className="block text-sm font-medium text-slate-700">
                  Fill value
                  <input value={fillValue} onChange={(event) => setFillValue(event.target.value)} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
              )}
              <label className="block text-sm font-medium text-slate-700">
                Duplicates
                <select value={duplicateAction} onChange={(event) => setDuplicateAction(event.target.value as typeof duplicateAction)} className="mt-1.5 block rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <option value="drop">Detect and remove</option>
                  <option value="keep">Detect and keep</option>
                </select>
              </label>
              <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
                <input type="checkbox" checked={trimStrings} onChange={(event) => setTrimStrings(event.target.checked)} className="rounded border-slate-300" />
                Trim text values
              </label>
              <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
                <input type="checkbox" checked={normalizeHeaders} onChange={(event) => setNormalizeHeaders(event.target.checked)} className="rounded border-slate-300" />
                Normalize output headers
              </label>
              <button type="submit" disabled={running} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
                {running ? "Running ETL…" : "Run pipeline"}
              </button>
            </div>
          </form>
        )}
      </SectionCard>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <SectionCard title="Pipeline monitoring" subtitle="Execution quality and operational throughput">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Pipeline</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Processed</th>
                  <th className="px-4 py-3 font-medium">Loaded</th>
                  <th className="px-4 py-3 font-medium">Rejected</th>
                  <th className="px-4 py-3 font-medium">DB load</th>
                  <th className="px-4 py-3 font-medium">Quality</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={9}>Loading pipeline history…</td></tr>
                ) : runs.length === 0 ? (
                  <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={9}>No ETL runs yet.</td></tr>
                ) : runs.map((run) => (
                  <tr key={run.id} className={`cursor-pointer border-t border-slate-200 hover:bg-slate-50 ${selectedRun?.id === run.id ? "bg-slate-50" : ""}`} onClick={() => setSelectedRun(run)}>
                    <td className="px-4 py-3 font-medium text-slate-900">{run.pipeline_name}</td>
                    <td className="px-4 py-3"><StatusBadge label={run.status} tone={statusTone(run.status)} /></td>
                    <td className="px-4 py-3">{run.total_rows.toLocaleString()}</td>
                    <td className="px-4 py-3">{run.rows_loaded.toLocaleString()}</td>
                    <td className="px-4 py-3">{run.rejected_rows.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge label={run.load_status} tone={run.load_status === "SUCCESS" ? "success" : run.load_status === "FAILED" ? "danger" : "warning"} /></td>
                    <td className="px-4 py-3">{run.quality_score.toFixed(2)}%</td>
                    <td className="px-4 py-3">{run.duration}</td>
                    <td className="px-4 py-3">{new Date(run.started_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Pipeline details" subtitle="Selected run metrics and validation errors">
          {selectedRun ? (
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Pipeline</span><span className="ml-4 text-right font-medium text-slate-900">{selectedRun.pipeline_name}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Status</span><StatusBadge label={selectedRun.status} tone={statusTone(selectedRun.status)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Total rows" value={selectedRun.total_rows} />
                <Metric label="Rows loaded" value={selectedRun.rows_loaded} />
                <Metric label="Valid rows" value={selectedRun.valid_rows} />
                <Metric label="Rejected rows" value={selectedRun.rejected_rows} />
                <Metric label="Duplicates" value={selectedRun.duplicates} />
                <Metric label="Missing values" value={selectedRun.missing_values} />
                <Metric label="Quality score" value={`${selectedRun.quality_score.toFixed(2)}%`} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Duration</span><span className="font-medium text-slate-900">{selectedRun.duration}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Database load</span><StatusBadge label={selectedRun.load_status} tone={selectedRun.load_status === "SUCCESS" ? "success" : selectedRun.load_status === "FAILED" ? "danger" : "warning"} /></div>
              {selectedRun.load_error && <div className="rounded-xl bg-rose-50 p-3 text-rose-800">{selectedRun.load_error}</div>}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span>Finished</span><span className="font-medium text-slate-900">{selectedRun.finished_at ? new Date(selectedRun.finished_at).toLocaleString() : "In progress"}</span></div>
              {selectedRun.errors.length > 0 && (
                <div className="rounded-xl bg-rose-50 p-3 text-rose-800">
                  <p className="font-medium">Errors</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                    {selectedRun.errors.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a pipeline run to inspect its data quality metrics.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

export default function PipelinesPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading pipeline workspace…</p>}>
      <PipelinesContent />
    </Suspense>
  );
}
