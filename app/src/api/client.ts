// Point this at the server's LAN address when running on a device (localhost won't reach your machine).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

// Set by AuthContext on login/logout/restore — kept module-level so the plain apiGet/apiPost/apiPatch
// helpers below don't need every call site to thread a token through.
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

// Thrown for any response the server actually sent back with an error status, so callers can
// tell "the server said no" (status set) apart from "never reached the server" (a plain fetch
// TypeError), which matters for deciding whether a saved session is really invalid.
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function extractErrorMessage(res: Response) {
  try {
    const body = await res.json();
    return body?.error ?? JSON.stringify(body);
  } catch {
    return res.statusText;
  }
}

function authHeaders(): Record<string, string> {
  return authToken ? { authorization: `Bearer ${authToken}` } : {};
}

async function request(path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { ...init.headers, ...authHeaders() } });
  if (!res.ok) throw new ApiError(await extractErrorMessage(res), res.status);
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  return (await request(path, {})).json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return (await request(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return (await request(path, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();
}

export async function apiDelete(path: string): Promise<void> {
  await request(path, { method: "DELETE" });
}
