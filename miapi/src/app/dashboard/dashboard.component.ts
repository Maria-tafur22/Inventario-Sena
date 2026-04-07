import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule  } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { InstrumentoService } from '../services/instrumento.service';
import { PrestamoService } from '../services/prestamo.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: any;
  
  // Data Storage
  instruments: any[] = [];
  loans: any[] = [];
  editingInstrumentId: string | null = null;
  returningLoan: any = null;
  
  // Bloquear reintentos infinitos
  private isLoadingData = false;
  private loadAttempts = 0;
  private maxLoadAttempts = 1;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private instrumentoService: InstrumentoService,
    private prestamoService: PrestamoService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    // ✅ Obtener usuario desde el servidor (valida sesión)
    this.authService.obtenerUsuarioActual().subscribe({
      next: (userData) => {
        this.currentUser = userData;
        console.log('✅ Usuario actual cargado:', this.currentUser.username, 'Rol:', this.currentUser.rol);
        
        // Continuar con carga de datos
        this.loadData();
        this.renderDashboard();
      },
      error: (err) => {
        console.error('❌ No se pudo obtener usuario actual:', err);
        if (err.status === 401) {
          console.error('   Sesión inválida o expirada');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          this.showAlert('error', 'Error de Autenticación', 'No se pudo verificar tu sesión. Inicia sesión nuevamente.');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar si es necesario
  }

  // ==================
  // DATA MANAGEMENT
  // ==================

  loadData(): void {
    // Evitar bucle infinito de peticiones
    if (this.isLoadingData) {
      console.warn('⚠️ loadData() ya está en progreso, ignorando nueva solicitud');
      return;
    }

    // ✅ Con sesiones, no necesitamos verificar token
    // La sesión se valida automáticamente en el servidor

    this.isLoadingData = true;
    this.loadAttempts++;

    console.log('📡 Cargando instrumentos desde API... (intento ' + this.loadAttempts + ')');
    // Cargar instrumentos desde la base de datos
    this.instrumentoService.getInstrumentos().subscribe({
      next: (response: any) => {
        console.log('✅ Instrumentos cargados:', response);
        this.instruments = response.results || response || [];
        this.renderDashboard();
        this.isLoadingData = false;
      },
      error: (err) => {
        console.error('❌ Error cargando instrumentos:', err);
        this.isLoadingData = false;
        
        if (err.status === 403) {
          console.error('🔐 Sesión inválida o sin permisos');
          
          this.showAlert('error', 'Acceso Denegado', 'Tu sesión ha expirado o no tienes permisos suficientes.');
          
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        } else if (err.status === 0) {
          this.showAlert('error', 'Error de Conexión', 'No se puede conectar a http://localhost:8000');
        } else {
          this.showAlert('error', 'Error al cargar instrumentos', err.error?.detail || 'Intenta de nuevo');
        }
      }
    });

    console.log('📡 Cargando préstamos desde API...');
    // Cargar préstamos desde la base de datos
    this.prestamoService.getPrestamos().subscribe({
      next: (response: any) => {
        console.log('✅ Préstamos cargados:', response);
        this.loans = response.results || response || [];
      },
      error: (err) => {
        console.error('❌ Error cargando préstamos:', err);
        
        if (err.status === 403) {
          console.error('🔐 Préstamos: Sesión inválida o sin permisos');
        } else if (err.status === 0) {
          console.error('🔌 No se puede conectar al servidor');
        } else {
          this.showAlert('error', 'Error al cargar préstamos', err.error?.detail || 'Intenta de nuevo');
        }
      }
    });
  }

  private showAlert(type: string, title: string, message: string): void {
    const alertsPanel = document.getElementById('alertsPanel');
    if (!alertsPanel) return;
    
    const alertClass = type === 'error' ? 'alert-danger' : type === 'warning' ? 'alert-warning' : 'alert-info';
    const alertHTML = `
      <div class="alerts-panel">
        <div class="alerts-header">
          ${type === 'error' ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>' : ''}
          ${title}
        </div>
        <div class="alert-item ${alertClass}">
          <p>${message}</p>
        </div>
      </div>
    `;
    alertsPanel.innerHTML = alertHTML;
  }

  // ==================
  // DASHBOARD RENDERING
  // ==================

  renderDashboard(): void {
    this.renderStats();
    this.renderAlerts();
    this.renderInstruments();
    this.renderLoans();
  }

  renderStats(): void {
    const total = this.instruments.length;
    const disponibles = this.instruments.filter(i => i.estado === 'Disponible').length;
    const enUso = this.instruments.filter(i => i.estado === 'En Uso').length;
    const enReparacion = this.instruments.filter(i => i.estado === 'En Reparación').length;

    const stats = [
      { label: 'Total Instrumentos', value: total, color: 'blue', icon: 'package' },
      { label: 'Disponibles', value: disponibles, color: 'green', icon: 'check' },
      { label: 'En Uso', value: enUso, color: 'yellow', icon: 'alert' },
      { label: 'En Reparación', value: enReparacion, color: 'red', icon: 'wrench' }
    ];

    const icons: any = {
      package: '<path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>',
      check: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
      alert: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
      wrench: '<path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>'
    };

    const html = stats.map(stat => `
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-info">
            <p>${stat.label}</p>
            <p class="stat-value stat-${stat.color}">${stat.value}</p>
          </div>
          <div class="stat-icon bg-${stat.color}">
            <svg class="stat-${stat.color}" viewBox="0 0 24 24" fill="currentColor">
              ${icons[stat.icon]}
            </svg>
          </div>
        </div>
      </div>
    `).join('');

    const grid = document.getElementById('statsGrid');
    if (grid) grid.innerHTML = html;
  }

  renderAlerts(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeLoans = this.loans.filter((l: any) => l.estado === 'Activo');
    const alerts: any[] = [];

    activeLoans.forEach((loan: any) => {
      if (!loan.fechaDevolucionEstimada) return;
      
      const dueDate = new Date(loan.fechaDevolucionEstimada);
      dueDate.setHours(0, 0, 0, 0);
      
      const instrument = this.instruments.find(i => i.id === loan.instrumentoId);
      const instrumentName = instrument ? `${instrument.nombre} (${instrument.codigo})` : 'Instrumento';
      
      if (dueDate < today) {
        const days = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'danger',
          title: `Préstamo Vencido - ${days} días de retraso`,
          text: `${loan.estudianteNombre} - ${instrumentName}`,
          date: `Fecha límite: ${this.formatDate(loan.fechaDevolucionEstimada)}`
        });
      } else if (dueDate.getTime() === today.getTime()) {
        alerts.push({
          type: 'warning',
          title: 'Vence Hoy',
          text: `${loan.estudianteNombre} - ${instrumentName}`
        });
      } else {
        const threeDays = new Date(today);
        threeDays.setDate(today.getDate() + 3);
        if (dueDate <= threeDays) {
          alerts.push({
            type: 'info',
            title: 'Próximo a Vencer',
            text: `${loan.estudianteNombre} - ${instrumentName}`,
            date: `Fecha límite: ${this.formatDate(loan.fechaDevolucionEstimada)}`
          });
        }
      }
    });

    const panel = document.getElementById('alertsPanel');
    if (!panel) return;

    if (alerts.length === 0) {
      panel.innerHTML = '';
      return;
    }

    const alertIcon = '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>';
    const warningIcon = '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>';
    const clockIcon = '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>';

    panel.innerHTML = `
      <div class="alerts-panel">
        <div class="alerts-header">
          <svg viewBox="0 0 24 24">${alertIcon}</svg>
          <span>Alertas de Devolución (${alerts.length})</span>
        </div>
        ${alerts.map(alert => `
          <div class="alert-item alert-${alert.type}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              ${alert.type === 'danger' ? warningIcon : clockIcon}
            </svg>
            <div class="alert-content">
              <p>${alert.title}</p>
              <p>${alert.text}</p>
              ${alert.date ? `<p style="font-size: 0.75rem; margin-top: 0.25rem;">${alert.date}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderInstruments(): void {
    const grid = document.getElementById('instrumentsGrid');
    if (!grid) return;
    
    if (this.instruments.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 18V5l12-2v13M9 9l12-2"/>
          </svg>
          <h3>No hay instrumentos registrados</h3>
          <p>Comienza registrando tu primer instrumento</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.instruments.map((inst: any) => {
      const badgeClasses: { [key: string]: string } = {
        'Disponible': 'badge-available',
        'En Uso': 'badge-in-use',
        'En Reparación': 'badge-repair',
        'Fuera de Servicio': 'badge-out-of-service'
      };
      const badgeClass = badgeClasses[inst.estado] || 'badge-available';

      const conditionColors: any = {
        'Excelente': '#16A34A',
        'Buena': '#2563EB',
        'Regular': '#CA8A04',
        'Requiere Reparación': '#DC2626'
      };

      return `
        <div class="instrument-card">
          <div class="instrument-header">
            <div class="instrument-title">
              <div class="instrument-name">
                <h3>${inst.nombre}</h3>
                <span class="badge ${badgeClass}">${inst.estado}</span>
              </div>
              <p class="instrument-code">Código: ${inst.codigo}</p>
            </div>
            <div class="instrument-actions">
              <button class="btn-icon btn-edit" onclick="dashboard.editInstrument('${inst.id}')" title="Editar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button class="btn-icon btn-delete" onclick="dashboard.deleteInstrument('${inst.id}')" title="Eliminar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="instrument-details">
            <div class="detail-item">
              <p class="detail-label">Categoría</p>
              <p class="detail-value">${inst.categoria}</p>
            </div>
            <div class="detail-item">
              <p class="detail-label">Marca / Modelo</p>
              <p class="detail-value">${inst.marca} ${inst.modelo}</p>
            </div>
            <div class="detail-item">
              <p class="detail-label">No. Serie</p>
              <p class="detail-value">${inst.numeroSerie}</p>
            </div>
            <div class="detail-item">
              <p class="detail-label">Condición</p>
              <p class="detail-value" style="color: ${conditionColors[inst.condicion]}">${inst.condicion}</p>
            </div>
          </div>

          <div class="instrument-info">
            <div class="info-row">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>${inst.ubicacion}</span>
            </div>
            ${inst.responsable ? `
              <div class="info-row">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span>${inst.responsable}</span>
              </div>
            ` : ''}
          </div>

          ${inst.observaciones ? `
            <div class="instrument-observations">
              <p class="observations-label">Observaciones</p>
              <p class="observations-text">${inst.observaciones}</p>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  renderLoans(): void {
    const activeLoans = this.loans.filter((l: any) => l.estado === 'Activo');
    const container = document.getElementById('loansList');
    if (!container) return;

    if (activeLoans.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <h3>No hay préstamos activos</h3>
          <p>Todos los instrumentos han sido devueltos</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="loans-list">
        <div class="loans-header">Préstamos Activos (${activeLoans.length})</div>
        ${activeLoans.map((loan: any) => `
          <div class="loan-item">
            <div class="loan-details">
              <h4>${loan.instrumentoNombre} <span style="color: #6B7280; font-weight: normal;">(${loan.instrumentoCodigo})</span></h4>
              <p><strong>Estudiante:</strong> ${loan.estudianteNombre}</p>
              <p><strong>ID:</strong> ${loan.estudianteIdentificacion}</p>
              <p><strong>Fecha de Préstamo:</strong> ${this.formatDate(loan.fechaPrestamo)}</p>
              ${loan.fechaDevolucionEstimada ? `<p><strong>Devolución Estimada:</strong> ${this.formatDate(loan.fechaDevolucionEstimada)}</p>` : ''}
            </div>
            <button class="btn-return" onclick="dashboard.openReturnForm('${loan.id}')">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Devolver
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ==================
  // UI INTERACTIONS
  // ==================

  toggleDropdown(): void {
    const menu = document.getElementById('dropdownMenu');
    if (menu) menu.classList.toggle('active');
  }

  switchTab(tab: string): void {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    (event?.target as HTMLElement)?.classList.add('active');

    if (tab === 'instruments') {
      const instContent = document.getElementById('instrumentsContent');
      const loansContent = document.getElementById('loansContent');
      const searchSection = document.getElementById('instrumentsSearch');
      if (instContent) instContent.classList.remove('hidden');
      if (loansContent) loansContent.classList.add('hidden');
      if (searchSection) (searchSection as HTMLElement).style.display = 'block';
    } else {
      const instContent = document.getElementById('instrumentsContent');
      const loansContent = document.getElementById('loansContent');
      const searchSection = document.getElementById('instrumentsSearch');
      if (instContent) instContent.classList.add('hidden');
      if (loansContent) loansContent.classList.remove('hidden');
      if (searchSection) (searchSection as HTMLElement).style.display = 'none';
    }
  }

  toggleFilters(): void {
    const panel = document.getElementById('filtersPanel');
    const button = document.getElementById('filterToggle');
    
    if (panel && button) {
      if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        (button as HTMLElement).style.background = '#2563EB';
        (button as HTMLElement).style.color = 'white';
      } else {
        panel.classList.add('hidden');
        (button as HTMLElement).style.background = '';
        (button as HTMLElement).style.color = '';
      }
    }
  }

  filterInstruments(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    const filterCategoria = document.getElementById('filterCategoria') as HTMLSelectElement;
    const filterEstado = document.getElementById('filterEstado') as HTMLSelectElement;
    const filterCondicion = document.getElementById('filterCondicion') as HTMLSelectElement;
    
    const search = searchInput?.value.toLowerCase() || '';
    const categoria = filterCategoria?.value || '';
    const estado = filterEstado?.value || '';
    const condicion = filterCondicion?.value || '';

    const filtered = this.instruments.filter((inst: any) => {
      const matchesSearch = 
        inst.nombre.toLowerCase().includes(search) ||
        inst.codigo.toLowerCase().includes(search) ||
        inst.marca.toLowerCase().includes(search) ||
        inst.numeroSerie.toLowerCase().includes(search);
      
      return matchesSearch && (!categoria || inst.categoria === categoria) && 
             (!estado || inst.estado === estado) && (!condicion || inst.condicion === condicion);
    });
    
    const grid = document.getElementById('instrumentsGrid');
    const temp = this.instruments;
    this.instruments = filtered;
    this.renderInstruments();
    this.instruments = temp;
  }

  clearFilters(): void {
    const filterCategoria = document.getElementById('filterCategoria') as HTMLSelectElement;
    const filterEstado = document.getElementById('filterEstado') as HTMLSelectElement;
    const filterCondicion = document.getElementById('filterCondicion') as HTMLSelectElement;
    
    if (filterCategoria) filterCategoria.value = '';
    if (filterEstado) filterEstado.value = '';
    if (filterCondicion) filterCondicion.value = '';
    
    this.filterInstruments();
  }

  exportCSV(): void {
    const headers = ['Código', 'Nombre', 'Categoría', 'Marca', 'Modelo', 'No. Serie', 'Estado', 'Condición', 'Ubicación'];
    const rows = this.instruments.map((i: any) => [i.codigo, i.nombre, i.categoria, i.marca, i.modelo, i.numeroSerie, i.estado, i.condicion, i.ubicacion]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario-conservatorio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  openInstrumentForm(): void {
    // ✅ Validar permiso: solo administrador puede crear instrumentos
    if (this.currentUser?.rol !== 'administrador') {
      this.showAlert('error', 'Acceso Denegado', 'Solo administrador puede crear instrumentos');
      return;
    }

    this.editingInstrumentId = null;
    const title = document.getElementById('instrumentModalTitle');
    const modal = document.getElementById('instrumentModal');
    if (title) title.textContent = 'Registrar Nuevo Instrumento';
    if (modal) modal.classList.add('active');
  }

  editInstrument(id: string): void {
    this.editingInstrumentId = id;
    const idNum = parseInt(id);
    const inst = this.instruments.find(i => i.id === idNum || i.id === parseInt(i.id.toString()));
    if (!inst) return;
    const title = document.getElementById('instrumentModalTitle');
    if (title) title.textContent = 'Editar Instrumento';
    // Pre-populate form fields here if needed
    const modal = document.getElementById('instrumentModal');
    if (modal) modal.classList.add('active');
  }

  closeInstrumentForm(): void {
    const modal = document.getElementById('instrumentModal');
    if (modal) modal.classList.remove('active');
  }

  saveInstrument(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const instrument: any = {
      codigo: formData.get('codigo'),
      nombre: formData.get('nombre'),
      categoria: formData.get('categoria'),
      marca: formData.get('marca'),
      modelo: formData.get('modelo'),
      numeroSerie: formData.get('numeroSerie'),
      fechaAdquisicion: formData.get('fechaAdquisicion'),
      valorAdquisicion: parseInt(formData.get('valorAdquisicion') as string) || 0,
      estado: formData.get('estado'),
      condicion: formData.get('condicion'),
      ubicacion: formData.get('ubicacion'),
      observaciones: formData.get('observaciones') || ''
    };

    if (this.editingInstrumentId) {
      // Actualizar instrumento existente
      this.instrumentoService.actualizarInstrumento(parseInt(this.editingInstrumentId), instrument).subscribe({
        next: (response) => {
          this.showAlert('success', 'Éxito', 'Instrumento actualizado correctamente');
          this.loadData();
          this.closeInstrumentForm();
        },
        error: (err) => {
          console.error('Error actualizando instrumento:', err);
          this.showAlert('error', 'Error', 'No se pudo actualizar el instrumento');
        }
      });
    } else {
      // Crear nuevo instrumento
      this.instrumentoService.crearInstrumento(instrument).subscribe({
        next: (response) => {
          this.showAlert('success', 'Éxito', 'Instrumento registrado correctamente');
          this.loadData();
          this.closeInstrumentForm();
        },
        error: (err) => {
          console.error('Error creando instrumento:', err);
          this.showAlert('error', 'Error', 'No se pudo registrar el instrumento');
        }
      });
    }
  }

  deleteInstrument(id: string): void {
    if (confirm('¿Está seguro que desea eliminar este instrumento?')) {
      this.instrumentoService.eliminarInstrumento(parseInt(id)).subscribe({
        next: () => {
          this.showAlert('success', 'Éxito', 'Instrumento eliminado correctamente');
          this.loadData();
        },
        error: (err) => {
          console.error('Error eliminando instrumento:', err);
          this.showAlert('error', 'Error', 'No se pudo eliminar el instrumento');
        }
      });
    }
  }

  openLoanForm(): void {
    const select = document.getElementById('loanInstrumentSelect') as HTMLSelectElement;
    const available = this.instruments.filter(i => i.estado === 'Disponible');
    if (select) select.innerHTML = '<option>Seleccione instrumento</option>' + available.map(i => `<option value="${i.id}">${i.nombre} (${i.codigo})</option>`).join('');
    const modal = document.getElementById('loanModal');
    if (modal) modal.classList.add('active');
  }

  closeLoanForm(): void {
    const modal = document.getElementById('loanModal');
    if (modal) modal.classList.remove('active');
  }

  saveLoan(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const instrumentId = formData.get('instrumentoId') as string;

    const loan: any = {
      instrumento: parseInt(instrumentId),
      estudianteNombre: formData.get('estudianteNombre'),
      estudianteIdentificacion: formData.get('estudianteIdentificacion'),
      fechaPrestamo: formData.get('fechaPrestamo'),
      fechaDevolucionEstimada: formData.get('fechaDevolucionEstimada') || null,
      observaciones: formData.get('observaciones') || ''
    };

    this.prestamoService.crearPrestamo(loan).subscribe({
      next: (response) => {
        this.showAlert('success', 'Éxito', 'Préstamo registrado correctamente');
        this.loadData();
        this.closeLoanForm();
      },
      error: (err) => {
        console.error('Error creando préstamo:', err);
        this.showAlert('error', 'Error', 'No se pudo registrar el préstamo');
      }
    });
  }

  openReturnForm(loanId: string): void {
    const loan = this.loans.find(l => l.id === loanId || l.id === parseInt(loanId));
    if (!loan) return;
    this.returningLoan = loan;
    const returnInfo = document.getElementById('returnLoanInfo');
    if (returnInfo) {
      returnInfo.innerHTML = `
        <h3>Préstamo Activo</h3>
        <p><strong>Instrumento:</strong> ${loan.instrumento_nombre || loan.instrumentoNombre}</p>
        <p><strong>Estudiante:</strong> ${loan.estudianteNombre}</p>
      `;
    }
    const modal = document.getElementById('returnModal');
    if (modal) modal.classList.add('active');
  }

  closeReturnForm(): void {
    const modal = document.getElementById('returnModal');
    if (modal) modal.classList.remove('active');
    this.returningLoan = null;
  }

  saveReturn(event: Event): void {
    event.preventDefault();
    if (!this.returningLoan) return;
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const loanId = this.returningLoan.id || this.returningLoan.pk;

    this.prestamoService.devolverPrestamo(parseInt(loanId as string)).subscribe({
      next: (response) => {
        this.showAlert('success', 'Éxito', 'Préstamo devuelto correctamente');
        this.loadData();
        this.closeReturnForm();
      },
      error: (err) => {
        console.error('Error devolviendo préstamo:', err);
        this.showAlert('error', 'Error', 'No se pudo procesar la devolución');
      }
    });
  }

  openReports(): void {
    const total = this.instruments.length;
    const reportsContent = document.getElementById('reportsContent');
    if (reportsContent) {
      reportsContent.innerHTML = `<p>Reportes - Total: ${total} instrumentos</p>`;
    }
    const modal = document.getElementById('reportsModal');
    if (modal) modal.classList.add('active');
  }

  closeReports(): void {
    const modal = document.getElementById('reportsModal');
    if (modal) modal.classList.remove('active');
  }

  exportReportJSON(): void {
    const report = {
      fecha: new Date().toISOString(),
      total_instrumentos: this.instruments.length,
      prestamos_activos: this.loans.filter(l => l.estado === 'Activo').length
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CO');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
