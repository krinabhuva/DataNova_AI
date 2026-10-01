import type { Report } from "@/lib/types";

export const reports: Report[] = [
  { name: "Sales Report", type: "Executive Summary", generatedDate: "2026-09-28", format: "PDF", status: "Ready" },
  { name: "Customer Report", type: "Retention Analysis", generatedDate: "2026-09-27", format: "CSV", status: "Ready" },
  { name: "Inventory Report", type: "Stock Health", generatedDate: "2026-09-25", format: "Excel", status: "Processing" },
  { name: "Executive Report", type: "Quarterly Review", generatedDate: "2026-09-23", format: "PDF", status: "Queued" },
];
