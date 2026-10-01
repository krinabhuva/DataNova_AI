import type { KpiMetric, Product } from "@/lib/types";

export const productKpis: KpiMetric[] = [
  { label: "Total Products", value: "3,420", change: "+2.4%", description: "active SKUs", trend: "up" },
  { label: "Top Products", value: "124", change: "+14.6%", description: "high-volume items", trend: "up" },
  { label: "Low Performing", value: "36", change: "-5.1%", description: "underperformers", trend: "up" },
  { label: "Category Mix", value: "5", change: "+1", description: "major product groups", trend: "up" },
];

export const productList: Product[] = [
  { id: "P-1001", name: "Apex Laptop 15", category: "Electronics", sales: 1460, revenue: 482000, profit: 129000, stock: 380, status: "Healthy" },
  { id: "P-1002", name: "Velo Smart Watch", category: "Electronics", sales: 1210, revenue: 416000, profit: 98000, stock: 210, status: "Healthy" },
  { id: "P-1003", name: "Northstar Desk", category: "Home", sales: 910, revenue: 273000, profit: 71250, stock: 110, status: "Low stock" },
  { id: "P-1004", name: "Summit Chair", category: "Office", sales: 780, revenue: 226000, profit: 60000, stock: 430, status: "Overstock" },
  { id: "P-1005", name: "Breeze Bottle", category: "Health", sales: 670, revenue: 182000, profit: 54000, stock: 190, status: "Healthy" },
  { id: "P-1006", name: "Aero Speaker", category: "Electronics", sales: 520, revenue: 154000, profit: 43000, stock: 86, status: "Low stock" },
];
