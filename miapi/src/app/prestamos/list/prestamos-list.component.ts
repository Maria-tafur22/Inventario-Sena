import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrestamoService } from '../../services/prestamo.service';
import { InstrumentoService } from '../../services/instrumento.service';
import { Prestamo, Usuario } from '../../models/prestamo.model';
import { Instrumento } from '../../models/instrumento.model';

@Component({
  selector: 'app-prestamos-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prestamos-list.component.html',
  styleUrls: ['./prestamos-list.component.css']
})
export class PrestamosListComponent implements OnInit {
  // Data
  prestamos: Prestamo[] = [];
  usuarios: Usuario[] = [];
  instrumentos: Instrumento[] = [];
  
  // Filtros
  searchTerm: string = '';
  filtroEstado: string = '';
  
  // UI State
  loading: boolean = true;
  showNewPrestamoModal: boolean = false;
  showDevolucionModal: boolean = false;
  selectedPrestamo: Prestamo | null = null;
  errorMessage: string = '';
  successMessage: string = '';

  // Objeto para crear préstamo
  newPrestamo: Prestamo = this.resetPrestamo();

  // Objeto para devolución
  devolucion = {
    observacion: ''
  };

  constructor(
    private prestamoService: PrestamoService,
    private instrumentoService: InstrumentoService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Carga todos los datos necesarios del backend
   */
  cargarDatos(): void {
    this.loading = true;
    this.errorMessage = '';

    // Cargar usuarios
    this.prestamoService.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = Array.isArray(data) ? data : data.results || [];
        console.log('✅ Usuarios cargados:', this.usuarios.length);
      },
      error: (err) => {
        console.error('❌ Error cargando usuarios:', err);
        this.mostrarError('No se pudieron cargar los usuarios');
      }
    });

    // Cargar instrumentos
    this.instrumentoService.getInstrumentos().subscribe({
      next: (data) => {
        this.instrumentos = Array.isArray(data) ? data : data.results || [];
        console.log('✅ Instrumentos cargados:', this.instrumentos.length);
      },
      error: (err) => {
        console.error('❌ Error cargando instrumentos:', err);
        this.mostrarError('No se pudieron cargar los instrumentos');
      }
    });

    // Cargar préstamos
    this.prestamoService.getPrestamos().subscribe({
      next: (data) => {
        this.prestamos = Array.isArray(data) ? data : data.results || [];
        this.loading = false;
        console.log('✅ Préstamos cargados:', this.prestamos.length);
      },
      error: (err) => {
        console.error('❌ Error cargando préstamos:', err);
        this.mostrarError('No se pudieron cargar los préstamos');
        this.loading = false;
      }
    });
  }

  /**
   * Filtra la lista de préstamos
   */
  filtrarPrestamos(): Prestamo[] {
    return this.prestamos.filter(p => {
      const cumpleEstado = !this.filtroEstado || p.estado === this.filtroEstado;
      const cumpleBusqueda = !this.searchTerm || 
        (p.usuario_nombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false) ||
        (p.instrumento_nombre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ?? false);
      
      return cumpleEstado && cumpleBusqueda;
    });
  }

  /**
   * Abre el modal para crear nuevo préstamo
   */
  abrirNuevoPrestamo(): void {
    this.newPrestamo = this.resetPrestamo();
    this.errorMessage = '';
    this.showNewPrestamoModal = true;
  }

  /**
   * Valida los datos del préstamo
   */
  private validarPrestamo(): { valido: boolean; mensaje?: string } {
    // Validar usuario
    if (!this.newPrestamo.usuario || this.newPrestamo.usuario === 0) {
      return { valido: false, mensaje: '❌ Selecciona un usuario' };
    }

    // Validar instrumento
    if (!this.newPrestamo.instrumento || this.newPrestamo.instrumento === 0) {
      return { valido: false, mensaje: '❌ Selecciona un instrumento' };
    }

    // Validar que el instrumento esté disponible
    const instrumento = this.instrumentos.find(i => i.id === this.newPrestamo.instrumento);
    if (instrumento && instrumento.estado !== 'disponible') {
      return { valido: false, mensaje: `❌ El instrumento no está disponible (está ${instrumento.estado})` };
    }

    // Validar fecha de préstamo
    if (!this.newPrestamo.fecha_prestamo) {
      return { valido: false, mensaje: '❌ Selecciona la fecha del préstamo' };
    }

    // Validar fecha de vencimiento
    if (!this.newPrestamo.fecha_vencimiento) {
      return { valido: false, mensaje: '❌ Selecciona la fecha de vencimiento' };
    }

    // Validar que vencimiento sea después del préstamo
    const fechaPrestamo = new Date(this.newPrestamo.fecha_prestamo);
    const fechaVencimiento = new Date(this.newPrestamo.fecha_vencimiento);
    
    if (fechaVencimiento <= fechaPrestamo) {
      return { valido: false, mensaje: '❌ La fecha de vencimiento debe ser posterior a la del préstamo' };
    }

    return { valido: true };
  }

  /**
   * Guarda un nuevo préstamo en BD
   */
  guardarPrestamo(): void {
    // Validar datos
    const validacion = this.validarPrestamo();
    if (!validacion.valido) {
      this.errorMessage = validacion.mensaje || 'Error de validación';
      return;
    }

    console.log('📝 Creando préstamo:', {
      usuario: this.newPrestamo.usuario,
      instrumento: this.newPrestamo.instrumento,
      fecha_prestamo: this.newPrestamo.fecha_prestamo,
      fecha_vencimiento: this.newPrestamo.fecha_vencimiento
    });

    this.prestamoService.crearPrestamo(this.newPrestamo).subscribe({
      next: () => {
        this.mostrarExito('✅ Préstamo registrado correctamente');
        this.cargarDatos();
        this.closeModal();
      },
      error: (err) => {
        console.error('❌ Error al crear préstamo:', err);
        this.mostrarError(`Error al crear: ${err.error?.error || err.message}`);
      }
    });
  }

  /**
   * Abre el modal para devolver un préstamo
   */
  abrirDevolucion(prestamo: Prestamo): void {
    this.selectedPrestamo = prestamo;
    this.devolucion.observacion = '';
    this.errorMessage = '';
    this.showDevolucionModal = true;
  }

  /**
   * Registra la devolución de un instrumento
   */
  guardarDevolucion(): void {
    if (!this.selectedPrestamo?.id) {
      this.mostrarError('❌ Error: Préstamo no identificado');
      return;
    }

    console.log('↩️ Devolviendo préstamo:', {
      prestamo_id: this.selectedPrestamo.id,
      observacion: this.devolucion.observacion
    });

    this.prestamoService.devolverPrestamo(
      Number(this.selectedPrestamo.id),
      this.devolucion.observacion
    ).subscribe({
      next: () => {
        this.mostrarExito('✅ Instrumento devuelto correctamente');
        this.cargarDatos();
        this.closeDevolucionModal();
      },
      error: (err) => {
        console.error('❌ Error al devolver:', err);
        this.mostrarError(`Error al devolver: ${err.error?.error || err.message}`);
      }
    });
  }

  /**
   * Cierra el modal de nuevo préstamo
   */
  closeModal(): void {
    this.showNewPrestamoModal = false;
    this.newPrestamo = this.resetPrestamo();
    this.errorMessage = '';
  }

  /**
   * Cierra el modal de devolución
   */
  closeDevolucionModal(): void {
    this.showDevolucionModal = false;
    this.selectedPrestamo = null;
    this.devolucion.observacion = '';
    this.errorMessage = '';
  }

  /**
   * Obtiene el nombre del usuario por ID
   */
  getUsuarioName(usuarioId: number): string {
    const usuario = this.usuarios.find(u => u.id === usuarioId);
    return usuario ? usuario.nombre : 'Desconocido';
  }

  /**
   * Obtiene el nombre del instrumento por ID
   */
  getInstrumentoName(instrumentoId: number): string {
    const instrumento = this.instrumentos.find(i => i.id === instrumentoId);
    return instrumento ? instrumento.nombre : 'Desconocido';
  }

  /**
   * Formatea una fecha a formato local
   */
  formatFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  /**
   * Calcula días restantes hasta el vencimiento
   */
  diasRestantes(fechaVencimiento: string): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    return Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Determina el estado de alerta según días restantes
   */
  estadoAlerta(dias: number): string {
    if (dias < 0) return 'danger'; // Vencido
    if (dias <= 3) return 'warning'; // Próximo a vencer
    return 'success'; // Normal
  }

  /**
   * Reinicia el objeto préstamo
   */
  private resetPrestamo(): Prestamo {
    const hoy = new Date().toISOString().split('T')[0];
    const vencimiento = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return {
      usuario: 0,
      instrumento: 0,
      fecha_prestamo: hoy,
      fecha_vencimiento: vencimiento,
      estado: 'disponible',
      observaciones: '',
      usuario_nombre: '',
      instrumento_nombre: ''
    };
  }

  /**
   * Muestra mensaje de error temporalmente
   */
  private mostrarError(mensaje: string): void {
    this.errorMessage = mensaje;
    setTimeout(() => this.errorMessage = '', 5000);
  }

  /**
   * Muestra mensaje de éxito temporalmente
   */
  private mostrarExito(mensaje: string): void {
    this.successMessage = mensaje;
    setTimeout(() => this.successMessage = '', 3000);
  }
}
