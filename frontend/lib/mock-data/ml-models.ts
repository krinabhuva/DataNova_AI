import type { MLModel } from "@/lib/types";

export const mlModels: MLModel[] = [
  { name: "Customer Churn", version: "v2.4", algorithm: "Gradient Boosting", dataset: "customer_activity", trainingDate: "2026-09-12", f1: 0.92, rocAuc: 0.89, rmse: 0.14, status: "Active" },
  { name: "Sales Forecast", version: "v3.1", algorithm: "XGBoost", dataset: "sales_history", trainingDate: "2026-09-06", f1: 0.88, rocAuc: 0.86, rmse: 0.31, status: "Active" },
  { name: "Customer Segmentation", version: "v1.9", algorithm: "K-Means", dataset: "customer_profiles", trainingDate: "2026-08-28", f1: 0.81, rocAuc: 0.83, rmse: 0.2, status: "Monitoring" },
  { name: "Inventory Demand", version: "v2.8", algorithm: "Random Forest", dataset: "inventory_demand", trainingDate: "2026-08-21", f1: 0.87, rocAuc: 0.82, rmse: 0.18, status: "Preview" },
  { name: "Anomaly Detection", version: "v1.5", algorithm: "Isolation Forest", dataset: "transaction_logs", trainingDate: "2026-07-19", f1: 0.79, rocAuc: 0.8, rmse: 0.42, status: "Monitoring" },
];
