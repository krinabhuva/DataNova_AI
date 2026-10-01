import type { Customer, KpiMetric } from "@/lib/types";

export const customerKpis: KpiMetric[] = [
  { label: "Total Customers", value: "12,680", change: "+6.3%", description: "active accounts", trend: "up" },
  { label: "New Customers", value: "2,140", change: "+11.9%", description: "last 30 days", trend: "up" },
  { label: "Returning Customers", value: "8,420", change: "+7.2%", description: "repeat purchases", trend: "up" },
  { label: "Retention", value: "81.4%", change: "+2.1%", description: "customer loyalty", trend: "up" },
  { label: "Avg Spending", value: "$845", change: "+5.9%", description: "per customer", trend: "up" },
  { label: "CLV", value: "$4,280", change: "+8.7%", description: "customer lifetime", trend: "up" },
];

export const customerList: Customer[] = [
  { id: "C-101", name: "Olivia James", orders: 26, spending: 28400, lastPurchase: "2026-09-18", segment: "Enterprise", churnRisk: "Low" },
  { id: "C-102", name: "Ethan Brooks", orders: 18, spending: 17850, lastPurchase: "2026-09-12", segment: "Growth", churnRisk: "Medium" },
  { id: "C-103", name: "Ava Patel", orders: 31, spending: 31250, lastPurchase: "2026-09-21", segment: "Enterprise", churnRisk: "Low" },
  { id: "C-104", name: "Mason Nguyen", orders: 9, spending: 6250, lastPurchase: "2026-08-27", segment: "Retail", churnRisk: "High" },
  { id: "C-105", name: "Sophia Reed", orders: 23, spending: 20980, lastPurchase: "2026-09-11", segment: "Growth", churnRisk: "Low" },
  { id: "C-106", name: "Liam Garcia", orders: 15, spending: 14600, lastPurchase: "2026-08-17", segment: "Retail", churnRisk: "Medium" },
];
