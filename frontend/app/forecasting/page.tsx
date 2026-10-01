"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { FilterBar } from "@/components/ui/FilterBar";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { forecastSeries, forecastingKpis } from "@/lib/mock-data";

const periods = ["30 days", "90 days", "6 months", "12 months"];

export default function ForecastingPage() {
  const [period, setPeriod] = useState(periods[1]);

  return (
    <div>
      <PageHeader title="Forecasting" subtitle="Model-driven sales outlook and business planning guidance." action={<StatusBadge label="ARIMA + XGBoost" tone="info" />} />

      <FilterBar>
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {periods.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </FilterBar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {forecastingKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
        <SectionCard title="Historical vs Forecast" subtitle="Illustrates expected direction based on recent demand patterns">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastSeries}>
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
          </div>
        </SectionCard>

        <SectionCard title="Model information" subtitle="Current forecast assumptions">
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Model</p>
              <p className="mt-2 font-medium text-slate-900">Gradient Boosted Sales Model</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Accuracy</p>
              <p className="mt-2 font-medium text-slate-900">92.3% MAPE</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Confidence</p>
              <p className="mt-2 font-medium text-slate-900">High for electronics and home categories</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
