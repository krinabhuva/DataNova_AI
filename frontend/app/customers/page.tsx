"use client";

import { useState } from "react";

import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { customerKpis, customerList } from "@/lib/mock-data";

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(customerList[0]);

  return (
    <div>
      <PageHeader title="Customers" subtitle="Customer health, relationships, and acquisition trends." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {customerKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <SectionCard title="Customer list" subtitle="Top accounts and lifecycle segments">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Spending</th>
                  <th className="px-4 py-3 font-medium">Last Purchase</th>
                  <th className="px-4 py-3 font-medium">Segment</th>
                  <th className="px-4 py-3 font-medium">Churn Risk</th>
                </tr>
              </thead>
              <tbody>
                {customerList.map((customer) => (
                  <tr key={customer.id} className="cursor-pointer border-t border-slate-200 hover:bg-slate-50" onClick={() => setSelectedCustomer(customer)}>
                    <td className="px-4 py-3 font-medium text-slate-900">{customer.name}</td>
                    <td className="px-4 py-3">{customer.orders}</td>
                    <td className="px-4 py-3">${customer.spending.toLocaleString()}</td>
                    <td className="px-4 py-3">{customer.lastPurchase}</td>
                    <td className="px-4 py-3">{customer.segment}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={customer.churnRisk}
                        tone={customer.churnRisk === "Low" ? "success" : customer.churnRisk === "Medium" ? "warning" : "danger"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Customer details" subtitle="Selected account profile">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Customer</p>
                <h4 className="mt-1 text-xl font-semibold text-slate-900">{selectedCustomer.name}</h4>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {selectedCustomer.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Orders</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedCustomer.orders}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Spend</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">${selectedCustomer.spending.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Segment</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedCustomer.segment}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Churn Risk</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedCustomer.churnRisk}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Last purchase: <span className="font-medium text-slate-900">{selectedCustomer.lastPurchase}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
