"use client";

import { useEffect, useState } from "react";
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
import { AnalyticsPanelState } from "@/components/ui/AnalyticsPanelState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AnalyticsResponse, fetchAnalytics } from "@/lib/api";

const pieColors = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

function formatCurrency(value: number): string {
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    fetchAnalytics()
      .then((data) => {
        if (!active) return;
        setAnalytics(data);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load dashboard analytics.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const summary = analytics?.summary;
  const growth = summary?.growth ?? 0;
  const growthLabel = `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`;
  const growthTrend = growth > 0 ? "up" : growth < 0 ? "down" : "neutral";
  const dashboardKpis = summary ? [
    { label: "Total Revenue", value: formatCurrency(summary.total_revenue), change: growthLabel, description: "vs prior month", trend: growthTrend },
    { label: "Total Orders", value: summary.total_orders.toLocaleString(), change: "total", description: "all stored orders", trend: "neutral" },
    { label: "Customers", value: summary.total_customers.toLocaleString(), change: "total", description: "all registered customers", trend: "neutral" },
    { label: "Profit", value: formatCurrency(summary.total_profit), change: "total", description: `margin ${summary.profit_margin.toFixed(1)}%`, trend: "neutral" },
    { label: "Growth", value: growthLabel, change: "monthly", description: "latest complete sales month", trend: growthTrend },
    { label: "Inventory Value", value: formatCurrency(summary.inventory_value), change: "current", description: "recorded stock value", trend: "neutral" },
  ] as const : [];
  const revenueTrend = analytics?.revenue_trend ?? [];
  const inventoryStatus = analytics?.inventory_status ?? [];
  const salesByCategory = analytics?.category_sales ?? [];
  const salesByRegion = analytics?.regional_sales ?? [];
  const customerGrowth = analytics?.customer_growth ?? [];
  const topProducts = analytics?.top_products ?? [];
  const maxRegionalRevenue = Math.max(...salesByRegion.map((region) => region.revenue), 0);

  return (
    <div>
      <PageHeader
        title="Dashboard overview"
        subtitle="Snapshot of revenue, customer, and inventory performance."
        action={<StatusBadge label="Live snapshot" tone="info" />}
      />

      {error && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(""); setLoading(true); setRetry((current) => current + 1); }} className="font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {dashboardKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
        {loading && Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />)}
      </div>
      {!loading && !error && analytics && summary?.total_orders === 0 && summary.total_customers === 0 && (
        <p className="mt-4 text-sm text-slate-500" role="status">No business data is available yet. Load customers, orders, sales, and inventory to populate this dashboard.</p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SectionCard title="Revenue Trend" subtitle="Revenue and profit over the last 12 months">
          {loading || error || !revenueTrend.length ? <AnalyticsPanelState loading={loading} empty={!error && !revenueTrend.length} /> : <div className="h-80">
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
                    return [formatCurrency(numericValue), "Value"];
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2.5} fill="url(#revenueFill)" />
                <Area type="monotone" dataKey="profit" stroke="#64748b" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>}
        </SectionCard>

        <SectionCard title="Inventory Status" subtitle="Stock health by tier">
          {loading || error || !inventoryStatus.some((item) => item.count > 0) ? <AnalyticsPanelState loading={loading} empty={!error && !inventoryStatus.some((item) => item.count > 0)} /> : <>
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
          </>}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SectionCard title="Sales by Category" subtitle="Revenue contribution by product group">
          {loading || error || !salesByCategory.length ? <AnalyticsPanelState loading={loading} empty={!error && !salesByCategory.length} /> : <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByCategory}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value) => {
                    const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                    return [formatCurrency(numericValue), "Revenue"];
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#0f172a" />
              </BarChart>
            </ResponsiveContainer>
          </div>}
        </SectionCard>

        <SectionCard title="Sales by Region" subtitle="Regional performance">
          {loading || error || !salesByRegion.length ? <AnalyticsPanelState loading={loading} empty={!error && !salesByRegion.length} /> : <div className="space-y-4">
            {salesByRegion.map((region) => (
              <div key={region.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{region.name}</span>
                  <span className="text-slate-500">{formatCurrency(region.revenue)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div className="h-2.5 rounded-full bg-slate-900" style={{ width: `${maxRegionalRevenue ? Math.min((region.revenue / maxRegionalRevenue) * 100, 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>}
        </SectionCard>

        <SectionCard title="Customer Growth" subtitle="New and returning customer trend">
          {loading || error || !customerGrowth.length ? <AnalyticsPanelState loading={loading} empty={!error && !customerGrowth.length} /> : <div className="h-72">
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
          </div>}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Top Products" subtitle="Best performing products this period">
          {loading || error || !topProducts.length ? <AnalyticsPanelState loading={loading} empty={!error && !topProducts.length} /> :
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
                    <td className="px-4 py-3">{formatCurrency(product.revenue)}</td>
                    <td className="px-4 py-3">{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </SectionCard>

        <SectionCard title="AI Business Insights" subtitle="Actionable recommendations">
          <AnalyticsPanelState loading={false} empty emptyMessage="No generated insights available." />
        </SectionCard>
      </div>
    </div>
  );
}
