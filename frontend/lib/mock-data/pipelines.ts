import type { Pipeline } from "@/lib/types";

export const pipelines: Pipeline[] = [
  { name: "Sales ETL", status: "SUCCESS", rows: 182400, duration: "00:25:34", startTime: "09:00", endTime: "09:25" },
  { name: "Customer ETL", status: "SUCCESS", rows: 64200, duration: "00:18:22", startTime: "09:32", endTime: "09:50" },
  { name: "Inventory ETL", status: "FAILED", rows: 0, duration: "00:06:18", startTime: "10:05", endTime: "10:11" },
  { name: "Forecast Refresh", status: "RUNNING", rows: 27600, duration: "00:12:08", startTime: "10:15", endTime: "10:27" },
];
