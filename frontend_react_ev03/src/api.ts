import type {
  Categoria,
  HistorialMovimiento,
  Instrumento,
  PagedResponse,
  Prestamo,
  SessionUser,
  UsuarioPrestamo,
} from './types';

const API_BASE = 'http://localhost:8000/api';

function getCookieValue(name: string): string | null {
  const chunks = document.cookie.split(';');
  for (const chunk of chunks) {
    const [key, value] = chunk.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value ?? '');
    }
  }
  return null;
}

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isMutating = (init.method ?? 'GET').toUpperCase() !== 'GET';
  const csrfToken = getCookieValue('csrftoken');

  const headers = new Headers(init.headers);
  if (isMutating) {
    headers.set('Content-Type', 'application/json');
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const data = (await response.json()) as { detail?: string; error?: string };
      detail = data.error ?? data.detail ?? detail;
    } catch {
      // Si no hay cuerpo JSON, se mantiene el detalle por estado.
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const authApi = {
  async getCsrfToken(): Promise<void> {
    await http<{ csrfToken: string }>('/csrf-token/');
  },

  async login(username: string, password: string): Promise<SessionUser> {
    return http<SessionUser>('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async logout(): Promise<void> {
    await http<{ mensaje: string }>('/logout/', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async currentUser(): Promise<SessionUser> {
    return http<SessionUser>('/usuario-actual/');
  },
};

export const inventarioApi = {
  async listarCategorias(): Promise<Categoria[]> {
    const data = await http<PagedResponse<Categoria> | Categoria[]>('/categorias/');
    return Array.isArray(data) ? data : data.results;
  },

  async listarInstrumentos(): Promise<Instrumento[]> {
    const data = await http<PagedResponse<Instrumento> | Instrumento[]>('/instrumentos/');
    return Array.isArray(data) ? data : data.results;
  },

  async obtenerInstrumento(id: number): Promise<Instrumento> {
    return http<Instrumento>(`/instrumentos/${id}/`);
  },

  async crearInstrumento(payload: Partial<Instrumento>): Promise<Instrumento> {
    return http<Instrumento>('/instrumentos/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async actualizarInstrumento(id: number, payload: Partial<Instrumento>): Promise<Instrumento> {
    return http<Instrumento>(`/instrumentos/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async eliminarInstrumento(id: number): Promise<void> {
    await http<void>(`/instrumentos/${id}/`, {
      method: 'DELETE',
    });
  },

  async darDeBajaInstrumento(id: number, observacion: string): Promise<void> {
    await http<{ mensaje: string }>(`/instrumentos/${id}/dar_baja/`, {
      method: 'POST',
      body: JSON.stringify({ observacion }),
    });
  },

  async obtenerHistorialInstrumento(id: number): Promise<HistorialMovimiento[]> {
    return http<HistorialMovimiento[]>(`/instrumentos/${id}/historial/`);
  },

  async listarUsuariosPrestamo(): Promise<UsuarioPrestamo[]> {
    const data = await http<PagedResponse<UsuarioPrestamo> | UsuarioPrestamo[]>('/usuarios/');
    return Array.isArray(data) ? data : data.results;
  },

  async buscarUsuariosPrestamo(search: string): Promise<UsuarioPrestamo[]> {
    const params = new URLSearchParams({ search });
    const data = await http<PagedResponse<UsuarioPrestamo> | UsuarioPrestamo[]>(`/usuarios/?${params.toString()}`);
    return Array.isArray(data) ? data : data.results;
  },

  async crearUsuarioPrestamo(payload: Partial<UsuarioPrestamo>): Promise<UsuarioPrestamo> {
    return http<UsuarioPrestamo>('/usuarios/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listarPrestamos(): Promise<Prestamo[]> {
    const data = await http<PagedResponse<Prestamo> | Prestamo[]>('/prestamos/');
    return Array.isArray(data) ? data : data.results;
  },

  async crearPrestamo(payload: Partial<Prestamo>): Promise<Prestamo> {
    return http<Prestamo>('/prestamos/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async devolverPrestamo(id: number, observacion = 'Devolucion desde React EV03'): Promise<void> {
    await http<{ mensaje: string }>(`/prestamos/${id}/devolver/`, {
      method: 'POST',
      body: JSON.stringify({ observacion }),
    });
  },
};
