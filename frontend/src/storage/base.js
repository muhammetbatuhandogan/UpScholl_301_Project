export function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null || raw === "") {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

export function saveJSON(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}
