import { API_BASE, BACKEND_ORIGIN } from './config';
import {
  clearTokens,
  readAccessToken,
  readRefreshToken,
  writeAccessToken,
  writeRefreshToken,
} from './auth';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function pingHealth(timeoutMs = 8000): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${BACKEND_ORIGIN}/health`, {}, timeoutMs);
    return response.ok;
  } catch {
    return false;
  }
}

// Render free tier puts the backend to sleep after inactivity; the first
// request can take up to ~60 seconds. Ping /health with retries instead of
// letting the first real request hang or fail.
export async function wakeBackend(
  onWaking?: () => void,
  retries = 15,
  delayMs = 4000,
): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    if (await pingHealth()) return true;
    onWaking?.();
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await readRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = fetchWithTimeout(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const data = await response.json();
        await writeAccessToken(data.access_token);
        await writeRefreshToken(data.refresh_token);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: string };

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
  retried = false,
): Promise<T> {
  const token = await readAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchWithTimeout(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401 && !retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    await clearTokens();
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.error) {
        message = errorBody.error;
      } else if (errorBody.detail) {
        message =
          typeof errorBody.detail === 'string'
            ? errorBody.detail
            : JSON.stringify(errorBody.detail);
      }
    } catch {
      // response body was not JSON; keep default message
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
