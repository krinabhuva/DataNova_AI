import type { AIInsight, CategoryPerformance, KpiMetric, RevenuePoint, RegionPerformance, TopProduct } from "@/lib/types";

export const dashboardKpis: KpiMetric[] = [
  { label: "Total Revenue", value: "$4.8M", change: "+12.4%", description: "vs last month", trend: "up" },
  { label: "Total Orders", value: "18,420", change: "+8.1%", description: "from prior period", trend: "up" },
  { label: "Customers", value: "12,680", change: "+6.3%", description: "new accounts", trend: "up" },
  { label: "Profit", value: "$1.26M", change: "+9.2%", description: "margin 26.2%", trend: "up" },
  { label: "Growth", value: "14.8%", change: "+2.4%", description: "year-over-year", trend: "up" },
  { label: "Inventory Value", value: "$2.1M", change: "-1.1%", description: "stock health", trend: "down" },
];

export const revenueTrend: RevenuePoint[] = [
  { name: "Jan", revenue: 240000, profit: 63000 },
  { name: "Feb", revenue: 270000, profit: 71000 },
  { name: "Mar", revenue: 295000, profit: 78000 },
  { name: "Apr", revenue: 325000, profit: 86000 },
  { name: "May", revenue: 360000, profit: 96000 },
  { name: "Jun", revenue: 410000, profit: 112000 },
  { name: "Jul", revenue: 446000, profit: 119000 },
  { name: "Aug", revenue: 480000, profit: 126000 },
  { name: "Sep", revenue: 510000, profit: 134000 },
  { name: "Oct", revenue: 540000, profit: 147000 },
  { name: "Nov", revenue: 575000, profit: 161000 },
  { name: "Dec", revenue: 620000, profit: 173000 },
];

export const salesByCategory: CategoryPerformance[] = [
  { name: "Electronics", sales: 4200, revenue: 1320000 },
  { name: "Home", sales: 3580, revenue: 1040000 },
  { name: "Fashion", sales: 5120, revenue: 980000 },
  { name: "Office", sales: 2980, revenue: 730000 },
  { name: "Health", sales: 2430, revenue: 640000 },
];

export const salesByRegion: RegionPerformance[] = [
  { name: "North America", revenue: 1820000, orders: 6200, growth: 18 },
  { name: "Europe", revenue: 1340000, orders: 5120, growth: 12 },
  { name: "Asia Pacific", revenue: 1560000, orders: 5450, growth: 22 },
  { name: "LATAM", revenue: 780000, orders: 2860, growth: 9 },
];

export const customerGrowth = [
  { month: "Jan", new: 640, returning: 2160 },
  { month: "Feb", new: 680, returning: 2240 },
  { month: "Mar", new: 710, returning: 2380 },
  { month: "Apr", new: 760, returning: 2450 },
  { month: "May", new: 820, returning: 2600 },
  { month: "Jun", new: 900, returning: 2820 },
  { month: "Jul", new: 960, returning: 2985 },
];

export const inventoryStatus = [
  { name: "Healthy", value: 62 },
  { name: "Watch", value: 24 },
  { name: "Critical", value: 14 },
];

export const topProducts: TopProduct[] = [
  { name: "Apex Laptop 15", category: "Electronics", sales: 1460, revenue: 482000, profit: 129000, stock: 380, status: "Healthy" },
  { name: "Velo Smart Watch", category: "Electronics", sales: 1210, revenue: 416000, profit: 98000, stock: 210, status: "Healthy" },
  { name: "Northstar Desk", category: "Home", sales: 910, revenue: 273000, profit: 71250, stock: 110, status: "Low stock" },
  { name: "Summit Chair", category: "Office", sales: 780, revenue: 226000, profit: 60000, stock: 430, status: "Overstock" },
  { name: "Breeze Bottle", category: "Health", sales: 670, revenue: 182000, profit: 54000, stock: 190, status: "Healthy" },
];

export const aiInsights: AIInsight[] = [
  { title: "Revenue increased", summary: "Revenue grew 12.4% in the last 30 days, led by electronics and North America expansions.", priority: "High" },
  { title: "Fastest-growing category", summary: "Electronics is up 18.7% with strong conversion in refurbished and premium bundles.", priority: "High" },
  { title: "Inventory risk", summary: "12 products are below threshold, primarily in home office and accessories categories.", priority: "Medium" },
  { title: "Customer churn risk", summary: "Retention dipped in the retail segment due to slower repeat order cadence.", priority: "Medium" },
];
