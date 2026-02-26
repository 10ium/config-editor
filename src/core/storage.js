const KEY = 'proxy-config-studio:v1';

export function loadRows() {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRows(rows) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}
