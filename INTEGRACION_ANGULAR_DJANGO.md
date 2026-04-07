# Guía de Integración: Angular + Django

## 🔄 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANGULAR FRONTEND                            │
│  (localhost:4200)                                               │
│                                                                 │
│  Components      Services      Models      Guards               │
│  Login       -> AuthService -> User     -> AuthGuard            │
│  Dashboard   -> InstrumentoService -> Instrumento              │
│  Instrumentos-> PrestamoService    -> Prestamo                 │
│  Préstamos   -> ReporteService     -> Estadisticas             │
│  Reportes                                                       │
└────────────────────────────┬──────────────────────────────────┘
                             │
                    HTTP (Angular HTTP Client)
                    + Token en Authorization Header
                             │
┌────────────────────────────┬──────────────────────────────────┐
│              DJANGO REST API                                   │
│  (localhost:8000/api)                                          │
│                                                                 │
│  ViewSets        Serializers      Models                       │
│  LoginView   -> LoginSerializer -> User                        │
│  InstrumentoViewSet -> InstrumentoSerializer -> Instrumento    │
│  PrestamoViewSet    -> PrestamoSerializer    -> Prestamo       │
│  ReportesViewSet    -> ReporteSerializer     -> Estadisticas   │
│                                                                 │
│  Permissions: TokenAuthentication + RoleBasedAccess            │
│  Database: PostgreSQL                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 📡 Flujo de una Solicitud Típica

### Ejemplo: Crear un nuevo instrumento

```
1. FRONTEND (Angular)
   ├─ Usuario completa formulario en InstrumentosListComponent
   ├─ Hace click en "Guardar"
   └─ Llamada a InstrumentoService.crearInstrumento(instrumento)

2. SERVICE LAYER
   ├─ HTTP POST a http://localhost:8000/api/instrumentos/
   ├─ Payload: { codigo, nombre, categoria, ... }
   ├─ Headers: {
   │    'Authorization': 'Token abc123def456',
   │    'Content-Type': 'application/json'
   │  }
   └─ AuthInterceptor inyecta automáticamente el token

3. BACKEND (Django)
   ├─ Django recibe POST /api/instrumentos/
   ├─ Verifica token en AuthInterceptor
   ├─ Verifica permisos (IsAuthenticated)
   ├─ InstrumentoViewSet.create() procesa datos
   ├─ InstrumentoSerializer valida datos
   ├─ Crea registro en base de datos
   ├─ Retorna JSON con instrumento creado
   └─ Status 201 Created

4. RESPUESTA AL FRONTEND
   ├─ Angular Service recibe respuesta
   ├─ Usuario$Observable emite el nuevo instrumento
   ├─ Componente recarga lista
   ├─ Modal se cierra automáticamente
   └─ Usuario ve instrumento en lista
```

## 🔐 Seguridad: Token-Based Authentication

### Backend - Django

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}

# Autenticación
POST /api/login/
{
    "username": "admin",
    "password": "1234"
}

Response:
{
    "token": "abc123def456789...",
    "user_id": 1,
    "username": "admin"
}
```

### Frontend - Angular

```typescript
// AuthService
login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login/`, 
        { username, password })
        .pipe(
            tap(response => {
                if (response.token) {
                    localStorage.setItem('token', response.token);
                }
            })
        );
}

// AuthInterceptor
intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    const token = this.authService.getToken();
    
    if (token) {
        request = request.clone({
            setHeaders: {
                Authorization: `Token ${token}`
            }
        });
    }
    
    return next.handle(request);
}
```

## 📊 Mapeo de Modelos

### Backend Models → Frontend Models

```typescript
// BACKEND: Django Model
class Instrumento(models.Model):
    codigo = CharField(max_length=50)
    nombre = CharField(max_length=200)
    descripcion = TextField()
    categoria = ForeignKey(Categoria)
    cantidad = IntegerField()
    estado = CharField(choices=ESTADO_CHOICES)
    condicion_fisica = CharField(choices=CONDICION_CHOICES)
    fecha_actualizacion = DateTimeField(auto_now=True)

// FRONTEND: TypeScript Interface
interface Instrumento {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string;
    categoria: number;
    cantidad: number;
    estado: 'disponible' | 'prestado' | 'reparacion' | 'descartado';
    condicion_fisica: 'optimas' | 'buena' | 'regular' | 'mala';
    fecha_actualizacion: string;
}
```

## 🔄 Ciclo de Vida de Datos

### Vista de Detalles (Instrumentos)

```
1. Carga Inicial
   ├─ ngOnInit() llamado
   ├─ cargarInstrumentos() → InstrumentoService.getInstrumentos()
   ├─ GET /api/instrumentos/
   └─ Almacenar en this.instrumentos: Instrumento[]

2. Visualización
   ├─ Template itera sobre this.instrumentos
   ├─ *ngFor="let inst of instrumentos"
   ├─ Renderiza instrumento-card para cada uno
   └─ Datos reflejados en UI

3. Filtrado (Sin recargar)
   ├─ Usuario selecciona filtro
   ├─ filtrarInstrumentos() método local
   ├─ Array.filter() en cliente
   ├─ No llama a backend
   └─ Cambio inmediato en UI

4. Búsqueda (Sin recargar)
   ├─ Usuario digita en searchTerm
   ├─ [(ngModel)] binding automático
   ├─ searchTerm actualiza
   ├─ Template automáticamente filtra
   └─ Angular change detection actualiza UI

5. Actualización de Datos
   ├─ Usuario hace click Editar
   ├─ abrirEditar(instrumento) abre modal
   ├─ Usuario actualiza campos
   ├─ guardarInstrumento() llamado
   ├─ PUT /api/instrumentos/{id}/
   ├─ Backend retorna instrumento actualizado
   ├─ cargarInstrumentos() recarga lista
   └─ UI muestra datos nuevos
```

## 🛠️ Manejo de Errores

### Backend → Frontend

```typescript
// Backend retorna 400 Bad Request
{
    "error": "El código ya existe"
}

// Frontend Service recibe y procesa
this.instrumentoService.crearInstrumento(inst).subscribe({
    next: (response) => {
        // SUCCESS: response es el instrumento
        this.cargarInstrumentos();
    },
    error: (err) => {
        // ERROR: err.error contiene respuesta de error
        alert('Error: ' + err.error.error);
    }
});

// Backend retorna 401 Unauthorized
// AuthInterceptor automáticamente:
// 1. Detecta 401
// 2. Limpia token
// 3. Redirige a login
```

## 💾 Gestión de Estado

### Enfoque Local (Current Implementation)

```typescript
// Cada componente maneja su propio estado
export class InstrumentosListComponent {
    instrumentos: Instrumento[] = [];  // Estado local
    loading: boolean = true;           // Estado local
    filtroEstado: string = '';         // Estado local
    
    ngOnInit() {
        this.cargarInstrumentos(); // Carga datos al iniciar
    }
}

// Ventajas:
// + Simple para componentes pequeños
// + No requiere RxJS avanzado
// + Fácil de entender

// Desventajas:
// - No compartir datos entre componentes
// - Pérdida de estado al navegar
```

### Alternativa: Observable Services (Recomendado para escalabilidad)

```typescript
// En servicio
export class PrestamoService {
    private prestamosSubject = new BehaviorSubject<Prestamo[]>([]);
    prestamos$ = this.prestamosSubject.asObservable();
    
    loadPrestamos() {
        this.http.get<Prestamo[]>('/api/prestamos/')
            .subscribe(data => this.prestamosSubject.next(data));
    }
}

// En componente
export class PrestamosListComponent {
    prestamos$ = this.prestamoService.prestamos$;
    
    // Template: <div *ngFor="let p of prestamos$ | async">
}
```

## 📋 Requisitos del Backend

El backend DEBE proporcionar:

```python
# 1. Endpoint de login
POST /api/login/
Response: { "token": "...", "user_id": ..., "username": "..." }

# 2. TokenAuthentication configurado
REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = [
    'rest_framework.authentication.TokenAuthentication'
]

# 3. CORS habilitado
CORS_ALLOWED_ORIGINS = ["http://localhost:4200"]

# 4. HTTP 401 en tokens inválidos
# AuthInterceptor espera esto para logout

# 5. Respuestas JSON consistentes
{
    "id": 1,
    "nombre": "Guitarra",
    ...
}

# 6. Para listas: campo 'results' si usa paginación
{
    "count": 100,
    "results": [ {...}, {...} ]
}
```

## 🚀 Pasos para Integración Completa

```
1. ✅ Backend
   └─ Ejecutando en localhost:8000
   └─ CORS habilitado para localhost:4200
   └─ Endpoint /api/login/ funciona
   └─ Todos los ViewSets retornan Token Auth

2. ✅ Frontend
   └─ npm install completado
   └─ Servicios apuntando a localhost:8000
   └─ app.config.ts con interceptor
   └─ Routes configuradas

3. ✅ Testing
   └─ ng serve
   └─ Abrir localhost:4200
   └─ Login con usuario de prueba
   └─ Verificar que dashboard carga
   └─ Crear instrumento de prueba
   └─ Verificar que aparece en lista
   └─ Crear préstamo de prueba
   └─ Ver reportes

4. ✅ Debugging
   └─ DevTools > Network tab
   └─ Verificar requests a /api/
   └─ Verificar Authorization header
   └─ Revisar respuestas de servidor
   └─ Consola: revisar logs de error
```

## 📞 Debugging Checklist

```
❌ "Cannot GET /api/instrumentos"
   → Backend no está ejecutando
   → Verificar URL en servicios

❌ "CORS error"
   → Backend no tiene CORS habilitado
   → Verificar settings.py

❌ "Unauthorized (401)"
   → Token expirado o inválido
   → Relogin
   → Verificar authInterceptor inyecta token

❌ "Datos no se actualizan"
   → Component no recarga datos después de guardar
   → Verificar que cargarInstrumentos() se llama en siguiente()
   → Usar async pipe con observables

❌ "Modal no cierra"
   → Verificar closeModal() después de guardar
   → Verificar showNewInstrumentoModal = false
```

## 🔗 Referencias Útiles

- [Angular HTTP Client Docs](https://angular.io/guide/http)
- [Angular Services Docs](https://angular.io/guide/services)
- [Django REST Framework Auth](https://www.django-rest-framework.org/api-guide/authentication/)
- [CORS Configuration](https://github.com/adamchainz/django-cors-headers)
