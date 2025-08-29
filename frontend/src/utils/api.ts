const apiBase = 'http://10.45.16.69:8787';

export async function fetchJson<T>(path: string, options?: RequestInit) {
  const res = await fetch(apiBase + path, options);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return (await res.json()) as T;
}
