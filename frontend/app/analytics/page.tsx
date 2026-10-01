"use client";

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
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  analyticsKpis,
  analyticsSalesTrend as salesTrend,
  categoryPerformance,
  customerMetrics,
  geoPerformance,
  productGrowth,
} from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Deeper performance analysis across product, customer, and regional segments."
        action={<StatusBadge label="Updated 2h ago" tone="neutral" />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {analyticsKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Sales Analytics" subtitle="Daily sales trend and profit profile">
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
                <Line type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit" stroke="#94a3b8" strokeWidth={2.5} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Customer Analytics" subtitle="New and returning customer mix">
          <div className="grid gap-3 md:grid-cols-2">
            {customerMetrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Category Performance" subtitle="Revenue contribution by product category">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformance}>
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

        <SectionCard title="Geography" subtitle="Revenue by region and market">
          <div className="space-y-4">
            {geoPerformance.map((region) => (
              <div key={region.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{region.name}</span>
                  <span className="text-slate-500">${(region.revenue / 1000000).toFixed(2)}M</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-slate-900" style={{ width: `${Math.min((region.revenue / 1900000) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard title="Product Growth" subtitle="Top item movement and performance">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Sales</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {productGrowth.map((product) => (
                  <tr key={product.name} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">{product.sales}</td>
                    <td className="px-4 py-3">${(product.revenue / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-3">${(product.profit / 1000).toFixed(0)}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Key Insights" subtitle="Focus areas">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-lg bg-slate-50 p-3">Electronics is the fastest-growing category with strong premium conversion.</li>
            <li className="rounded-lg bg-slate-50 p-3">North America remains the dominant market, while Asia Pacific shows the strongest growth.</li>
            <li className="rounded-lg bg-slate-50 p-3">The retail segment has the highest churn risk and needs targeted retention outreach.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
