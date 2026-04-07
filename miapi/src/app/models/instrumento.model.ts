// Instrumento
export interface Instrumento {
  id?: string | number;
  nombre: string;
  referencia: string;
  categoria: string | number;
  categoria_nombre?: string;
  marca?: string;
  modelo?: string;
  fecha_adquisicion?: string;
  estado: 'disponible' | 'prestado' | 'mantenimiento' | 'baja';
  valor_reemplazo?: number;
  ubicacion_fisica?: string;
  cantidad?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  observaciones?: string;
  // Para compatibilidad con el JS anterior
  codigo?: string;
  numeroSerie?: string;
  condicion?: string;
  responsable?: string;
}

export interface Categoria {
  id?: string | number;
  nombre: string;
  descripcion?: string;
}
