import type { CategoryPerformance, KpiMetric, RevenuePoint, RegionPerformance, TopProduct } from "@/lib/types";

export const analyticsKpis: KpiMetric[] = [
  { label: "Daily Sales", value: "$53.4K", change: "+9.5%", description: "last 7 days", trend: "up" },
  { label: "Weekly Sales", value: "$284K", change: "+7.8%", description: "rolling 4 weeks", trend: "up" },
  { label: "Monthly Sales", value: "$1.2M", change: "+11.2%", description: "month to date", trend: "up" },
  { label: "Yearly Sales", value: "$14.7M", change: "+16.3%", description: "annual revenue", trend: "up" },
  { label: "Revenue", value: "$4.8M", change: "+12.4%", description: "cumulative sales", trend: "up" },
  { label: "Profit Margin", value: "26.2%", change: "+1.7%", description: "gross margin", trend: "up" },
];

export const salesTrend: RevenuePoint[] = [
  { name: "Mon", revenue: 48000, profit: 11800 },
  { name: "Tue", revenue: 52000, profit: 12980 },
  { name: "Wed", revenue: 49500, profit: 12140 },
  { name: "Thu", revenue: 61500, profit: 15360 },
  { name: "Fri", revenue: 69000, profit: 18220 },
  { name: "Sat", revenue: 72500, profit: 19480 },
  { name: "Sun", revenue: 68000, profit: 17830 },
];

export const categoryPerformance: CategoryPerformance[] = [
  { name: "Electronics", sales: 9100, revenue: 2580000 },
  { name: "Home", sales: 7600, revenue: 1940000 },
  { name: "Fashion", sales: 6000, revenue: 1490000 },
  { name: "Office", sales: 4800, revenue: 1170000 },
  { name: "Health", sales: 3700, revenue: 890000 },
];

export const productGrowth: TopProduct[] = [
  { name: "Apex Laptop 15", category: "Electronics", sales: 1460, revenue: 482000, profit: 129000, stock: 380, status: "Healthy" },
  { name: "Velo Smart Watch", category: "Electronics", sales: 1210, revenue: 416000, profit: 98000, stock: 210, status: "Healthy" },
  { name: "Northstar Desk", category: "Home", sales: 910, revenue: 273000, profit: 71250, stock: 110, status: "Low stock" },
  { name: "Summit Chair", category: "Office", sales: 780, revenue: 226000, profit: 60000, stock: 430, status: "Overstock" },
  { name: "Breeze Bottle", category: "Health", sales: 670, revenue: 182000, profit: 54000, stock: 190, status: "Healthy" },
];

export const customerMetrics = [
  { label: "New customers", value: "2,140" },
  { label: "Returning customers", value: "8,420" },
  { label: "Retention", value: "81.4%" },
  { label: "Average order value", value: "$247" },
  { label: "Customer lifetime value", value: "$4,280" },
];

export const geoPerformance: RegionPerformance[] = [
  { name: "United States", revenue: 1780000, orders: 6820, growth: 16 },
  { name: "Germany", revenue: 980000, orders: 3470, growth: 13 },
  { name: "Japan", revenue: 765000, orders: 2890, growth: 11 },
  { name: "Singapore", revenue: 520000, orders: 2100, growth: 19 },
];
