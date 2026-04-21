export type Rol = 'administrador' | 'almacenista' | 'profesor' | 'estudiante' | 'usuario';

export interface SessionUser {
  user_id: number;
  username: string;
  email?: string;
  rol: Rol;
  is_authenticated?: boolean;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Instrumento {
  id: number;
  nombre: string;
  referencia: string;
  codigo?: string;
  marca?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  numeroSerie?: string | null;
  fecha_adquisicion?: string | null;
  valor_adquisicion?: number | null;
  condicion?: 'Excelente' | 'Buena' | 'Regular' | 'Requiere Reparacion' | string;
  ubicacion_fisica?: string | null;
  ubicacion?: string | null;
  responsable?: string | null;
  observaciones?: string | null;
  estado: 'disponible' | 'prestado' | 'mantenimiento' | 'baja';
  categoria: number;
  categoria_nombre?: string | null;
  cantidad?: number;
}

export interface UsuarioPrestamo {
  id: number;
  nombre: string;
  documento: string;
  telefono?: string | null;
  correo?: string | null;
  tipo: 'profesor' | 'estudiante';
}

export interface Prestamo {
  id: number;
  instrumento: number;
  instrumento_referencia?: string | null;
  instrumento_nombre?: string;
  usuario: number;
  usuario_documento?: string | null;
  usuario_nombre?: string;
  estado: 'disponible' | 'enuso' | 'reparacion';
  fecha_prestamo?: string | null;
  fecha_vencimiento?: string | null;
  fecha_devolucion?: string | null;
  dias_permitidos?: number | null;
  observaciones?: string | null;
}

export interface HistorialMovimiento {
  id: number;
  tipo_movimiento: string;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
  observacion?: string | null;
  fecha_cambio: string;
  cambiado_por_nombre?: string | null;
}

export interface PagedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
