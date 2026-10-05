export interface HealthResponse {
  status: "ok" | "degraded";
  service?: string;
  database?: string;
  message?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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