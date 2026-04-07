import { Instrumento } from './instrumento.model';

// Préstamo
export interface Prestamo {
  id?: string | number;
  instrumento: string | number | Instrumento;
  instrumento_nombre?: string;
  instrumento_referencia?: string;
  instrumento_estado?: string;
  usuario: string | number | Usuario;
  usuario_nombre?: string;
  usuario_documento?: string;
  usuario_correo?: string;
  usuario_telefono?: string;
  fecha_prestamo?: string;
  fecha_vencimiento?: string;
  fecha_devolucion?: string | null;
  estado: 'disponible' | 'enuso' | 'reparacion';
  observaciones?: string;
  dias_permitidos?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface Usuario {
  id?: string | number;
  nombre: string;
  documento: string;
  tipo: 'profesor' | 'estudiante';
  telefono?: string;
  correo?: string;
  activo?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface ReporteAlerta {
  id: string;
  tipo: 'danger' | 'warning' | 'info';
  titulo: string;
  descripcion: string;
  fecha?: string;
  prestamo?: Prestamo;
}
