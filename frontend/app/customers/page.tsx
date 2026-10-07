"use client";

import { useEffect, useState } from "react";

import { KpiCard } from "@/components/ui/KpiCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ChurnResult,
  CustomerRecord,
  fetchCustomerChurn,
  fetchCustomerSegmentation,
  fetchCustomers,
  SegmentationResult,
} from "@/lib/api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [segmentation, setSegmentation] = useState<SegmentationResult["customers"]>([]);
  const [churn, setChurn] = useState<ChurnResult["predictions"]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchCustomers(), fetchCustomerSegmentation(), fetchCustomerChurn()])
      .then(([customerRecords, segments, churnScores]) => {
        if (!active) return;
        setCustomers(customerRecords);
        setSegmentation(segments.customers);
        setChurn(churnScores.predictions);
        setSelectedCustomerId(customerRecords[0]?.id ?? null);
        setCurrentTimestamp(Date.now());
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load customer model results.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const segmentByCode = new Map(segmentation.map((item) => [item.customer_code, item]));
  const churnByCode = new Map(churn.map((item) => [item.customer_code, item]));
  const customerList = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    orders: segmentByCode.get(customer.customer_code)?.frequency ?? 0,
    spending: segmentByCode.get(customer.customer_code)?.monetary ?? 0,
    lastPurchase: segmentByCode.has(customer.customer_code)
      ? `${segmentByCode.get(customer.customer_code)?.recency_days} days ago`
      : "No purchase history",
    segment: segmentByCode.get(customer.customer_code)?.segment ?? "Not scored",
    churnRisk: churnByCode.get(customer.customer_code)?.churn_risk ?? "Not scored",
  }));
  const selectedCustomer = customerList.find((customer) => customer.id === selectedCustomerId) ?? null;
  const scoredCustomers = segmentation.length;
  const returningCustomers = segmentation.filter((customer) => customer.frequency > 1).length;
  const totalSpend = segmentation.reduce((sum, customer) => sum + customer.monetary, 0);
  const recentCustomerCount = currentTimestamp === null ? 0 : customers.filter((customer) => currentTimestamp - new Date(customer.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length;
  const customerKpis = [
    { label: "Total Customers", value: customers.length.toLocaleString(), change: "total", description: "registered accounts", trend: "neutral" as const },
    { label: "New Customers", value: recentCustomerCount.toLocaleString(), change: "30 days", description: "recent registrations", trend: "neutral" as const },
    { label: "Returning Customers", value: returningCustomers.toLocaleString(), change: "model", description: "multiple orders", trend: "neutral" as const },
    { label: "Retention", value: `${scoredCustomers ? (returningCustomers / scoredCustomers * 100).toFixed(1) : "0.0"}%`, change: "model", description: "repeat purchasers", trend: "neutral" as const },
    { label: "Avg Spending", value: `$${(scoredCustomers ? totalSpend / scoredCustomers : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: "lifetime", description: "per purchasing customer", trend: "neutral" as const },
    { label: "CLV", value: `$${(scoredCustomers ? totalSpend / scoredCustomers : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: "observed", description: "average recorded spend", trend: "neutral" as const },
  ];

  return (
    <div>
      <PageHeader title="Customers" subtitle="Customer health, relationships, and acquisition trends." />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => { setError(""); setLoading(true); setRetry((current) => current + 1); }} className="font-medium underline underline-offset-2">Retry</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {customerKpis.map((metric) => (
          <KpiCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <SectionCard title="Customer list" subtitle="Top accounts and lifecycle segments">
          {loading ? <p className="py-10 text-center text-sm text-slate-500" role="status">Loading customer records and model scores…</p> : !customerList.length ? <p className="py-10 text-center text-sm text-slate-500" role="status">No customer records available.</p> : <div className="overflow-x-auto rounded-xl border border-slate-200">
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
                  <tr key={customer.id} className="cursor-pointer border-t border-slate-200 hover:bg-slate-50" onClick={() => setSelectedCustomerId(customer.id)}>
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
          </div>}
        </SectionCard>

        <SectionCard title="Customer details" subtitle="Selected account profile">
          {selectedCustomer ? <div className="space-y-4">
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
          </div> : <p className="py-10 text-center text-sm text-slate-500" role="status">Select a customer with purchase history to view model scores.</p>}
        </SectionCard>
      </div>
    </div>
  );
}
