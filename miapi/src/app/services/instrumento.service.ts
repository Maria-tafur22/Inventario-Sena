import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Instrumento, Categoria } from '../models/instrumento.model';
import { ApiResponse } from '../models/reporte.model';

@Injectable({
  providedIn: 'root'
})
export class InstrumentoService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  // Categorías
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias/`);
  }

  crearCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.apiUrl}/categorias/`, categoria);
  }

  // Instrumentos
  getInstrumentos(search?: string, ordering?: string): Observable<any> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (ordering) params = params.set('ordering', ordering);
    
    return this.http.get<any>(`${this.apiUrl}/instrumentos/`, { params });
  }

  getInstrumento(id: number): Observable<Instrumento> {
    return this.http.get<Instrumento>(`${this.apiUrl}/instrumentos/${id}/`);
  }

  crearInstrumento(instrumento: Instrumento): Observable<Instrumento> {
    return this.http.post<Instrumento>(`${this.apiUrl}/instrumentos/`, instrumento);
  }

  actualizarInstrumento(id: number, instrumento: Instrumento): Observable<Instrumento> {
    return this.http.put<Instrumento>(`${this.apiUrl}/instrumentos/${id}/`, instrumento);
  }

  eliminarInstrumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/instrumentos/${id}/`);
  }

  darDeBaja(id: number, observacion?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/instrumentos/${id}/dar_baja/`, { observacion });
  }

  enviarMantenimiento(id: number, observacion?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/instrumentos/${id}/enviar_mantenimiento/`, { observacion });
  }

  cambiarEstadoFisico(id: number, nuevoEstado: string, observacion?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/instrumentos/${id}/cambiar_estado_fisico/`, {
      nuevo_estado: nuevoEstado,
      observacion: observacion
    });
  }

  obtenerHistorial(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/instrumentos/${id}/historial/`);
  }
}
