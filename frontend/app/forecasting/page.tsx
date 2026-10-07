"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { FilterBar } from "@/components/ui/FilterBar";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AnalyticsPanelState } from "@/components/ui/AnalyticsPanelState";
import { fetchSalesForecast, ForecastResult } from "@/lib/api";

const periods = ["30 days", "90 days", "6 months", "12 months"];

export default function ForecastingPage() {
  const [period, setPeriod] = useState(periods[1]);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const horizon = period === "30 days" ? 1 : period === "90 days" ? 3 : period === "6 months" ? 6 : 12;

  useEffect(() => {
    let active = true;
    fetchSalesForecast(horizon)
      .then((result) => {
        if (!active) return;
        setForecastResult(result);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load sales forecast.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [horizon, retry]);

  const historical = forecastResult?.history ?? [];
  const projected = forecastResult?.forecast ?? [];
  const chartData = [
    ...historical.map((point) => ({ period: point.period, actual: point.actual, forecast: undefined as number | undefined })),
    ...projected.map((point) => ({ period: point.period, actual: undefined as number | undefined, forecast: point.forecast })),
  ];
  const historicalSales = historical.reduce((sum, point) => sum + point.actual, 0);
  const forecastSales = projected.reduce((sum, point) => sum + point.forecast, 0);
  const comparisonSales = historical.slice(-Math.min(horizon, historical.length)).reduce((sum, point) => sum + point.actual, 0);
  const expectedGrowth = comparisonSales ? (forecastSales / comparisonSales - 1) * 100 : 0;
  const forecastingKpis = [
    { label: "Historical Sales", value: `$${historicalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: "actual", description: "available monthly history", trend: "neutral" as const },
    { label: "Forecasted Sales", value: `$${forecastSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: "forecast", description: `next ${horizon} month${horizon === 1 ? "" : "s"}`, trend: "neutral" as const },
    { label: "Forecast Horizon", value: `${horizon} ${horizon === 1 ? "Month" : "Months"}`, change: "selected", description: "planning window", trend: "neutral" as const },
    { label: "Expected Growth", value: `${expectedGrowth.toFixed(1)}%`, change: "vs prior", description: "same-length historical period", trend: expectedGrowth >= 0 ? "up" as const : "down" as const },
  ];

  return (
    <div>
      <PageHeader title="Forecasting" subtitle="Model-driven sales outlook and business planning guidance." action={<StatusBadge label={forecastResult?.algorithm ?? "Loading model"} tone="info" />} />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(""); setLoading(true); setRetry((current) => current + 1); }} className="font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      <FilterBar>
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {periods.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </FilterBar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />)}
        {!loading && forecastingKpis.map((metric) => <KpiCard key={metric.label} {...metric} />)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
        <SectionCard title="Historical vs Forecast" subtitle="Illustrates expected direction based on recent demand patterns">
          {loading || error || !chartData.length ? <AnalyticsPanelState loading={loading} empty={!error && !chartData.length} /> : <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="forecastFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                    return [`$${(numericValue / 1000).toFixed(0)}K`, "Value"];
                  }}
                />
                <Area type="monotone" dataKey="actual" stroke="#0f172a" fill="url(#forecastFill)" strokeWidth={2.5} />
                <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={2.5} dot={{ r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
            </div>}
        </SectionCard>

        <SectionCard title="Model information" subtitle="Current forecast assumptions">
            {loading || error || !forecastResult ? <AnalyticsPanelState loading={loading} empty={!error && !forecastResult} /> : <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Model</p>
                <p className="mt-2 font-medium text-slate-900">{forecastResult.algorithm}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Validation RMSE</p>
                <p className="mt-2 font-medium text-slate-900">{typeof forecastResult.metrics.rmse === "number" ? `$${forecastResult.metrics.rmse.toLocaleString()}` : "Not available for current history"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Validation</p>
                <p className="mt-2 font-medium text-slate-900">{forecastResult.metrics.validation ?? "Baseline; more history needed"}</p>
            </div>
            </div>}
        </SectionCard>
      </div>
    </div>
  );
}
