const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export const TOKEN_KEY = "rb_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const token = options.auth === false ? null : getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const { body: payload, auth: _auth, ...rest } = options;
  const init: RequestInit = { ...rest, headers };
  if (payload !== undefined) init.body = JSON.stringify(payload);

  const res = await fetch(`${API_URL}${path}`, init);

  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string, options?: ApiOptions) => api<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    api<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    api<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: ApiOptions) => api<T>(path, { ...options, method: "DELETE" }),
};