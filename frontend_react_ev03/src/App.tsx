import { FormEvent, useEffect, useMemo, useState } from 'react';
import { authApi, inventarioApi } from './api';
import type {
  Categoria,
  HistorialMovimiento,
  Instrumento,
  Prestamo,
  SessionUser,
  UsuarioPrestamo,
} from './types';

type TabView = 'instrumentos' | 'prestamos' | 'historial';

type AlertItem = {
  type: 'danger' | 'warning' | 'info';
  title: string;
  text: string;
  date?: string;
};

type MessageState = {
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  text: string;
};

type InstrumentFormState = {
  codigo: string;
  nombre: string;
  categoria: string;
  marca: string;
  modelo: string;
  fechaAdquisicion: string;
  cantidad: string;
};

type LoanFormState = {
  instrumentoId: string;
  estudianteNombre: string;
  estudianteIdentificacion: string;
  fechaPrestamo: string;
  fechaDevolucionEstimada: string;
  observaciones: string;
};

// Valores iniciales del formulario para registrar o editar un instrumento.
const EMPTY_INSTRUMENT_FORM: InstrumentFormState = {
  codigo: '',
  nombre: '',
  categoria: '',
  marca: '',
  modelo: '',
  fechaAdquisicion: '',
  cantidad: '1',
};

// Valores iniciales del formulario para registrar un prestamo.
const EMPTY_LOAN_FORM: LoanFormState = {
  instrumentoId: '',
  estudianteNombre: '',
  estudianteIdentificacion: '',
  fechaPrestamo: '',
  fechaDevolucionEstimada: '',
  observaciones: '',
};

// Devuelve la fecha actual en formato compatible con inputs tipo date.
function todayAsInputDate() {
  return new Date().toISOString().slice(0, 10);
}

// Normaliza cualquier valor de texto para comparaciones de filtro.
function toLower(value: string | null | undefined) {
  return (value ?? '').toString().toLowerCase();
}

// Formatea fechas para mostrar en la interfaz.
function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('es-CO');
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleString('es-CO');
  } catch {
    return dateStr;
  }
}

function getEstadoLabel(estado: string) {
  const map: Record<string, string> = {
    disponible: 'Disponible',
    prestado: 'En uso',
    mantenimiento: 'En reparacion',
    baja: 'Fuera de servicio',
    enuso: 'En uso',
    reparacion: 'Reparacion',
  };

  return map[estado] ?? estado;
}

// Devuelve la clase CSS del badge según el estado del instrumento.
function getBadgeClass(estado: string) {
  const map: Record<string, string> = {
    disponible: 'badge badge-available',
    prestado: 'badge badge-in-use',
    mantenimiento: 'badge badge-repair',
    baja: 'badge badge-out-of-service',
  };

  return map[estado] ?? 'badge badge-available';
}

// Logotipo SVG reutilizable para la cabecera y el login.
function BrandMark({ variant }: { variant: 'login' | 'header' }) {
  return (
    <svg
      className={`brand-mark brand-mark--${variant}`}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Logo del Sistema de Inventario"
    >
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#2563eb" />
      <path
        d="M32 11v30.5c0 4.6-3.7 8.3-8.3 8.3S15.4 46.1 15.4 41.5s3.7-8.3 8.3-8.3c2 0 3.8.6 5.2 1.7V18.2l21 12.1"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <circle cx="23.4" cy="41.6" r="8.2" fill="none" stroke="#1d4ed8" strokeWidth="3.2" />
      <path d="M32 11l21 12.1" fill="none" stroke="#1d4ed8" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

// Componente principal del frontend React del sistema de inventario.
export function App() {
  // Estado de sesión y carga inicial.
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabView>('instrumentos');
  const [globalMessage, setGlobalMessage] = useState<MessageState | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Colecciones sincronizadas desde Django.
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [usuariosPrestamo, setUsuariosPrestamo] = useState<UsuarioPrestamo[]>([]);

  // Estado del formulario y errores del login.
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginSubmitted, setLoginSubmitted] = useState(false);

  // Filtros de búsqueda del inventario.
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCondicion, setFilterCondicion] = useState('');

  // Menú y modales de acciones rápidas.
  const [showRegisterMenu, setShowRegisterMenu] = useState(false);

  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showBajaModal, setShowBajaModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Formulario para crear o editar instrumentos.
  const [instrumentForm, setInstrumentForm] = useState<InstrumentFormState>(EMPTY_INSTRUMENT_FORM);
  const [editingInstrumentId, setEditingInstrumentId] = useState<number | null>(null);

  // Formulario para registrar préstamos.
  const [loanForm, setLoanForm] = useState<LoanFormState>(EMPTY_LOAN_FORM);
  const [loanModalError, setLoanModalError] = useState('');

  // Datos para devolución y baja.
  const [returningLoan, setReturningLoan] = useState<Prestamo | null>(null);
  const [returnObservaciones, setReturnObservaciones] = useState('');

  const [instrumentoParaBaja, setInstrumentoParaBaja] = useState<Instrumento | null>(null);
  const [bajaObservacion, setBajaObservacion] = useState('');

  // Estado del historial de movimientos del instrumento.
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialMovimientos, setHistorialMovimientos] = useState<HistorialMovimiento[]>([]);
  const [historialInstrumentoNombre, setHistorialInstrumentoNombre] = useState('');

  // Arranca la sesión y luego sincroniza los datos del dashboard.
  useEffect(() => {
    void boot();
  }, []);

  useEffect(() => {
    if (sessionUser) {
      void cargarDatos();
    }
  }, [sessionUser]);

  async function boot() {
    try {
      setIsBootLoading(true);
      setGlobalMessage(null);
      await authApi.getCsrfToken();

      try {
        const user = await authApi.currentUser();
        setSessionUser(user);
      } catch {
        setSessionUser(null);
      }
    } catch (error) {
      setGlobalMessage({
        type: 'error',
        title: 'Error de inicio',
        text: (error as Error).message,
      });
    } finally {
      setIsBootLoading(false);
    }
  }

  // Carga categorías, instrumentos, préstamos y usuarios desde Django.
  async function cargarDatos() {
    try {
      setLoadingData(true);
      setGlobalMessage(null);

      const [dataCategorias, dataInstrumentos, dataPrestamos, dataUsuarios] = await Promise.all([
        inventarioApi.listarCategorias().catch(() => []),
        inventarioApi.listarInstrumentos(),
        inventarioApi.listarPrestamos(),
        inventarioApi.listarUsuariosPrestamo().catch(() => []),
      ]);

      setCategorias(dataCategorias);
      setInstrumentos(dataInstrumentos);
      setPrestamos(dataPrestamos);
      setUsuariosPrestamo(dataUsuarios);
    } catch (error) {
      setGlobalMessage({
        type: 'error',
        title: 'Error cargando datos',
        text: (error as Error).message,
      });
    } finally {
      setLoadingData(false);
    }
  }

  // Valida el formulario de login antes de enviar la petición.
  function validateLoginForm() {
    let valid = true;
    const trimmedUser = username.trim();

    setUsernameError('');
    setPasswordError('');

    if (!trimmedUser) {
      setUsernameError('Usuario requerido');
      valid = false;
    } else if (trimmedUser.length < 3) {
      setUsernameError('Minimo 3 caracteres');
      valid = false;
    }

    if (!password) {
      setPasswordError('Contrasena requerida');
      valid = false;
    }

    return valid;
  }

  // Autentica al usuario y abre el dashboard.
  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (loginLoading) return;

    setLoginSubmitted(true);
    setLoginError('');
    setLoginSuccess('');

    if (!validateLoginForm()) {
      return;
    }

    try {
      setLoginLoading(true);
      await authApi.getCsrfToken();
      const user = await authApi.login(username, password);
      setLoginSuccess('Autenticacion exitosa. Redirigiendo al dashboard...');
      setSessionUser(user);
    } catch (error) {
      const message = (error as Error).message;
      setLoginError(message || 'Usuario o contrasena incorrecta');
    } finally {
      setLoginLoading(false);
    }
  }

  // Cierra sesión y limpia el estado local.
  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // Limpieza local incluso si falla el logout remoto.
    } finally {
      setSessionUser(null);
      setInstrumentos([]);
      setPrestamos([]);
      setCategorias([]);
      setUsuariosPrestamo([]);
      setGlobalMessage(null);
      setLoginError('');
      setLoginSuccess('');
      setUsername('');
      setPassword('');
    }
  }

  // Verifica si el usuario actual tiene rol de administrador.
  function isAdmin() {
    return toLower(sessionUser?.rol) === 'administrador';
  }

  // Verifica si el usuario actual tiene rol de almacenista.
  function isStorekeeper() {
    return toLower(sessionUser?.rol) === 'almacenista';
  }

  // Crea o actualiza un instrumento desde el modal.
  async function guardarInstrumento(event: FormEvent) {
    event.preventDefault();

    if (!isAdmin() && editingInstrumentId === null) {
      setGlobalMessage({
        type: 'error',
        title: 'Acceso denegado',
        text: 'Solo administrador puede crear instrumentos.',
      });
      return;
    }

    const payload: Partial<Instrumento> & { fecha_adquisicion?: string | null } = {
      referencia: instrumentForm.codigo.trim().toUpperCase(),
      nombre: instrumentForm.nombre.trim(),
      categoria: Number(instrumentForm.categoria),
      marca: instrumentForm.marca.trim() || null,
      modelo: instrumentForm.modelo.trim() || null,
      fecha_adquisicion: instrumentForm.fechaAdquisicion || null,
      cantidad: Number(instrumentForm.cantidad || '1'),
    };

    if (!payload.referencia || !payload.nombre || !payload.categoria) {
      setGlobalMessage({
        type: 'error',
        title: 'Campos obligatorios',
        text: 'Codigo, nombre y categoria son obligatorios.',
      });
      return;
    }

    try {
      setActionLoading(true);
      setGlobalMessage(null);

      if (editingInstrumentId) {
        await inventarioApi.actualizarInstrumento(editingInstrumentId, payload);
        setGlobalMessage({
          type: 'success',
          title: 'Exito',
          text: 'Instrumento actualizado correctamente.',
        });
      } else {
        await inventarioApi.crearInstrumento(payload);
        setGlobalMessage({
          type: 'success',
          title: 'Exito',
          text: 'Instrumento registrado correctamente.',
        });
      }

      setShowInstrumentModal(false);
      setEditingInstrumentId(null);
      setInstrumentForm(EMPTY_INSTRUMENT_FORM);
      await cargarDatos();
    } catch (error) {
      setGlobalMessage({
        type: 'error',
        title: 'Error',
        text: (error as Error).message,
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Abre el modal de instrumento nuevo.
  function openInstrumentForm() {
    if (!isAdmin()) {
      setGlobalMessage({
        type: 'error',
        title: 'Acceso denegado',
        text: 'Solo administrador puede crear instrumentos.',
      });
      return;
    }

    setEditingInstrumentId(null);
    setInstrumentForm(EMPTY_INSTRUMENT_FORM);
    setShowInstrumentModal(true);
    setShowRegisterMenu(false);
  }

  // Carga los datos de un instrumento en el formulario de edición.
  function editInstrument(inst: Instrumento) {
    setEditingInstrumentId(inst.id);
    setInstrumentForm({
      codigo: inst.referencia || inst.codigo || '',
      nombre: inst.nombre || '',
      categoria: String(inst.categoria || ''),
      marca: inst.marca || '',
      modelo: inst.modelo || '',
      fechaAdquisicion: inst.fecha_adquisicion || '',
      cantidad: String(inst.cantidad || 1),
    });
    setShowInstrumentModal(true);
  }

  // Elimina un instrumento con confirmación previa.
  async function deleteInstrument(inst: Instrumento) {
    if (!window.confirm('Esta seguro que desea eliminar este instrumento?')) {
      return;
    }

    try {
      setActionLoading(true);
      await inventarioApi.eliminarInstrumento(inst.id);
      setGlobalMessage({
        type: 'success',
        title: 'Exito',
        text: 'Instrumento eliminado correctamente.',
      });
      await cargarDatos();
    } catch (error) {
      setGlobalMessage({
        type: 'error',
        title: 'Error',
        text: (error as Error).message,
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Abre el modal para dar de baja un instrumento.
  function openDarBajaModal(inst: Instrumento) {
    if (!isAdmin()) {
      setGlobalMessage({
        type: 'error',
        title: 'Acceso denegado',
        text: 'Solo administrador puede dar de baja instrumentos.',
      });
      return;
    }

    setInstrumentoParaBaja(inst);
    setBajaObservacion('');
    setShowBajaModal(true);
  }

  // Envía la baja del instrumento al backend.
  async function submitDarBaja(event: FormEvent) {
    event.preventDefault();
    if (!instrumentoParaBaja) return;

    try {
      setActionLoading(true);
      await inventarioApi.darDeBajaInstrumento(
        instrumentoParaBaja.id,
        bajaObservacion.trim() || 'Instrumento dado de baja por administrador',
      );
      setShowBajaModal(false);
      setInstrumentoParaBaja(null);
      setGlobalMessage({
        type: 'success',
        title: 'Exito',
        text: 'Instrumento dado de baja correctamente.',
      });
      await cargarDatos();
    } catch (error) {
      setGlobalMessage({
        type: 'error',
        title: 'Error',
        text: (error as Error).message,
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Abre el modal para registrar un préstamo.
  function openLoanForm() {
    setLoanModalError('');
    setLoanForm({ ...EMPTY_LOAN_FORM, fechaPrestamo: todayAsInputDate() });
    setShowLoanModal(true);
    setShowRegisterMenu(false);
  }

  // Registra un préstamo y crea el usuario de préstamo si no existe.
  async function guardarPrestamo(event: FormEvent) {
    event.preventDefault();

    if (!loanForm.instrumentoId || !loanForm.estudianteNombre || !loanForm.estudianteIdentificacion || !loanForm.fechaPrestamo) {
      setLoanModalError('Completa los campos obligatorios para registrar el prestamo.');
      return;
    }

    try {
      setActionLoading(true);
      setLoanModalError('');

      const documento = loanForm.estudianteIdentificacion.trim();

      const existing = usuariosPrestamo.find((u) => String(u.documento) === documento);
      let usuario = existing;

      if (!usuario) {
        const candidates = await inventarioApi.buscarUsuariosPrestamo(documento).catch(() => []);
        usuario = candidates.find((u) => String(u.documento) === documento);
      }

      if (!usuario) {
        usuario = await inventarioApi.crearUsuarioPrestamo({
          nombre: loanForm.estudianteNombre.trim(),
          documento,
          tipo: 'estudiante',
          correo: null,
          telefono: null,
        });
      }

      await inventarioApi.crearPrestamo({
        instrumento: Number(loanForm.instrumentoId),
        usuario: usuario.id,
        fecha_prestamo: loanForm.fechaPrestamo,
        fecha_vencimiento: loanForm.fechaDevolucionEstimada || null,
        estado: 'enuso',
        observaciones: loanForm.observaciones.trim() || null,
      } as Partial<Prestamo> & { fecha_prestamo: string; fecha_vencimiento: string | null });

      setShowLoanModal(false);
      setLoanForm(EMPTY_LOAN_FORM);
      setGlobalMessage({
        type: 'success',
        title: 'Exito',
        text: 'Prestamo registrado correctamente.',
      });
      await cargarDatos();
    } catch (error) {
      setLoanModalError((error as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  // Abre el modal de devolución para un préstamo activo.
  function openReturnForm(loan: Prestamo) {
    setReturningLoan(loan);
    setReturnObservaciones('');
    setShowReturnModal(true);
  }

  // Marca un préstamo como devuelto y actualiza el instrumento.
  async function handleDevolverPrestamo(prestamoId: number) {
    try {
      setActionLoading(true);
      setGlobalMessage(null);
      await inventarioApi.devolverPrestamo(prestamoId, returnObservaciones.trim() || undefined);
      setShowReturnModal(false);
      setReturningLoan(null);
      setReturnObservaciones('');
      setGlobalMessage({
        type: 'success',
        title: 'Exito',
        text: 'Prestamo devuelto correctamente.',
      });
      await cargarDatos();
    } catch (error) {
      setGlobalMessage({
        type: 'error',
        title: 'Error',
        text: (error as Error).message,
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Abre el historial de movimientos del instrumento seleccionado.
  async function openHistoryModal(inst: Instrumento) {
    if (!isAdmin()) {
      setGlobalMessage({
        type: 'error',
        title: 'Acceso denegado',
        text: 'Solo administrador puede ver historial.',
      });
      return;
    }

    setShowHistoryModal(true);
    setHistorialLoading(true);
    setHistorialMovimientos([]);
    setHistorialInstrumentoNombre(inst.nombre);

    try {
      const data = await inventarioApi.obtenerHistorialInstrumento(inst.id);
      setHistorialMovimientos(data);
    } catch (error) {
      setGlobalMessage({
        type: 'error',
        title: 'Error',
        text: (error as Error).message,
      });
    } finally {
      setHistorialLoading(false);
    }
  }

  // Calcula las tarjetas resumen del dashboard.
  const stats = useMemo(() => {
    const total = instrumentos.length;
    const disponibles = instrumentos.filter((i) => i.estado === 'disponible').length;
    const enUso = instrumentos.filter((i) => i.estado === 'prestado').length;
    const enReparacion = instrumentos.filter((i) => i.estado === 'mantenimiento').length;

    return [
      { label: 'Total Instrumentos', value: total, color: 'blue' },
      { label: 'Disponibles', value: disponibles, color: 'green' },
      { label: 'En Uso', value: enUso, color: 'yellow' },
      { label: 'En Reparacion', value: enReparacion, color: 'red' },
    ];
  }, [instrumentos]);

  // Filtra únicamente los préstamos activos.
  const activeLoans = useMemo(() => prestamos.filter((p) => p.estado === 'enuso'), [prestamos]);

  // Construye alertas de vencimiento a partir de los préstamos activos.
  const alerts = useMemo<AlertItem[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items: AlertItem[] = [];

    activeLoans.forEach((loan) => {
      if (!loan.fecha_vencimiento) return;

      const dueDate = new Date(loan.fecha_vencimiento);
      dueDate.setHours(0, 0, 0, 0);

      const instrumentName = loan.instrumento_nombre || 'Instrumento';
      const userName = loan.usuario_nombre || 'Usuario';

      if (dueDate < today) {
        const days = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        items.push({
          type: 'danger',
          title: `Prestamo vencido - ${days} dias de retraso`,
          text: `${userName} - ${instrumentName}`,
          date: `Fecha limite: ${formatDate(loan.fecha_vencimiento)}`,
        });
      } else if (dueDate.getTime() === today.getTime()) {
        items.push({
          type: 'warning',
          title: 'Vence hoy',
          text: `${userName} - ${instrumentName}`,
        });
      } else {
        const threeDays = new Date(today);
        threeDays.setDate(today.getDate() + 3);
        if (dueDate <= threeDays) {
          items.push({
            type: 'info',
            title: 'Proximo a vencer',
            text: `${userName} - ${instrumentName}`,
            date: `Fecha limite: ${formatDate(loan.fecha_vencimiento)}`,
          });
        }
      }
    });

    return items;
  }, [activeLoans]);

  // Aplica búsqueda y filtros al listado de instrumentos.
  const instrumentsFiltered = useMemo(() => {
    return instrumentos.filter((inst) => {
      const searchLower = search.toLowerCase();
      const referencia = toLower(inst.referencia || inst.codigo);
      const numeroSerie = toLower(inst.numero_serie || inst.numeroSerie);
      const marca = toLower(inst.marca);
      const nombre = toLower(inst.nombre);
      const categoriaNombre = (inst.categoria_nombre || '').toString();

      const matchesSearch =
        !searchLower ||
        nombre.includes(searchLower) ||
        referencia.includes(searchLower) ||
        marca.includes(searchLower) ||
        numeroSerie.includes(searchLower);

      const matchesCategoria = !filterCategoria || categoriaNombre === filterCategoria;
      const matchesEstado = !filterEstado || inst.estado === filterEstado;
      const matchesCondicion = !filterCondicion || (inst.condicion || '') === filterCondicion;

      return matchesSearch && matchesCategoria && matchesEstado && matchesCondicion;
    });
  }, [instrumentos, search, filterCategoria, filterEstado, filterCondicion]);

  // Ordena el historial por fecha más reciente.
  const sortedLoanHistory = useMemo(() => {
    return [...prestamos].sort((a, b) => {
      const aDate = new Date(a.fecha_devolucion || a.fecha_prestamo || 0).getTime();
      const bDate = new Date(b.fecha_devolucion || b.fecha_prestamo || 0).getTime();
      return bDate - aDate;
    });
  }, [prestamos]);

  // Lista de instrumentos disponibles para prestar.
  const availableLoanInstruments = useMemo(
    () => instrumentos.filter((item) => item.estado === 'disponible'),
    [instrumentos],
  );

  // Saca las categorías únicas para el filtro del buscador.
  const filterCategoryOptions = useMemo(() => {
    const names = new Set<string>();

    categorias.forEach((cat) => {
      if (cat.nombre) names.add(cat.nombre);
    });

    instrumentos.forEach((inst) => {
      if (inst.categoria_nombre) names.add(inst.categoria_nombre);
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [categorias, instrumentos]);

  // Exporta el inventario en CSV.
  function exportCSV() {
    const headers = ['Codigo', 'Nombre', 'Categoria', 'Marca', 'Modelo', 'No. Serie', 'Estado', 'Condicion', 'Ubicacion'];

    const rows = instrumentos.map((i) => [
      i.referencia || i.codigo || '',
      i.nombre || '',
      i.categoria_nombre || String(i.categoria || ''),
      i.marca || '',
      i.modelo || '',
      i.numero_serie || i.numeroSerie || '',
      getEstadoLabel(i.estado),
      i.condicion || '',
      i.ubicacion_fisica || i.ubicacion || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).split('"').join('""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario-conservatorio-${todayAsInputDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Exporta un resumen simple del inventario en JSON.
  function exportReportJSON() {
    const report = {
      fecha: new Date().toISOString(),
      total_instrumentos: instrumentos.length,
      prestamos_activos: activeLoans.length,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${todayAsInputDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Pantalla de carga inicial antes de resolver la sesión.
  if (isBootLoading) {
    return <div className="center-box">Cargando modulo React EV03...</div>;
  }

  // Vista pública de acceso cuando no hay sesión activa.
  if (!sessionUser) {
    return (
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <BrandMark variant="login" />
          </div>
          <h1 className="login-title">Sistema de Inventario</h1>
          <p className="login-subtitle">Conservatorio del Huila</p>
        </div>

        <div className="login-box">
          <div className="login-form-container">
            <h2 className="login-form-title">Iniciar Sesion</h2>

            {loginError ? (
              <div className="alert alert-error">
                <div className="alert-content">
                  <span>{loginError}</span>
                </div>
              </div>
            ) : null}

            {loginSuccess ? (
              <div className="alert alert-success">
                <div className="alert-content">
                  <span>{loginSuccess}</span>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="username">Usuario</label>
                <div className={`input-wrapper ${loginSubmitted && usernameError ? 'has-error' : ''}`}>
                  <input
                    id="username"
                    type="text"
                    className={`form-input ${loginSubmitted && usernameError ? 'input-error' : ''}`}
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loginLoading}
                    autoComplete="username"
                  />
                </div>
                {loginSubmitted && usernameError ? <span className="field-error">{usernameError}</span> : null}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Contrasena</label>
                <div className={`input-wrapper ${loginSubmitted && passwordError ? 'has-error' : ''}`}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${loginSubmitted && passwordError ? 'input-error' : ''}`}
                    placeholder="Ingresa tu contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={loginLoading}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {loginSubmitted && passwordError ? <span className="field-error">{passwordError}</span> : null}
              </div>

              <button type="submit" className="btn-primary" disabled={loginLoading}>
                {!loginLoading ? (
                  <span className="btn-text">Ingresar al Sistema</span>
                ) : (
                  <span className="btn-loading">
                    <span className="spinner" />
                    Autenticando...
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard principal del inventario una vez autenticado.
  return (
    <div className="dashboard">
      {/* Cabecera con marca, usuario y acciones rápidas. */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <BrandMark variant="header" />
            </div>
            <div className="header-title">
              <h1>Sistema de Inventario</h1>
              <p>Conservatorio del Huila</p>
            </div>
          </div>

          <div className="header-right">
            <div className="user-info">
              <div className="user-details">
                <p>{sessionUser.username}</p>
                <p>{sessionUser.rol}</p>
              </div>
            </div>

            <button className="btn btn-outline-secondary" onClick={handleLogout}>
              <span className="hide-mobile">Salir</span>
            </button>

            <button className="btn btn-outline-secondary" onClick={() => setShowReportsModal(true)}>
              <span className="hide-mobile">Reportes</span>
            </button>

            <div className="dropdown">
              <button className="dropdown-button btn btn-primary" onClick={() => setShowRegisterMenu((s) => !s)}>
                <span className="hide-mobile">Registrar</span>
              </button>

              {showRegisterMenu ? (
                <div className="dropdown-menu active">
                  {isAdmin() ? (
                    <div className="dropdown-item" onClick={openInstrumentForm}>
                      <div className="dropdown-icon blue" />
                      <div className="dropdown-text">
                        <h4>Instrumento Nuevo</h4>
                        <p>Registrar instrumento al inventario</p>
                      </div>
                    </div>
                  ) : (
                    <div className="dropdown-item disabled">
                      <div className="dropdown-icon blue" />
                      <div className="dropdown-text">
                        <h4>Instrumento Nuevo</h4>
                        <p>Solo disponible para administrador</p>
                      </div>
                    </div>
                  )}

                  <div className="dropdown-item" onClick={openLoanForm}>
                    <div className="dropdown-icon green" />
                    <div className="dropdown-text">
                      <h4>Prestamo</h4>
                      <p>Prestar instrumento a estudiante</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Mensaje global de estado o error de acciones. */}
        {globalMessage ? (
          <div className="alerts-panel">
            <div className="alerts-header">{globalMessage.title}</div>
            <div className="alert-item alert-info">
              <div className="alert-content">
                <p>{globalMessage.text}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Indicador de sincronización cuando se cargan datos o se ejecuta una acción. */}
        {loadingData || actionLoading ? <div className="sync-box">Sincronizando datos...</div> : null}

        {/* Alertas de préstamos próximos a vencer o vencidos. */}
        {alerts.length ? (
          <div className="alerts-panel">
            <div className="alerts-header">Alertas de devolucion ({alerts.length})</div>
            {alerts.map((alert, index) => (
              <div key={`${alert.title}-${index}`} className={`alert-item alert-${alert.type}`}>
                <div className="alert-content">
                  <p>{alert.title}</p>
                  <p>{alert.text}</p>
                  {alert.date ? <p className="alert-date">{alert.date}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Resumen visual de instrumentos por estado. */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p>{stat.label}</p>
                  <p className={`stat-value stat-${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`stat-icon bg-${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Navegación interna entre instrumentos, préstamos e historial. */}
        <div className="search-section">
          <div className="tabs">
            <button className={`tab ${activeTab === 'instrumentos' ? 'active' : ''}`} onClick={() => setActiveTab('instrumentos')}>
              Instrumentos
            </button>
            <button className={`tab ${activeTab === 'prestamos' ? 'active' : ''}`} onClick={() => setActiveTab('prestamos')}>
              Prestamos Activos
            </button>
            {isAdmin() ? (
              <button className={`tab ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
                Historial
              </button>
            ) : null}
          </div>

          {activeTab === 'instrumentos' ? (
            <div>
              <div className="search-bar">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar por nombre, codigo, marca o numero de serie..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="search-actions">
                  <button className="btn btn-outline-secondary" onClick={() => setShowFilters((s) => !s)}>
                    Filtros
                  </button>
                  <button className="btn btn-outline-secondary" onClick={exportCSV}>
                    Exportar
                  </button>
                </div>
              </div>

              {showFilters ? (
                <div className="filters-panel">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Categoria</label>
                      <select className="form-input" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
                        <option value="">Todas las categorias</option>
                        {filterCategoryOptions.map((catName) => (
                          <option key={catName} value={catName}>{catName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estado</label>
                      <select className="form-input" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                        <option value="">Todos los estados</option>
                        <option value="disponible">Disponible</option>
                        <option value="prestado">En uso</option>
                        <option value="mantenimiento">En reparacion</option>
                        <option value="baja">Fuera de servicio</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Condicion</label>
                      <select className="form-input" value={filterCondicion} onChange={(e) => setFilterCondicion(e.target.value)}>
                        <option value="">Todas las condiciones</option>
                        <option value="Excelente">Excelente</option>
                        <option value="Buena">Buena</option>
                        <option value="Regular">Regular</option>
                        <option value="Requiere Reparacion">Requiere Reparacion</option>
                      </select>
                    </div>
                  </div>
                  <div className="filters-actions">
                    <button
                      className="btn-cancel"
                      onClick={() => {
                        setFilterCategoria('');
                        setFilterEstado('');
                        setFilterCondicion('');
                      }}
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Listado principal de instrumentos con acciones por rol. */}
        {activeTab === 'instrumentos' ? (
          <div className="instruments-grid">
            {instrumentsFiltered.length === 0 ? (
              <div className="empty-state">
                <h3>No hay instrumentos registrados</h3>
                <p>Comienza registrando tu primer instrumento.</p>
              </div>
            ) : (
              instrumentsFiltered.map((inst) => {
                const referencia = inst.referencia || inst.codigo || 'N/A';
                const numeroSerie = inst.numero_serie || inst.numeroSerie || 'N/A';
                const categoria = inst.categoria_nombre || 'Sin categoria';
                const ubicacion = inst.ubicacion_fisica || inst.ubicacion || 'Sin ubicacion';

                return (
                  <div key={inst.id} className="instrument-card">
                    <div className="instrument-header">
                      <div className="instrument-title">
                        <div className="instrument-name">
                          <h3>{inst.nombre}</h3>
                          <span className={getBadgeClass(inst.estado)}>{getEstadoLabel(inst.estado)}</span>
                        </div>
                        <p className="instrument-code">Codigo: {referencia}</p>
                      </div>

                      <div className="instrument-actions">
                        {isAdmin() ? (
                          <button className="btn-icon btn-history" onClick={() => void openHistoryModal(inst)} title="Ver historial">
                            Historial
                          </button>
                        ) : null}

                        {isAdmin() && inst.estado !== 'baja' && inst.estado !== 'prestado' ? (
                          <button className="btn-icon btn-out" onClick={() => openDarBajaModal(inst)} title="Dar de baja">
                            Baja
                          </button>
                        ) : null}

                        <button className="btn-icon btn-edit" onClick={() => editInstrument(inst)} title="Editar">
                          Editar
                        </button>

                        <button className="btn-icon btn-delete" onClick={() => void deleteInstrument(inst)} title="Eliminar">
                          Eliminar
                        </button>
                      </div>
                    </div>

                    <div className="instrument-details">
                      <div className="detail-item">
                        <p className="detail-label">Categoria</p>
                        <p className="detail-value">{categoria}</p>
                      </div>
                      <div className="detail-item">
                        <p className="detail-label">Marca / Modelo</p>
                        <p className="detail-value">{inst.marca || ''} {inst.modelo || ''}</p>
                      </div>
                      <div className="detail-item">
                        <p className="detail-label">No. Serie</p>
                        <p className="detail-value">{numeroSerie}</p>
                      </div>
                      <div className="detail-item">
                        <p className="detail-label">Condicion</p>
                        <p className="detail-value">{inst.condicion || 'Sin dato'}</p>
                      </div>
                    </div>

                    <div className="instrument-info">
                      <div className="info-row"><span>{ubicacion}</span></div>
                      {inst.responsable ? <div className="info-row"><span>{inst.responsable}</span></div> : null}
                    </div>

                    {inst.observaciones ? (
                      <div className="instrument-observations">
                        <p className="observations-label">Observaciones</p>
                        <p className="observations-text">{inst.observaciones}</p>
                      </div>
                    ) : null}

                    {(isAdmin() || isStorekeeper()) && inst.estado === 'prestado' ? (
                      <div className="instrument-loan-action">
                        <button
                          className="btn-return"
                          onClick={() => {
                            const loan = activeLoans.find((l) => Number(l.instrumento) === inst.id);
                            if (loan) openReturnForm(loan);
                          }}
                        >
                          Registrar devolucion
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        ) : null}

        {/* Listado de préstamos activos con opción de devolución. */}
        {activeTab === 'prestamos' ? (
          <div className="loans-list">
            <div className="loans-header">Prestamos Activos ({activeLoans.length})</div>
            {activeLoans.length === 0 ? (
              <div className="empty-state">
                <h3>No hay prestamos activos</h3>
                <p>Todos los instrumentos han sido devueltos.</p>
              </div>
            ) : (
              activeLoans.map((loan) => (
                <div key={loan.id} className="loan-item">
                  <div className="loan-details">
                    <h4>
                      {loan.instrumento_nombre || 'Instrumento'}
                      <span className="muted-inline"> ({loan.instrumento_referencia || 'N/A'})</span>
                    </h4>
                    <p><strong>Usuario:</strong> {loan.usuario_nombre || 'N/A'}</p>
                    <p><strong>Documento:</strong> {loan.usuario_documento || 'N/A'}</p>
                    <p><strong>Fecha de prestamo:</strong> {formatDate(loan.fecha_prestamo)}</p>
                    {loan.fecha_vencimiento ? <p><strong>Devolucion estimada:</strong> {formatDate(loan.fecha_vencimiento)}</p> : null}
                  </div>
                  <button className="btn-return" onClick={() => openReturnForm(loan)}>
                    Devolver
                  </button>
                </div>
              ))
            )}
          </div>
        ) : null}

        {/* Historial completo de préstamos y devoluciones para administradores. */}
        {activeTab === 'historial' && isAdmin() ? (
          <div className="history-list">
            <div className="loans-header">Historial de prestamos y devoluciones ({sortedLoanHistory.length})</div>
            {sortedLoanHistory.length === 0 ? (
              <div className="empty-state">
                <h3>Sin historial de movimientos</h3>
                <p>Aun no hay prestamos ni devoluciones registradas.</p>
              </div>
            ) : (
              sortedLoanHistory.map((loan) => {
                const isActive = loan.estado === 'enuso';

                return (
                  <div key={loan.id} className="loan-item history-item-row">
                    <div className="loan-details">
                      <h4>
                        {loan.instrumento_nombre || 'Instrumento'}
                        <span className="muted-inline"> ({loan.instrumento_referencia || 'N/A'})</span>
                      </h4>
                      <p>
                        <strong>Usuario:</strong> {loan.usuario_nombre || 'N/A'} - <strong>Documento:</strong> {loan.usuario_documento || 'N/A'}
                      </p>
                      <p><strong>Fecha prestamo:</strong> {formatDate(loan.fecha_prestamo)}</p>
                      {loan.fecha_devolucion ? <p><strong>Fecha devolucion:</strong> {formatDate(loan.fecha_devolucion)}</p> : null}
                    </div>
                    <span className={`history-status ${isActive ? 'history-active' : 'history-returned'}`}>
                      {isActive ? 'Prestamo Activo' : 'Devuelto'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </main>

      {showInstrumentModal ? (
        <div className="modal-overlay active" onClick={() => setShowInstrumentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingInstrumentId ? 'Editar Instrumento' : 'Registrar Nuevo Instrumento'}</h2>
              <button className="btn-close" onClick={() => setShowInstrumentModal(false)}>x</button>
            </div>

            <form className="modal-content" onSubmit={guardarInstrumento}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Codigo *</label>
                  <input
                    type="text"
                    value={instrumentForm.codigo}
                    onChange={(e) => setInstrumentForm((s) => ({ ...s, codigo: e.target.value }))}
                    placeholder="Ej: INS-001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={instrumentForm.nombre}
                    onChange={(e) => setInstrumentForm((s) => ({ ...s, nombre: e.target.value }))}
                    placeholder="Ej: Guitarra Acustica"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Categoria *</label>
                  <select
                    value={instrumentForm.categoria}
                    onChange={(e) => setInstrumentForm((s) => ({ ...s, categoria: e.target.value }))}
                    required
                  >
                    <option value="">Seleccione categoria</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    value={instrumentForm.marca}
                    onChange={(e) => setInstrumentForm((s) => ({ ...s, marca: e.target.value }))}
                    placeholder="Ej: Yamaha"
                  />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input
                    type="text"
                    value={instrumentForm.modelo}
                    onChange={(e) => setInstrumentForm((s) => ({ ...s, modelo: e.target.value }))}
                    placeholder="Ej: FG720S"
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de Adquisicion</label>
                  <input
                    type="date"
                    value={instrumentForm.fechaAdquisicion}
                    onChange={(e) => setInstrumentForm((s) => ({ ...s, fechaAdquisicion: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    value={instrumentForm.cantidad}
                    onChange={(e) => setInstrumentForm((s) => ({ ...s, cantidad: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowInstrumentModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">Guardar Instrumento</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showLoanModal ? (
        <div className="modal-overlay active" onClick={() => setShowLoanModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nuevo Prestamo</h2>
              <button className="btn-close" onClick={() => setShowLoanModal(false)}>x</button>
            </div>

            {loanModalError ? <div className="loan-modal-error active">{loanModalError}</div> : null}

            <form className="modal-content" onSubmit={guardarPrestamo}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label>Instrumento *</label>
                  <select
                    value={loanForm.instrumentoId}
                    onChange={(e) => setLoanForm((s) => ({ ...s, instrumentoId: e.target.value }))}
                    required
                  >
                    <option value="">Seleccione instrumento</option>
                    {availableLoanInstruments.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.nombre} ({inst.referencia || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Nombre del Estudiante *</label>
                  <input
                    type="text"
                    value={loanForm.estudianteNombre}
                    onChange={(e) => setLoanForm((s) => ({ ...s, estudianteNombre: e.target.value }))}
                    placeholder="Ej: Juan Perez"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Identificacion del Estudiante *</label>
                  <input
                    type="text"
                    value={loanForm.estudianteIdentificacion}
                    onChange={(e) => setLoanForm((s) => ({ ...s, estudianteIdentificacion: e.target.value }))}
                    placeholder="Ej: 1234567890"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha de Prestamo *</label>
                  <input
                    type="date"
                    value={loanForm.fechaPrestamo}
                    onChange={(e) => setLoanForm((s) => ({ ...s, fechaPrestamo: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Devolucion Estimada</label>
                  <input
                    type="date"
                    value={loanForm.fechaDevolucionEstimada}
                    onChange={(e) => setLoanForm((s) => ({ ...s, fechaDevolucionEstimada: e.target.value }))}
                  />
                </div>
                <div className="form-group form-full">
                  <label>Observaciones</label>
                  <textarea
                    rows={3}
                    value={loanForm.observaciones}
                    onChange={(e) => setLoanForm((s) => ({ ...s, observaciones: e.target.value }))}
                    placeholder="Notas sobre el prestamo..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowLoanModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">Registrar Prestamo</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showReturnModal && returningLoan ? (
        <div className="modal-overlay active" onClick={() => setShowReturnModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Devolver Instrumento</h2>
              <button className="btn-close" onClick={() => setShowReturnModal(false)}>x</button>
            </div>

            <div className="modal-content">
              <h3>Prestamo Activo</h3>
              <p><strong>Instrumento:</strong> {returningLoan.instrumento_nombre || 'N/A'}</p>
              <p><strong>Usuario:</strong> {returningLoan.usuario_nombre || 'N/A'}</p>
            </div>

            <form
              className="modal-content"
              onSubmit={(event) => {
                event.preventDefault();
                void handleDevolverPrestamo(returningLoan.id);
              }}
            >
              <div className="form-grid">
                <div className="form-group form-full">
                  <label>Observaciones de Devolucion</label>
                  <textarea
                    rows={3}
                    value={returnObservaciones}
                    onChange={(e) => setReturnObservaciones(e.target.value)}
                    placeholder="Notas sobre el estado del instrumento..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowReturnModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">Confirmar Devolucion</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showBajaModal && instrumentoParaBaja ? (
        <div className="modal-overlay active" onClick={() => setShowBajaModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Dar de Baja Instrumento</h2>
              <button className="btn-close" onClick={() => setShowBajaModal(false)}>x</button>
            </div>

            <form className="modal-content" onSubmit={submitDarBaja}>
              <div className="form-grid">
                <div className="form-group form-full">
                  <label>Instrumento</label>
                  <input type="text" value={instrumentoParaBaja.nombre} disabled />
                </div>

                <div className="form-group form-full">
                  <label>Referencia</label>
                  <input type="text" value={instrumentoParaBaja.referencia || instrumentoParaBaja.codigo || ''} disabled />
                </div>

                <div className="form-group form-full">
                  <label>Motivo / Observacion *</label>
                  <textarea
                    rows={4}
                    value={bajaObservacion}
                    onChange={(e) => setBajaObservacion(e.target.value)}
                    placeholder="Describe el motivo de la baja del instrumento"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowBajaModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">Confirmar baja</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showReportsModal ? (
        <div className="modal-overlay active" onClick={() => setShowReportsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reportes</h2>
              <button className="btn-close" onClick={() => setShowReportsModal(false)}>x</button>
            </div>
            <div className="modal-content reports-modal-content">
              <div className="report-section">
                <h3 className="report-title">Resumen General</h3>
                <div className="report-stats">
                  <div className="report-stat bg-blue">
                    <p>Total instrumentos</p>
                    <p>{instrumentos.length}</p>
                  </div>
                  <div className="report-stat bg-yellow">
                    <p>Prestamos activos</p>
                    <p>{activeLoans.length}</p>
                  </div>
                  <div className="report-stat bg-green">
                    <p>Disponibles</p>
                    <p>{instrumentos.filter((i) => i.estado === 'disponible').length}</p>
                  </div>
                </div>
              </div>

              <div className="reports-actions">
                <button className="btn-secondary" onClick={exportCSV}>Descargar CSV</button>
                <button className="btn-secondary" onClick={exportReportJSON}>Descargar JSON</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showHistoryModal ? (
        <div className="modal-overlay active" onClick={() => setShowHistoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Historial de {historialInstrumentoNombre}</h2>
              <button className="btn-close" onClick={() => setShowHistoryModal(false)}>x</button>
            </div>

            <div className="modal-content history-modal-content">
              {historialLoading ? <div className="history-loading">Cargando historial...</div> : null}

              {!historialLoading && historialMovimientos.length === 0 ? (
                <div className="empty-state">
                  <h3>Sin movimientos registrados</h3>
                  <p>Este instrumento aun no tiene historial disponible.</p>
                </div>
              ) : null}

              {!historialLoading && historialMovimientos.length > 0 ? (
                <div className="history-list">
                  {historialMovimientos.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-item-header">
                        <span className="history-type">{item.tipo_movimiento}</span>
                        <span className="history-date">{formatDateTime(item.fecha_cambio)}</span>
                      </div>
                      <p className="history-state">
                        Estado: {item.estado_anterior || 'N/A'} -&gt; {item.estado_nuevo || 'N/A'}
                      </p>
                      <p className="history-meta">Por: {item.cambiado_por_nombre || 'Sistema'}</p>
                      {item.observacion ? <p className="history-note">{item.observacion}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
