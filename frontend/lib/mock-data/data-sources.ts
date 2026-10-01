import type { Dataset, KpiMetric } from "@/lib/types";

export const dataSourceKpis: KpiMetric[] = [
  { label: "Connected Sources", value: "24", change: "+3", description: "live data feeds", trend: "up" },
  { label: "Rows Processed", value: "8.4M", change: "+12.5%", description: "last 7 days", trend: "up" },
  { label: "Quality Score", value: "97.3%", change: "+0.6%", description: "data health", trend: "up" },
  { label: "Pending Imports", value: "6", change: "-2", description: "scheduled uploads", trend: "up" },
];

export const datasets: Dataset[] = [
  { filename: "sales_q3.csv", type: "CSV", rows: 184200, uploadDate: "2026-09-24", status: "Ready", qualityScore: 98 },
  { filename: "customer_segments.xlsx", type: "Excel", rows: 64200, uploadDate: "2026-09-20", status: "Ready", qualityScore: 95 },
  { filename: "inventory_forecast.csv", type: "CSV", rows: 264100, uploadDate: "2026-09-18", status: "Processing", qualityScore: 91 },
  { filename: "region_overview.xlsx", type: "Excel", rows: 18200, uploadDate: "2026-09-15", status: "Error", qualityScore: 83 },
];
