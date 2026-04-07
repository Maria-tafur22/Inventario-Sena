# 🎵 Gestor de Inventario Musical - Frontend Angular

Sistema completo de gestión de inventario de instrumentos musicales con Angular 17+ integrado con backend Django REST Framework.

## 🚀 Quick Start

### Requisitos Previos
- Node.js 18+ y npm/yarn
- Backend Django ejecutándose en `http://localhost:8000`

### Instalación y Ejecución

```bash
# Navegar al directorio del proyecto
cd miapi

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
ng serve

# Abrir en navegador
http://localhost:4200
```

## 📋 Estructura del Proyecto

```
src/app/
├── auth/
│   └── login/                      # Autenticación
│       ├── login.component.ts
│       ├── login.component.html
│       └── login.component.css
├── core/
│   ├── guards/                     # Protección de rutas
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   └── interceptors/               # Inyección de tokens
│       └── auth.interceptor.ts
├── models/                         # Interfaces TypeScript
│   ├── user.model.ts
│   ├── instrumento.model.ts
│   ├── prestamo.model.ts
│   └── reporte.model.ts
├── services/                       # Llamadas HTTP
│   ├── auth.service.ts
│   ├── instrumento.service.ts
│   ├── prestamo.service.ts
│   └── reporte.service.ts
├── dashboard/                      # Componente principal
│   ├── dashboard.component.ts
│   ├── dashboard.component.html
│   └── dashboard.component.css
├── instrumentos/                   # Gestión de instrumentos
│   └── list/
│       ├── instrumentos-list.component.ts
│       ├── instrumentos-list.component.html
│       └── instrumentos-list.component.css
├── prestamos/                      # Gestión de préstamos
│   └── list/
│       ├── prestamos-list.component.ts
│       ├── prestamos-list.component.html
│       └── prestamos-list.component.css
├── reportes/                       # Reportes y estadísticas
│   ├── reportes.component.ts
│   ├── reportes.component.html
│   └── reportes.component.css
├── app.routes.ts                   # Configuración de rutas
├── app.config.ts                   # Configuración de la app
├── app.ts                          # Componente raíz
└── app.html
```

## 🔐 Autenticación

### Usuarios de Prueba

```
Usuario: admin
Contraseña: 1234
Rol: administrador

Usuario: almacenista
Contraseña: almacen123
Rol: almacenista

Usuario: profesor
Contraseña: profesor123
Rol: profesor

Usuario: estudiante
Contraseña: estudiante123
Rol: estudiante
```

### Flujo de Autenticación

1. Usuario ingresa credenciales en login
2. `AuthService.login()` envía POST a `/api/login/`
3. Backend retorna token y datos del usuario
4. Token se almacena en `localStorage`
5. `AuthInterceptor` inyecta token en header `Authorization: Token <token>`
6. Usuario es redirigido a dashboard

## 📡 Integración con Backend

### Endpoints Utilizados

**Autenticación:**
- `POST /api/login/` - Obtener token

**Instrumentos:**
- `GET /api/instrumentos/` - Listar instrumentos
- `POST /api/instrumentos/` - Crear instrumento
- `PUT /api/instrumentos/{id}/` - Actualizar instrumento
- `DELETE /api/instrumentos/{id}/` - Eliminar instrumento
- `POST /api/instrumentos/{id}/dar_baja/` - Dar de baja
- `POST /api/instrumentos/{id}/cambiar_estado_fisico/` - Cambiar condición

**Préstamos:**
- `GET /api/prestamos/` - Listar préstamos
- `POST /api/prestamos/` - Crear préstamo
- `POST /api/prestamos/{id}/devolver/` - Registrar devolución
- `GET /api/prestamos/vencidos/` - Préstamos vencidos
- `GET /api/prestamos/proximos_a_vencer/` - Próximos a vencer
- `GET /api/prestamos/exportar_excel/` - Exportar a Excel

**Reportes:**
- `GET /api/reportes/estadisticas_generales/` - Estadísticas
- `GET /api/reportes/reporte_usuarios_morosos/` - Usuarios morosos
- `GET /api/reportes/reporte_uso_instrumentos/` - Uso de instrumentos
- `GET /api/reportes/exportar_reporte_excel/` - Exportar reportes

## 🎨 Características Principales

### 1. Dashboard
- Estadísticas en tiempo real
- Panel de alertas para préstamos vencidos
- Navegación intuitiva
- Información del usuario autenticado

### 2. Gestión de Instrumentos
- Listar todos los instrumentos
- Crear, editar y eliminar instrumentos
- Filtrar por estado y categoría
- Buscar por nombre o código
- Ver historial de cambios

### 3. Gestión de Préstamos
- Crear nuevos préstamos
- Registrar devoluciones
- Ver préstamos activos y vencidos
- Visibilidad de días faltantes para vencimiento
- Alertas de vencimiento

### 4. Reportes
- Estadísticas generales del inventario
- Reporte de usuarios morosos
- Uso de instrumentos
- Exportar reportes a Excel

## 🔧 Configuración API

Para cambiar la URL del backend, edita en los servicios:

```typescript
// En cada servicio
private apiUrl = 'http://localhost:8000/api';

// O crear un conf global
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

## 🧪 Desarrollo

### Build para Producción
```bash
ng build --configuration production
```

### Ejecutar Tests
```bash
ng test
```

### Linting
```bash
ng lint
```

## 📦 Dependencias Principales

- **Angular 17+** - Framework frontend
- **TypeScript** - Lenguaje de programación
- **RxJS** - Programación reactiva
- **Bootstrap/CSS Puro** - Estilos

## 🌐 Configuración CORS

Asegúrate de que el backend Django tiene CORS habilitado:

```python
# settings.py
INSTALLED_APPS = [
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    # agregar otros orígenes según sea necesario
]
```

## 🐛 Troubleshooting

### Error "Cannot GET /api/login"
- Verificar que el backend Django está ejecutándose en localhost:8000
- Verificar que las rutas en Django están configuradas correctamente

### Errores CORS
- Asegurar que CORS está habilitado en Django
- Verificar la URL del backend en los servicios

### Token no se guarda
- Verificar que localStorage no está deshabilitado
- Revisar la consola del navegador para mensajes de error

## 📚 Documentación Adicional

Para más información sobre el backend Django, ver [Backend Documentation](../README_BACKEND.md)

## ✍️ Autor

Sistema desarrollado con Angular y Django REST Framework

## 📝 Licencia

MIT
