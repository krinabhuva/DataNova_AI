"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard } from "@/components/ui/KpiCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { categorySummary, regionalPerformance, salesKpis, salesTrend } from "@/lib/mock-data";

const dateOptions = ["Last 30 days", "Quarter to date", "Year to date"];
const categoryOptions = ["All categories", "Electronics", "Home", "Fashion", "Office", "Health"];
const regionOptions = ["All regions", "North America", "Europe", "Asia Pacific", "LATAM"];

export default function SalesPage() {
  const [dateFilter, setDateFilter] = useState(dateOptions[0]);
  const [categoryFilter, setCategoryFilter] = useState(categoryOptions[0]);
  const [regionFilter, setRegionFilter] = useState(regionOptions[0]);

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Track revenue, order flow, and category performance across regions."
        action={<StatusBadge label={dateFilter} tone="info" />}
      />

      <FilterBar>
        <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {dateOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {categoryOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          {regionOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </FilterBar>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {salesKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Sales Trend" subtitle="Revenue and profit trajectory">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                    return [`$${(numericValue / 1000).toFixed(0)}K`, "Value"];
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={3} />
                <Line type="monotone" dataKey="profit" stroke="#94a3b8" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Category Performance" subtitle="Revenue contribution by category">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySummary}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                    return [`$${(numericValue / 1000).toFixed(0)}K`, "Revenue"];
                  }}
                />
                <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Regional Performance" subtitle="Performance by market">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Region</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Growth</th>
                </tr>
              </thead>
              <tbody>
                {regionalPerformance.map((region) => (
                  <tr key={region.name} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{region.name}</td>
                    <td className="px-4 py-3">${(region.revenue / 1000000).toFixed(2)}M</td>
                    <td className="px-4 py-3">{region.orders}</td>
                    <td className="px-4 py-3 text-emerald-600">+{region.growth}%</td>
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
