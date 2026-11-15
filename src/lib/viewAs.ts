// Modo "ver como centro" del superadmin: mientras haya un centro activo, las
// llamadas a /admin/* de la API envían X-View-Center-Id (el backend las limita
// a solo lectura).
export const VIEW_CENTER_HEADER = 'X-View-Center-Id';

let viewCenterId: string | null = null;

export const setViewCenterId = (id: string | null) => {
  viewCenterId = id;
};

export const getViewCenterId = () => viewCenterId;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

let fetchPatched = false;

// Varias pantallas del panel usan fetch directo; se parchea una sola vez.
export const installViewAsFetch = () => {
  if (fetchPatched || typeof window === 'undefined') return;
  fetchPatched = true;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const id = viewCenterId;
    if (!id) return original(input, init);
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(`${API_URL}/admin/`)) return original(input, init);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set(VIEW_CENTER_HEADER, id);
    return original(input, { ...init, headers });
  };
};
