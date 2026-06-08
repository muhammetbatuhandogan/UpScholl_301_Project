import {
  buildAuthHeaders,
  readAuthToken,
  readRefreshToken,
  writeAuthToken,
  writeRefreshToken
} from "../core/auth";

const DEFAULT_BACKEND_ORIGIN = "http://localhost:4010";

export const BACKEND_ORIGIN = (
  import.meta.env.VITE_API_URL || DEFAULT_BACKEND_ORIGIN
).replace(/\/$/, "");

export const API_BASE = `${BACKEND_ORIGIN}/api`;

let refreshInFlight = null;

async function refreshAccessToken() {
  const { token: refreshToken } = readRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const data = await response.json();
        writeAuthToken({ token: data.access_token });
        writeRefreshToken({ token: data.refresh_token });
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

export async function request(path, options = {}, retried = false) {
  const { token } = readAuthToken();
  const { headers: authHeaders } = buildAuthHeaders({
    token,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: authHeaders
  });

  if (response.status === 401 && !retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, options, true);
    }
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.error) {
        message = errorBody.error;
      } else if (errorBody.detail) {
        message =
          typeof errorBody.detail === "string"
            ? errorBody.detail
            : JSON.stringify(errorBody.detail);
      }
    } catch (_ignored) {}
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
