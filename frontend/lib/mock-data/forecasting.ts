import type { ForecastPoint, KpiMetric } from "@/lib/types";

export const forecastingKpis: KpiMetric[] = [
  { label: "Historical Sales", value: "$8.4M", change: "+14.2%", description: "past 12 months", trend: "up" },
  { label: "Forecasted Sales", value: "$9.7M", change: "+15.8%", description: "next 90 days", trend: "up" },
  { label: "Forecast Horizon", value: "90 Days", change: "+1.5x", description: "planning window", trend: "up" },
  { label: "Expected Growth", value: "17.4%", change: "+2.1%", description: "quarter over quarter", trend: "up" },
];

export const forecastSeries: ForecastPoint[] = [
  { period: "Jan", actual: 310000, forecast: 290000 },
  { period: "Feb", actual: 340000, forecast: 325000 },
  { period: "Mar", actual: 385000, forecast: 360000 },
  { period: "Apr", actual: 410000, forecast: 390000 },
  { period: "May", actual: 455000, forecast: 430000 },
  { period: "Jun", actual: 490000, forecast: 470000 },
  { period: "Jul", actual: 540000, forecast: 510000 },
  { period: "Aug", actual: 580000, forecast: 560000 },
  { period: "Sep", actual: 610000, forecast: 600000 },
  { period: "Oct", actual: 642000, forecast: 640000 },
  { period: "Nov", actual: 689000, forecast: 680000 },
  { period: "Dec", actual: 735000, forecast: 720000 },
  { period: "Jan+", forecast: 760000 },
  { period: "Feb+", forecast: 800000 },
  { period: "Mar+", forecast: 845000 },
];
