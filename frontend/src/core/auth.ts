const DEFAULT_TOKEN_KEY = 'upscholl_access_token';
const DEFAULT_REFRESH_KEY = 'upscholl_refresh_token';

type HeaderMap = Record<string, string>;

type StorageKeyInput = {
  storageKey?: string;
};

type WriteAuthTokenInput = StorageKeyInput & {
  token: string;
};

type BuildAuthHeadersInput = {
  token?: string | null;
  headers?: HeaderMap;
};

export const readAuthToken = ({ storageKey = DEFAULT_TOKEN_KEY }: StorageKeyInput = {}): { token: string | null } => {
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) return { token: null };
  const token = window.localStorage.getItem(storageKey);
  return { token };
};

export const writeAuthToken = ({ token, storageKey = DEFAULT_TOKEN_KEY }: WriteAuthTokenInput): { ok: boolean } => {
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) return { ok: false };
  window.localStorage.setItem(storageKey, token);
  return { ok: true };
};

export const clearAuthToken = ({ storageKey = DEFAULT_TOKEN_KEY }: StorageKeyInput = {}): { ok: boolean } => {
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) return { ok: false };
  window.localStorage.removeItem(storageKey);
  return { ok: true };
};

export const readRefreshToken = ({ storageKey = DEFAULT_REFRESH_KEY }: StorageKeyInput = {}): { token: string | null } => {
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) return { token: null };
  const token = window.localStorage.getItem(storageKey);
  return { token };
};

export const writeRefreshToken = ({ token, storageKey = DEFAULT_REFRESH_KEY }: WriteAuthTokenInput): { ok: boolean } => {
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) return { ok: false };
  window.localStorage.setItem(storageKey, token);
  return { ok: true };
};

export const clearRefreshToken = ({ storageKey = DEFAULT_REFRESH_KEY }: StorageKeyInput = {}): { ok: boolean } => {
  const hasWindow = typeof window !== 'undefined';
  if (!hasWindow) return { ok: false };
  window.localStorage.removeItem(storageKey);
  return { ok: true };
};

export const clearAllTokens = (): { ok: boolean } => {
  clearAuthToken();
  clearRefreshToken();
  return { ok: true };
};

export const buildAuthHeaders = ({ token, headers = {} }: BuildAuthHeadersInput = {}): { headers: HeaderMap } => {
  if (!token) return { headers };
  return {
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  };
};
