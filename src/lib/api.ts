export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, "Sem conexão com o servidor. Verifique sua internet.");
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (body as { error?: string } | null)?.error ?? "Erro inesperado. Tente novamente.";
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

export const apiGet = <T,>(path: string, headers?: Record<string, string>) =>
  request<T>(path, { headers });

export const apiPost = <T,>(path: string, data: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(data) });

export const apiPatch = <T,>(path: string, data: unknown, headers?: Record<string, string>) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(data), headers });
