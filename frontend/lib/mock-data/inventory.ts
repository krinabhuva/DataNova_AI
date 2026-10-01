import type { InventoryItem, KpiMetric } from "@/lib/types";

export const inventoryKpis: KpiMetric[] = [
  { label: "Inventory Value", value: "$2.1M", change: "-1.1%", description: "inventory health", trend: "down" },
  { label: "Total Products", value: "3,420", change: "+2.4%", description: "active SKUs", trend: "up" },
  { label: "Low Stock", value: "276", change: "+11.5%", description: "risk items", trend: "down" },
  { label: "Overstocked", value: "184", change: "-4.8%", description: "optimized stock", trend: "up" },
];

export const inventoryItems: InventoryItem[] = [
  { product: "Apex Laptop 15", currentStock: 380, predictedDemand: 420, recommendedStock: 410, risk: "Low", status: "Healthy" },
  { product: "Northstar Desk", currentStock: 110, predictedDemand: 240, recommendedStock: 260, risk: "High", status: "Critical" },
  { product: "Summit Chair", currentStock: 430, predictedDemand: 220, recommendedStock: 240, risk: "Medium", status: "Watch" },
  { product: "Breeze Bottle", currentStock: 190, predictedDemand: 185, recommendedStock: 240, risk: "Low", status: "Healthy" },
  { product: "Velo Smart Watch", currentStock: 210, predictedDemand: 255, recommendedStock: 300, risk: "Medium", status: "Watch" },
  { product: "Aero Speaker", currentStock: 86, predictedDemand: 180, recommendedStock: 180, risk: "High", status: "Critical" },
];
