import Constants from 'expo-constants';

const FALLBACK_API_URL = 'https://upscholl-api.onrender.com';

const extraApiUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const BACKEND_ORIGIN = (extraApiUrl || FALLBACK_API_URL).replace(/\/$/, '');

export const API_BASE = `${BACKEND_ORIGIN}/api`;
