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