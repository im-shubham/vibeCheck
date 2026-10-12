/** Tiny typed fetch wrapper for our own route handlers. Throws ApiError with a safe message. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export async function api<T = unknown>(url: string, init?: Omit<RequestInit, "body"> & { json?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...init?.headers },
      body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
    });
  } catch {
    throw new ApiError("Network problem — check your connection and try again.", 0);
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(typeof body.error === "string" ? body.error : "Something went wrong. Please try again.", res.status, body);
  return body as T;
}

export const errMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
