import {
  clearAllTokens,
  writeAuthToken,
  writeRefreshToken
} from "../core/auth";
import { request } from "../ui/api-client.js";

export function applyLoginResponse(data) {
  writeAuthToken({ token: data.access_token });
  writeRefreshToken({ token: data.refresh_token });
  return data.user;
}

export async function loginWithPassword(username, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  const user = applyLoginResponse(data);
  return { user, data };
}

export async function requestOtp(phone) {
  return request("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone })
  });
}

export async function verifyOtp(phone, code) {
  const data = await request("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ phone, code })
  });
  const user = applyLoginResponse(data);
  return { user, data };
}

export async function logoutSession() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch (_error) {
    // Token may already be invalid; still clear local storage.
  }
  clearAllTokens();
}
