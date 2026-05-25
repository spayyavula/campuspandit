// src/lib/api.ts
// Minimal fetch wrapper for the campuspandit-observe API Gateway.
// Throws on non-2xx so call sites use try/catch.

const base = import.meta.env.VITE_API_BASE_URL;
if (!base) {
  console.warn('[api] VITE_API_BASE_URL is not set — API calls will fail.');
}

export class ApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`API ${status}: ${body}`);
  }
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const url = `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text();
    if (!res.ok) throw new ApiError(res.status, text);
    if (!text) throw new ApiError(res.status, 'empty response body');
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
};
