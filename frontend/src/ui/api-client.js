import { buildAuthHeaders, readAuthToken } from "../core/auth";

export const BACKEND_ORIGIN = "http://localhost:4010";
export const API_BASE = `${BACKEND_ORIGIN}/api`;

export async function request(path, options = {}) {
  const { token } = readAuthToken();
  const { headers: authHeaders } = buildAuthHeaders({
    token,
    headers: { "Content-Type": "application/json" }
  });
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders,
    ...options
  });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody.error) {
        message = errorBody.error;
      } else if (errorBody.detail) {
        message = errorBody.detail;
      }
    } catch (_ignored) {}
    throw new Error(message);
  }
  return response.json();
}
