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