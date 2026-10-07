"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { fetchInventoryDemand, InventoryDemandResult } from "@/lib/api";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryDemandResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    fetchInventoryDemand()
      .then((result) => {
        if (!active) return;
        setInventory(result);
        setError("");
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load inventory demand predictions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const inventoryItems = inventory?.items ?? [];
  const chartData = inventoryItems.map((item) => ({
    name: item.product,
    current: item.current_stock,
    predicted: item.predicted_demand,
    recommended: item.recommended_stock,
  }));
  const atRiskCount = inventoryItems.filter((item) => item.risk !== "Low").length;
  const overstockedCount = inventoryItems.filter((item) => item.current_stock > item.recommended_stock * 1.5).length;
  const inventoryKpis = [
    { label: "Inventory Value", value: `$${(inventory?.inventory_value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: "current", description: "recorded stock value", trend: "neutral" as const },
    { label: "Total Products", value: inventoryItems.length.toLocaleString(), change: "total", description: "forecasted products", trend: "neutral" as const },
    { label: "Low Stock", value: atRiskCount.toLocaleString(), change: "model", description: "watch or critical risk", trend: atRiskCount ? "down" as const : "neutral" as const },
    { label: "Overstocked", value: overstockedCount.toLocaleString(), change: "model", description: "above recommended stock", trend: "neutral" as const },
  ];
  const priorityItems = [...inventoryItems].sort((left, right) => {
    const riskRank = { High: 0, Medium: 1, Low: 2 };
    return riskRank[left.risk] - riskRank[right.risk];
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Operational stock health and demand planning insights."
        action={<StatusBadge label={inventory?.algorithm ?? "Loading model"} tone="info" />}
      />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(""); setLoading(true); setRetry((current) => current + 1); }} className="font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {!loading && inventoryKpis.map((metric) => <KpiCard key={metric.label} {...metric} />)}
        {loading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />)}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Demand vs Recommended Stock" subtitle="Predicted next-month demand versus recommended stock">
          {loading || error || !chartData.length ? <AnalyticsPanelState loading={loading} empty={!error && !chartData.length} /> : <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip />
                <Bar dataKey="current" fill="#0f172a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="predicted" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="recommended" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>}
        </SectionCard>

        <SectionCard title="Inventory notes" subtitle="High-priority items">
          {loading || error || !priorityItems.length ? <AnalyticsPanelState loading={loading} empty={!error && !priorityItems.length} /> : <div className="space-y-3">
            {priorityItems.slice(0, 4).map((item) => (
              <div key={item.product} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">{item.product}</span>
                  <StatusBadge
                    label={item.status}
                    tone={item.status === "Healthy" ? "success" : item.status === "Watch" ? "warning" : "danger"}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-600">Current stock: {item.current_stock}</p>
                <p className="text-sm text-slate-600">Predicted demand: {item.predicted_demand}</p>
                <p className="text-sm text-slate-600">Recommended: {item.recommended_stock}</p>
              </div>
            ))}
          </div>}
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Inventory table" subtitle="Demand and replenishment planning">
          {loading || error || !inventoryItems.length ? <AnalyticsPanelState loading={loading} empty={!error && !inventoryItems.length} /> : <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Current stock</th>
                  <th className="px-4 py-3 font-medium">Predicted demand</th>
                  <th className="px-4 py-3 font-medium">Recommended stock</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.product} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.product}</td>
                    <td className="px-4 py-3">{item.current_stock}</td>
                    <td className="px-4 py-3">{item.predicted_demand}</td>
                    <td className="px-4 py-3">{item.recommended_stock}</td>
                    <td className="px-4 py-3">{item.risk}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={item.status}
                        tone={item.status === "Healthy" ? "success" : item.status === "Watch" ? "warning" : "danger"}
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