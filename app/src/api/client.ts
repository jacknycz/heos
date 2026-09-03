// Point this at the server's LAN address when running on a device (localhost won't reach your machine).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

// Set by AuthContext on login/logout/restore — kept module-level so the plain apiGet/apiPost/apiPatch
// helpers below don't need every call site to thread a token through.
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
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

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}
