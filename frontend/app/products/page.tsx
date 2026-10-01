"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { productKpis, productList } from "@/lib/mock-data";

export default function ProductsPage() {
  return (
    <div>
      <PageHeader title="Products" subtitle="Track product health, category mix, and performance by SKU." action={<StatusBadge label="Inventory synced" tone="success" />} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {productKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6">
        <SectionCard title="Product catalog" subtitle="Top and low-performing products across categories">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Sales</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-4 py-3 font-medium">Profit</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product) => (
                  <tr key={product.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">{product.sales}</td>
                    <td className="px-4 py-3">${(product.revenue / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-3">${(product.profit / 1000).toFixed(0)}K</td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={product.status}
                        tone={product.status === "Healthy" ? "success" : product.status === "Low stock" ? "warning" : "danger"}
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
