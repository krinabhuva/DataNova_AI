"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
  aiInsights,
  customerGrowth,
  dashboardKpis,
  inventoryStatus,
  revenueTrend,
  salesByCategory,
  salesByRegion,
  topProducts,
} from "@/lib/mock-data";

const pieColors = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard overview"
        subtitle="Snapshot of revenue, customer, and inventory performance."
        action={<StatusBadge label="Live snapshot" tone="info" />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {dashboardKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Revenue Trend" subtitle="Revenue and profit over the last 12 months">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                    return [`$${(numericValue / 1000).toFixed(0)}K`, "Value"];
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2.5} fill="url(#revenueFill)" />
                <Area type="monotone" dataKey="profit" stroke="#64748b" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Inventory Status" subtitle="Stock health by tier">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inventoryStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {inventoryStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                    return [`${numericValue}%`, "Share"];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {inventoryStatus.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                  {item.name}
                </div>
                <span className="font-medium text-slate-700">{item.value}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SectionCard title="Sales by Category" subtitle="Revenue contribution by product group">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByCategory}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                    return [`$${(numericValue / 1000).toFixed(0)}K`, "Revenue"];
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Sales by Region" subtitle="Regional performance">
          <div className="space-y-4">
            {salesByRegion.map((region) => (
              <div key={region.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{region.name}</span>
                  <span className="text-slate-500">${(region.revenue / 1000000).toFixed(2)}M</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-slate-900" style={{ width: `${Math.min((region.revenue / 2000000) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Customer Growth" subtitle="New and returning customer trend">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerGrowth}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="new" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returning" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Top Products" subtitle="Best performing products this period">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Sales</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.name} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">{product.sales}</td>
                    <td className="px-4 py-3">${(product.revenue / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-3">{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="AI Business Insights" subtitle="Actionable recommendations">
          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <div key={insight.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="font-medium text-slate-900">{insight.title}</h4>
                  <StatusBadge label={insight.priority} tone={insight.priority === "High" ? "warning" : "info"} />
                </div>
                <p className="text-sm text-slate-600">{insight.summary}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
