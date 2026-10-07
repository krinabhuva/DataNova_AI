"use client";

import { useEffect, useState } from "react";
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

import { AnalyticsPanelState } from "@/components/ui/AnalyticsPanelState";
import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AnalyticsResponse, fetchAnalytics } from "@/lib/api";

function formatCurrency(value: number): string {
  return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

export default function AnalyticsPage() {
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
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load analytics.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const summary = analytics?.summary;
  const periodSales = analytics?.period_sales;
  const analyticsKpis = summary && periodSales ? [
    { label: "Daily Sales", value: formatCurrency(periodSales.daily), change: "latest", description: "most recent sales day", trend: "neutral" },
    { label: "Weekly Sales", value: formatCurrency(periodSales.weekly), change: "latest", description: "rolling 7 days", trend: "neutral" },
    { label: "Monthly Sales", value: formatCurrency(periodSales.monthly), change: "latest", description: "latest sales month", trend: "neutral" },
    { label: "Yearly Sales", value: formatCurrency(periodSales.yearly), change: "latest", description: "latest sales year", trend: "neutral" },
    { label: "Revenue", value: formatCurrency(summary.total_revenue), change: "total", description: "cumulative sales", trend: "neutral" },
    { label: "Profit Margin", value: `${summary.profit_margin.toFixed(1)}%`, change: "total", description: "gross margin", trend: "neutral" },
  ] as const : [];
  const salesTrend = analytics?.revenue_trend ?? [];
  const categoryPerformance = analytics?.category_sales ?? [];
  const geoPerformance = analytics?.regional_sales ?? [];
  const productGrowth = analytics?.top_products ?? [];
  const customerMetrics = analytics?.customer_metrics ?? [];
  const maxRegionalRevenue = Math.max(...geoPerformance.map((region) => region.revenue), 0);
  const insights = [
    categoryPerformance[0] && `Top category: ${categoryPerformance[0].name} at ${formatCurrency(categoryPerformance[0].revenue)} in revenue.`,
    geoPerformance[0] && `Leading region: ${geoPerformance[0].name} at ${formatCurrency(geoPerformance[0].revenue)} in revenue.`,
    productGrowth[0] && `Best-selling product: ${productGrowth[0].name} with ${productGrowth[0].sales.toLocaleString()} units sold.`,
  ].filter((insight): insight is string => Boolean(insight));

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Deeper performance analysis across product, customer, and regional segments."
        action={<StatusBadge label="Live data" tone="info" />}
      />

      {error && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(""); setLoading(true); setRetry((current) => current + 1); }} className="font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {analyticsKpis.map((metric) => <KpiCard key={metric.label} {...metric} />)}
        {loading && Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />)}
      </div>
      {!loading && !error && summary?.total_orders === 0 && summary.total_customers === 0 && (
        <p className="mt-4 text-sm text-slate-500" role="status">No business data is available yet.</p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Sales Analytics" subtitle="Monthly revenue trend and profit profile">
          {loading || error || !salesTrend.length ? <AnalyticsPanelState loading={loading} empty={!error && !salesTrend.length} /> : <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip formatter={(value) => {
                  const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                  return [formatCurrency(numericValue), "Value"];
                }} />
                <Line type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit" stroke="#94a3b8" strokeWidth={2.5} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>}
        </SectionCard>

        <SectionCard title="Customer Analytics" subtitle="New and returning customer mix">
          {loading || error || !customerMetrics.length || !summary?.total_orders ? <AnalyticsPanelState loading={loading} empty={!error && !summary?.total_orders} /> : <div className="grid gap-3 md:grid-cols-2">
            {customerMetrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {metric.label === "Retention" ? `${metric.value}%` : metric.label.includes("order") || metric.label.includes("lifetime") ? formatCurrency(metric.value) : metric.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard title="Category Performance" subtitle="Revenue contribution by product category">
          {loading || error || !categoryPerformance.length ? <AnalyticsPanelState loading={loading} empty={!error && !categoryPerformance.length} /> : <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformance}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip formatter={(value) => {
                  const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                  return [formatCurrency(numericValue), "Revenue"];
                }} />
                <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>}
        </SectionCard>

        <SectionCard title="Geography" subtitle="Revenue by region and market">
          {loading || error || !geoPerformance.length ? <AnalyticsPanelState loading={loading} empty={!error && !geoPerformance.length} /> : <div className="space-y-4">
            {geoPerformance.map((region) => (
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
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard title="Product Growth" subtitle="Top item movement and performance">
          {loading || error || !productGrowth.length ? <AnalyticsPanelState loading={loading} empty={!error && !productGrowth.length} /> : <div className="overflow-hidden rounded-xl border border-slate-200">
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
                    <td className="px-4 py-3">{product.sales.toLocaleString()}</td>
                    <td className="px-4 py-3">{formatCurrency(product.revenue)}</td>
                    <td className="px-4 py-3">{formatCurrency(product.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </SectionCard>

        <SectionCard title="Key Insights" subtitle="Focus areas">
          {loading || error || !insights.length ? <AnalyticsPanelState loading={loading} empty={!error && !insights.length} /> : <ul className="space-y-3 text-sm text-slate-600">
            {insights.map((insight) => <li key={insight} className="rounded-lg bg-slate-50 p-3">{insight}</li>)}
          </ul>}
        </SectionCard>
      </div>
    </div>
  );
}