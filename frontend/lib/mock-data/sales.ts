import type { CategoryPerformance, KpiMetric, RegionPerformance, RevenuePoint } from "@/lib/types";

export const salesKpis: KpiMetric[] = [
  { label: "Revenue", value: "$4.8M", change: "+12.4%", description: "current period", trend: "up" },
  { label: "Orders", value: "18,420", change: "+8.1%", description: "fulfillment rate 96%", trend: "up" },
  { label: "Profit", value: "$1.26M", change: "+9.2%", description: "gross margin 26.2%", trend: "up" },
  { label: "Avg Order Value", value: "$261", change: "+4.7%", description: "customer basket", trend: "up" },
];

export const salesTrend: RevenuePoint[] = [
  { name: "Jan", revenue: 315000, profit: 86000 },
  { name: "Feb", revenue: 348000, profit: 92000 },
  { name: "Mar", revenue: 390000, profit: 104000 },
  { name: "Apr", revenue: 425000, profit: 112000 },
  { name: "May", revenue: 462000, profit: 124000 },
  { name: "Jun", revenue: 495000, profit: 138000 },
  { name: "Jul", revenue: 542000, profit: 146000 },
  { name: "Aug", revenue: 580000, profit: 158000 },
  { name: "Sep", revenue: 610000, profit: 167000 },
  { name: "Oct", revenue: 642000, profit: 172000 },
  { name: "Nov", revenue: 689000, profit: 187000 },
  { name: "Dec", revenue: 735000, profit: 206000 },
];

export const categorySummary: CategoryPerformance[] = [
  { name: "Electronics", sales: 4200, revenue: 1320000 },
  { name: "Home", sales: 3580, revenue: 1040000 },
  { name: "Fashion", sales: 5120, revenue: 980000 },
  { name: "Office", sales: 2980, revenue: 730000 },
  { name: "Health", sales: 2430, revenue: 640000 },
];

export const regionalPerformance: RegionPerformance[] = [
  { name: "North America", revenue: 1820000, orders: 6200, growth: 18 },
  { name: "Europe", revenue: 1340000, orders: 5120, growth: 12 },
  { name: "Asia Pacific", revenue: 1560000, orders: 5450, growth: 22 },
  { name: "LATAM", revenue: 780000, orders: 2860, growth: 9 },
];
