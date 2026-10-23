/** Browser-facing fetch wrapper — hits our Next.js proxy, not Aurora directly. */

export async function auroraFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api/aurora${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Request failed (${res.status})`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}
