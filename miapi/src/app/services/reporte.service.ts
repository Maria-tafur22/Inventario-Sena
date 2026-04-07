import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estadisticas, ReporteVencido, ReporteEstadoInstrumento } from '../models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getEstadisticasGenerales(): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${this.apiUrl}/reportes/estadisticas_generales/`);
  }

  getReporteUsoInstrumentos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reportes/reporte_uso_instrumentos/`);
  }

  getReporteUsuariosMorosos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reportes/reporte_usuarios_morosos/`);
  }

  getReporteDetallesPrestamos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reportes/reporte_detalles_prestamos/`);
  }

  exportarReporteExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/reportes/exportar_reporte_excel/`, { responseType: 'blob' });
  }

  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
