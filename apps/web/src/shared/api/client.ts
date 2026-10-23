const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message ?? 'Não foi possível concluir a operação');
  }

  return response.json() as Promise<T>;
}
