import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prestamo, Usuario, ReporteAlerta } from '../models/prestamo.model';
import { ApiResponse } from '../models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class PrestamoService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // Usuarios
  getUsuarios(search?: string): Observable<any> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    
    return this.http.get<any>(`${this.apiUrl}/usuarios/`, { params });
  }

  crearUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios/`, usuario);
  }

  // Préstamos
  getPrestamos(search?: string): Observable<any> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    
    return this.http.get<any>(`${this.apiUrl}/prestamos/`, { params });
  }

  getPrestamo(id: number): Observable<Prestamo> {
    return this.http.get<Prestamo>(`${this.apiUrl}/prestamos/${id}/`);
  }

  crearPrestamo(prestamo: Prestamo): Observable<Prestamo> {
    return this.http.post<Prestamo>(`${this.apiUrl}/prestamos/`, prestamo);
  }

  devolverPrestamo(id: number, observacion?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/prestamos/${id}/devolver/`, { observacion });
  }

  getPrestamosVencidos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/prestamos/vencidos/`);
  }

  getPrestamosProximosAVencer(): Observable<any> {
    return this.http.get(`${this.apiUrl}/prestamos/proximos_a_vencer/`);
  }

  exportarExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/prestamos/exportar_excel/`, { responseType: 'blob' });
  }

  reporteEstadoInstrumentos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/prestamos/reporte_estado_instrumentos/`);
  }

  generarAlertas(prestamos: Prestamo[]): ReporteAlerta[] {
    const alertas: ReporteAlerta[] = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    prestamos.forEach(prestamo => {
      if (prestamo.fecha_vencimiento) {
        const fechaVencimiento = new Date(prestamo.fecha_vencimiento);
        const diasDiferencia = Math.floor((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        if (diasDiferencia < 0) {
          // Vencido
          alertas.push({
            id: `alerta-${prestamo.id}`,
            tipo: 'danger',
            titulo: '⚠️ PRÉSTAMO VENCIDO',
            descripcion: `${prestamo.usuario_nombre} no ha devuelto el ${prestamo.instrumento_nombre}. Vencido hace ${Math.abs(diasDiferencia)} días.`,
            fecha: prestamo.fecha_vencimiento,
            prestamo
          });
        } else if (diasDiferencia === 0) {
          // Vence hoy
          alertas.push({
            id: `alerta-${prestamo.id}`,
            tipo: 'warning',
            titulo: '🔔 PRÉSTAMO VENCE HOY',
            descripcion: `${prestamo.usuario_nombre} debe devolver ${prestamo.instrumento_nombre} hoy.`,
            fecha: prestamo.fecha_vencimiento,
            prestamo
          });
        } else if (diasDiferencia <= 3) {
          // Próximo a vencer
          alertas.push({
            id: `alerta-${prestamo.id}`,
            tipo: 'info',
            titulo: '⏰ PRÓXIMO A VENCER',
            descripcion: `${prestamo.usuario_nombre} debe devolver ${prestamo.instrumento_nombre} en ${diasDiferencia} días.`,
            fecha: prestamo.fecha_vencimiento,
            prestamo
          });
        }
      }
    });

    return alertas;
  }
}
