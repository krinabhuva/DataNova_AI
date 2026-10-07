export interface HealthResponse {
  status: "ok" | "degraded";
  service?: string;
  database?: string;
  message?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface AIAnswer {
  intent:
    | "revenue_explanation"
    | "top_products"
    | "highest_revenue_region"
    | "valuable_customers"
    | "inventory_risk"
    | "revenue_prediction";
  answer: string;
  key_findings: string[];
  recommendations: string[];
  confidence: "low" | "medium" | "high";
}

export async function askAI(question: string): Promise<AIAnswer> {
  const response = await fetch(`${API_BASE_URL}/api/ai/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    let message = `AI request failed with status ${response.status}.`;
    try {
      const payload = (await response.json()) as { detail?: string };
      message = payload.detail ?? message;
    } catch {}
    throw new Error(message);
  }
  return (await response.json()) as AIAnswer;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}

export async function fetchBackendStatus(): Promise<HealthResponse | null> {
  try {
    return await fetchHealth();
  } catch {
    return null;
  }
}

export type UserRole = "ADMIN" | "ANALYST" | "USER";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface DatasetRecord {
  id: number;
  filename: string;
  file_type: "CSV" | "Excel";
  content_type: string;
  file_size_bytes: number;
  row_count: number;
  column_count: number;
  uploaded_at: string;
}

export interface PipelineRunRecord {
  id: number;
  dataset_id: number;
  dataset_filename: string;
  pipeline_name: string;
  destination_table: string;
  status: "RUNNING" | "SUCCESS" | "FAILED";
  total_rows: number;
  valid_rows: number;
  rejected_rows: number;
  rows_loaded: number;
  load_status: "PENDING" | "SUCCESS" | "FAILED";
  load_error: string | null;
  duplicates: number;
  missing_values: number;
  quality_score: number;
  duration_ms: number;
  duration: string;
  started_at: string;
  finished_at: string | null;
  errors: string[];
}

export interface PipelineRunRequest {
  dataset_id: number;
  destination_table: string;
  missing_value_action: "keep" | "drop_row" | "fill";
  fill_value: string;
  duplicate_action: "drop" | "keep";
  numeric_columns: string[];
  date_columns: string[];
  drop_columns: string[];
  lowercase_columns: string[];
  uppercase_columns: string[];
  rename_columns: Record<string, string>;
  trim_strings: boolean;
  normalize_headers: boolean;
}

async function readDatasetError(response: Response): Promise<Error> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return new Error(payload.detail ?? "Dataset request failed.");
  } catch {
    return new Error(`Dataset request failed with status ${response.status}.`);
  }
}

async function readPipelineError(response: Response): Promise<Error> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return new Error(payload.detail ?? "Pipeline request failed.");
  } catch {
    return new Error(`Pipeline request failed with status ${response.status}.`);
  }
}

export async function fetchDatasets(): Promise<DatasetRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/datasets`, { cache: "no-store" });
  if (!response.ok) {
    throw await readDatasetError(response);
  }
  return (await response.json()) as DatasetRecord[];
}

export async function fetchDataset(datasetId: number): Promise<DatasetRecord> {
  const response = await fetch(`${API_BASE_URL}/api/datasets/${datasetId}`, { cache: "no-store" });
  if (!response.ok) {
    throw await readDatasetError(response);
  }
  return (await response.json()) as DatasetRecord;
}

export async function uploadDataset(file: File): Promise<DatasetRecord> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/datasets`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw await readDatasetError(response);
  }
  return (await response.json()) as DatasetRecord;
}

export async function deleteDataset(datasetId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/datasets/${datasetId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw await readDatasetError(response);
  }
}

export async function fetchPipelineRuns(): Promise<PipelineRunRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/pipelines`, { cache: "no-store" });
  if (!response.ok) {
    throw await readPipelineError(response);
  }
  return (await response.json()) as PipelineRunRecord[];
}

export async function fetchPipelineRun(runId: number): Promise<PipelineRunRecord> {
  const response = await fetch(`${API_BASE_URL}/api/pipelines/${runId}`, { cache: "no-store" });
  if (!response.ok) {
    throw await readPipelineError(response);
  }
  return (await response.json()) as PipelineRunRecord;
}

export async function executePipeline(request: PipelineRunRequest): Promise<PipelineRunRecord> {
  const response = await fetch(`${API_BASE_URL}/api/pipelines/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw await readPipelineError(response);
  }
  return (await response.json()) as PipelineRunRecord;
}

async function authRequest(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, string>,
): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/auth/${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    cache: "no-store",
  });
}

async function readAuthError(response: Response): Promise<Error> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return new Error(payload.detail ?? "Authentication request failed.");
  } catch {
    return new Error("Authentication request failed.");
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await authRequest("me", "GET");
  if (!response.ok) {
    throw await readAuthError(response);
  }
  return (await response.json()) as AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await authRequest("login", "POST", { email, password });
  if (!response.ok) {
    throw await readAuthError(response);
  }
  return (await response.json()) as AuthUser;
}

export async function register(
  email: string,
  fullName: string,
  password: string,
): Promise<AuthUser> {
  const response = await authRequest("register", "POST", {
    email,
    full_name: fullName,
    password,
  });
  if (!response.ok) {
    throw await readAuthError(response);
  }
  return (await response.json()) as AuthUser;
}

export async function logout(): Promise<void> {
  const response = await authRequest("logout", "POST");
  if (!response.ok) {
    throw await readAuthError(response);
  }
}

export interface AnalyticsResponse {
  summary: {
    total_revenue: number;
    total_orders: number;
    total_customers: number;
    total_profit: number;
    growth: number;
    inventory_value: number;
    profit_margin: number;
  };
  period_sales: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  revenue_trend: Array<{ name: string; revenue: number; profit: number }>;
  category_sales: Array<{ name: string; sales: number; revenue: number }>;
  regional_sales: Array<{ name: string; revenue: number; orders: number }>;
  top_products: Array<{
    name: string;
    category: string;
    sales: number;
    revenue: number;
    profit: number;
    stock: number;
  }>;
  customer_growth: Array<{ month: string; new: number; returning: number }>;
  customer_metrics: Array<{ label: string; value: number }>;
  inventory_status: Array<{ name: string; value: number; count: number }>;
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analytics`, { cache: "no-store" });
  if (!response.ok) {
    let message = `Analytics request failed with status ${response.status}.`;
    try {
      const payload = (await response.json()) as { detail?: string };
      message = payload.detail ?? message;
    } catch {}
    throw new Error(message);
  }
  return (await response.json()) as AnalyticsResponse;
}

export interface CustomerRecord {
  id: number;
  customer_code: string;
  name: string;
  email: string | null;
  phone: string | null;
  region: string | null;
  city: string | null;
  created_at: string;
}

export interface MLModelRecord {
  id: number;
  model_key: string;
  name: string;
  version: string;
  algorithm: string;
  dataset: string;
  training_date: string;
  metrics: Record<string, number | string | null>;
  status: "Active" | "Preview" | "Monitoring";
}

export interface SegmentationResult {
  status: "trained" | "insufficient_data";
  message?: string;
  algorithm?: string;
  metrics: Record<string, number>;
  customers: Array<{
    customer_id: number;
    customer_code: string;
    name: string;
    recency_days: number;
    frequency: number;
    monetary: number;
    segment: string;
  }>;
}

export interface ChurnResult {
  status: "trained" | "preview" | "insufficient_data";
  algorithm?: string;
  message?: string;
  metrics: Record<string, number | null>;
  predictions: Array<{
    customer_id: number;
    customer_code: string;
    name: string;
    churn_probability: number;
    churn_risk: "Low" | "Medium" | "High";
  }>;
}

export interface ForecastResult {
  status: "trained" | "preview" | "insufficient_data";
  algorithm?: string;
  message?: string;
  metrics: Record<string, number | string | null>;
  history: Array<{ period: string; actual: number }>;
  forecast: Array<{ period: string; forecast: number }>;
}

export interface InventoryDemandResult {
  status: "trained" | "preview" | "insufficient_data";
  algorithm?: string;
  message?: string;
  metrics: Record<string, number>;
  inventory_value: number;
  items: Array<{
    product_id: number;
    product: string;
    current_stock: number;
    predicted_demand: number;
    recommended_stock: number;
    risk: "Low" | "Medium" | "High";
    status: "Healthy" | "Watch" | "Critical";
  }>;
}

export interface AnomalyResult {
  status: "trained" | "preview" | "insufficient_data";
  algorithm?: string;
  message?: string;
  metrics: Record<string, number>;
  anomalies: Array<{
    sale_id: number;
    order_id: number;
    customer_id: number;
    product_id: number;
    order_date: string;
    quantity: number;
    revenue: number;
    profit: number;
    anomaly_score: number;
  }>;
}

async function mlRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/ml/${path}`, {
    method: "POST",
    cache: "no-store",
  });
  if (!response.ok) {
    let message = `ML request failed with status ${response.status}.`;
    try {
      const payload = (await response.json()) as { detail?: string };
      message = payload.detail ?? message;
    } catch {}
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function fetchCustomers(): Promise<CustomerRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/customers?limit=500`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Customer request failed with status ${response.status}.`);
  return (await response.json()) as CustomerRecord[];
}

export async function fetchMlModels(): Promise<MLModelRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/ml/models`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Model catalog request failed with status ${response.status}.`);
  return (await response.json()) as MLModelRecord[];
}

export async function fetchCustomerSegmentation(): Promise<SegmentationResult> {
  return mlRequest("segmentation");
}

export async function fetchCustomerChurn(): Promise<ChurnResult> {
  return mlRequest("churn");
}

export async function fetchSalesForecast(horizon: number): Promise<ForecastResult> {
  return mlRequest(`forecast?horizon=${horizon}`);
}

export async function fetchInventoryDemand(): Promise<InventoryDemandResult> {
  return mlRequest("inventory-demand");
}

export async function fetchSalesAnomalies(): Promise<AnomalyResult> {
  return mlRequest("anomalies");
}

export async function trainMlSuite(): Promise<void> {
  await fetchCustomerSegmentation();
  await fetchCustomerChurn();
  await fetchSalesForecast(3);
  await fetchInventoryDemand();
  await fetchSalesAnomalies();
}