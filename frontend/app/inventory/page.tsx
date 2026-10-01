"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { inventoryItems, inventoryKpis } from "@/lib/mock-data";

const chartData = inventoryItems.map((item) => ({
  name: item.product,
  current: item.currentStock,
  predicted: item.predictedDemand,
  recommended: item.recommendedStock,
}));

export default function InventoryPage() {
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Operational stock health and demand planning insights." action={<StatusBadge label="Synced" tone="success" />} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {inventoryKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Demand vs Recommended Stock" subtitle="Predicted demand versus recommended reorder levels">
          <div className="h-80">
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
          </div>
        </SectionCard>

        <SectionCard title="Inventory notes" subtitle="High-priority items">
          <div className="space-y-3">
            {inventoryItems.slice(0, 4).map((item) => (
              <div key={item.product} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">{item.product}</span>
                  <StatusBadge
                    label={item.status}
                    tone={item.status === "Healthy" ? "success" : item.status === "Watch" ? "warning" : "danger"}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-600">Current stock: {item.currentStock}</p>
                <p className="text-sm text-slate-600">Recommended: {item.recommendedStock}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Inventory table" subtitle="Demand and replenishment planning">
          <div className="overflow-hidden rounded-xl border border-slate-200">
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
                    <td className="px-4 py-3">{item.currentStock}</td>
                    <td className="px-4 py-3">{item.predictedDemand}</td>
                    <td className="px-4 py-3">{item.recommendedStock}</td>
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
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
