# 🔧 Solución de Errores 403 (Forbidden) en Angular

## ✅ Cambios Realizados

He corregido los siguientes archivos para inyectar correctamente el token JWT:

### 1. **auth.interceptor.ts**
- ✅ Mejora en la inyección del token en los headers
- ✅ Validación correcta del token antes de usarlo
- ✅ Manejo detallado de errores 401/403
- ✅ Logs mejorados para debugging

### 2. **auth.service.ts**
- ✅ Inicialización correcta del BehaviorSubject
- ✅ Mejor manejo del localStorage
- ✅ Validación de token (trim y length check)
- ✅ Logging detallado

### 3. **app.config.ts**
- ✅ Configuración CSRF para Django
- ✅ Content-Type header configurado
- ✅ Interceptor registrado correctamente

### 4. **dashboard.component.ts**
- ✅ Verificación de token antes de cargar datos
- ✅ Mejor manejo de errores
- ✅ Suscripción a cambios de usuario
- ✅ Cleanup con takeUntil

---

## 🔍 Verificación de Configuración Backend

**Asegúrate de que Django esté configurado correctamente:**

### 1. **CORS está habilitado**
En `Inventario/settings.py`, verifica:
```python
INSTALLED_APPS = [
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # DEBE SER PRIMERO
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",  # Angular
    "http://127.0.0.1:4200",
    "http://localhost:3000",
]
```

### 2. **Token Authentication está configurado**
En `Inventario/settings.py`:
```python
INSTALLED_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    # ...
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}
```

### 3. **CSRF está configurado**
```python
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

# Para desarrollo
CSRF_COOKIE_SECURE = False  # Solo en desarrollo
SESSION_COOKIE_SECURE = False  # Solo en desarrollo
```

---

## 🚀 Pasos para Solucionar

### Paso 1: Reinicia el Servidor Django
```bash
# En una terminal PowerShell
cd c:\Users\mtafu\Desktop\django_angular
entorno\Scripts\Activate.ps1
python manage.py runserver
```

### Paso 2: Vacía el Cache del Navegador
En Angular (ng serve):
1. Abre DevTools (F12)
2. Clic derecho en el botón refresh
3. Selecciona "Limpiar caché y realizar descarga forzada"
4. O: Ctrl+Shift+Delete → Caché

### Paso 3: Inicia Sesión de Nuevo
1. Abre `http://localhost:4200`
2. Inicia sesión con tus credenciales
3. Revisa la Console (F12) para ver los logs

### Paso 4: Verifica el Token en Console
Abre DevTools → Console y ejecuta:
```javascript
// Ver el token almacenado
localStorage.getItem('token')

// Ver el usuario
JSON.parse(localStorage.getItem('user'))

// Ver las peticiones (abre Network)
```

---

## 📊 Qué Ver en DevTools

### Console (F12 → Console)
Deberías ver logs como estos después de login:

```
✅ Login exitoso: {
  usuario: "tu_usuario",
  rol: "Administrador",
  token: "abc123def456..."
}

AuthService inicializado. Usuario: tu_usuario

🔐 Inyectando token en solicitud: http://localhost:8000/api/estadisticas_generales/
📊 Estadísticas cargadas: {...}
```

### Network (F12 → Network)
1. İniciar sesión
2. Abre la pestaña "Network"
3. Busca solicitudes a `http://localhost:8000/api/`
4. Haz clic en cada una y verifica:
   - Headers → Authorization: `Token abc123...`
   - Status: 200 (no 403)

---

## ❌ Síntomas de Errores

### Error 403 (Forbidden)
**Causa:** Token no se envía o es inválido
**Solución:**
```
1. ✅ Verifica CORS en Django
2. ✅ Verifica Token Authentication en settings.py
3. ✅ Haz login de nuevo
4. ✅ Vacía caché del navegador
```

### Error 0 (Sin conexión)
**Causa:** Django no está ejecutándose
**Solución:**
```
python manage.py runserver
```

### Error 401 (Unauthorized)
**Causa:** Token expirado o inválido
**Solución:**
```
Logout y vuelve a iniciar sesión
```

---

## 📝 Archivo de Debugging

Si aún hay problemas, crea un test simple:

**Crear archivo:** `miapi/src/app/test-auth.component.ts`
```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-test-auth',
  template: `
    <div>
      <p>Token: {{ token }}</p>
      <p>Usuario: {{ usuario | json }}</p>
      <p>Autenticado: {{ autenticado }}</p>
      <button (click)="testRequest()">Probar Solicitud</button>
      <pre>{{ respuesta | json }}</pre>
    </div>
  `
})
export class TestAuthComponent implements OnInit {
  token: string | null = null;
  usuario: any = null;
  autenticado: boolean = false;
  respuesta: any = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.token = this.authService.getToken();
    this.usuario = this.authService.getCurrentUser();
    this.autenticado = this.authService.isAuthenticated();
  }

  testRequest(): void {
    this.http.get('http://localhost:8000/api/instrumentos/')
      .subscribe({
        next: (data) => this.respuesta = data,
        error: (err) => this.respuesta = { error: err }
      });
  }
}
```

---

## 🔄 Flujo de Autenticación Correcto

```
1. Usuario ingresa credenciales
   ↓
2. POST /api/login/ → Backend devuelve TOKEN
   ↓
3. localStorage.setItem('token', TOKEN)
   ↓
4. BehaviorSubject se actualiza
   ↓
5. Interceptor obtiene token de localStorage
   ↓
6. Interceptor añade header: Authorization: Token XXX
   ↓
7. GET /api/instrumentos/ con header Authorization
   ↓
8. Backend verifica token y devuelve datos (200)
   ↓
9. Angular recibe datos y los muestra
```

---

## ✨ Resumen

Si aún tienes problemas después de estos cambios, verifica:

- [ ] Django está corriendo: `python manage.py runserver`
- [ ] CORS está habilitado en settings.py
- [ ] Token Authentication está configurado
- [ ] Caché del navegador está limpio
- [ ] Console muestra logs de token inyectado
- [ ] Network tab muestra header Authorization

**Cualquier duda o error, revisa los logs en Console (F12)**
