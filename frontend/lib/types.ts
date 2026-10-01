export type TrendDirection = "up" | "down" | "neutral";
export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface KpiMetric {
  label: string;
  value: string;
  change: string;
  description: string;
  trend: TrendDirection;
}

export interface RevenuePoint {
  name: string;
  revenue: number;
  profit: number;
  target?: number;
}

export interface CategoryPerformance {
  name: string;
  sales: number;
  revenue: number;
}

export interface RegionPerformance {
  name: string;
  revenue: number;
  orders: number;
  growth: number;
}

export interface TopProduct {
  name: string;
  category: string;
  sales: number;
  revenue: number;
  profit: number;
  stock: number;
  status: "Healthy" | "Low stock" | "Overstock";
}

export interface Customer {
  id: string;
  name: string;
  orders: number;
  spending: number;
  lastPurchase: string;
  segment: "Enterprise" | "Growth" | "Retail";
  churnRisk: "Low" | "Medium" | "High";
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  profit: number;
  stock: number;
  status: "Healthy" | "Low stock" | "Overstock";
}

export interface InventoryItem {
  product: string;
  currentStock: number;
  predictedDemand: number;
  recommendedStock: number;
  risk: "Low" | "Medium" | "High";
  status: "Healthy" | "Watch" | "Critical";
}

export interface ForecastPoint {
  period: string;
  actual?: number;
  forecast: number;
}

export interface Dataset {
  filename: string;
  type: "CSV" | "Excel";
  rows: number;
  uploadDate: string;
  status: "Ready" | "Processing" | "Error";
  qualityScore: number;
}

export interface Pipeline {
  name: string;
  status: "SUCCESS" | "FAILED" | "RUNNING";
  rows: number;
  duration: string;
  startTime: string;
  endTime: string;
}

export interface MLModel {
  name: string;
  version: string;
  algorithm: string;
  dataset: string;
  trainingDate: string;
  f1: number;
  rocAuc: number;
  rmse: number;
  status: "Active" | "Preview" | "Monitoring";
}

export interface Report {
  name: string;
  type: string;
  generatedDate: string;
  format: "PDF" | "CSV" | "Excel";
  status: "Ready" | "Processing" | "Queued";
}

export interface AIInsight {
  title: string;
  summary: string;
  priority: string;
}

export interface SaleRecord {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
  region: string;
  category: string;
}

export interface PageFilter {
  label: string;
  value: string;
}
