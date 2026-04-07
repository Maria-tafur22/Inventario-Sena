# 📦 Guía Completa de Instalación y Ejecución

## 🎯 Requisitos Previos

### Sistema
- Windows 10/11, macOS o Linux
- Terminal/CMD disponible
- Conexión a internet

### Software Requerido
- **Python 3.10+** - [Descargar](https://www.python.org/downloads/)
- **Node.js 18+** - [Descargar](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **Git** (opcional pero recomendado) - [Descargar](https://git-scm.com/)

### Verificar Instalación

```bash
# Python
python --version  # o python3 --version

# Node.js y npm
node --version
npm --version
```

---

## 🔧 PARTE 1: Configurar Backend Django

### 1.1 Activar Entorno Virtual

**Windows (CMD):**
```bash
cd django_angular
entorno\Scripts\activate
```

**Windows (PowerShell):**
```powershell
cd django_angular
entorno\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
cd django_angular
source entorno/bin/activate
```

Deberías ver `(entorno)` al inicio de tu línea de comando.

### 1.2 Instalar Dependencias

```bash
# Instalar paquetes Python
pip install -r requirements.txt
```

Si no existe `requirements.txt`, instala manualmente:
```bash
pip install Django==6.0.2
pip install djangorestframework==3.16.1
pip install django-cors-headers==4.9.0
pip install python-dotenv==1.2.2
pip install psycopg2==2.9.11
pip install openpyxl==3.1.5
```

### 1.3 Configurar Base de Datos

```bash
# Aplicar migraciones
python manage.py migrate

# Crear superusuario (administrador)
python manage.py createsuperuser
# Seguir los prompts para crear usuario

# Cargar datos de ejemplo (opcional)
python manage.py loaddata fixtures/instrumentos_iniciales.json
```

### 1.4 Verificar CORS está Configurado

Abre `Inventario/settings.py` y verifica:

```python
INSTALLED_APPS = [
    # ...
    'corsheaders',  # Debe estar aquí
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Debe estar primero
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",    # Angular dev server
    "http://127.0.0.1:4200",
]
```

Si no está configurado, agrégalo.

### 1.5 Ejecutar Servidor Django

```bash
# En la carpeta django_angular con entorno activado
python manage.py runserver

# Output esperado:
# Starting development server at http://127.0.0.1:8000/
# Quit the server with CONTROL-C.
```

**¡Backend está listo en http://localhost:8000!**

---

## 🎨 PARTE 2: Configurar Frontend Angular

### 2.1 Abrir Nueva Terminal/CMD

Manteniendo el backend ejecutándose, abre una **nueva ventana de terminal**.

### 2.2 Navegar a Carpeta Frontend

```bash
# Desde raíz del proyecto
cd miapi
```

### 2.3 Instalar Dependencias

```bash
npm install

# Esto puede tomar 2-5 minutos
```

### 2.4 Configurar API URL (si es necesario)

Abre `src/app/services/auth.service.ts` y verifica:

```typescript
private apiUrl = 'http://localhost:8000/api';
```

Si el backend está en otro puerto, actualiza esta URL.

### 2.5 Ejecutar Servidor Angular

```bash
ng serve

# O alternativamente
npm start

# Output esperado:
# ✔ Compiled successfully.
# 
# Application bundle generated successfully. [time] ms.
#
# Watch mode enabled. Watching for file changes...
# 
# Local:   http://localhost:4200
```

**¡Frontend está listo en http://localhost:4200!**

---

## 🚀 Acceder a la Aplicación

### En el Navegador

1. Abre: **http://localhost:4200**
2. Deberías ver la pantalla de login

### Usuarios de Prueba

```
ADMIN
└─ Usuario: admin
└─ Contraseña: 1234
└─ Rol: administrador

ALMACENISTA
└─ Usuario: almacenista  
└─ Contraseña: almacen123
└─ Rol: almacenista

PROFESOR
└─ Usuario: profesor
└─ Contraseña: profesor123
└─ Rol: profesor

ESTUDIANTE
└─ Usuario: estudiante
└─ Contraseña: estudiante123
└─ Rol: estudiante
```

### O Crear Nuevo Usuario

```bash
# En terminal con backend ejecutándose
python manage.py createsuperuser

# O via Django Admin
http://localhost:8000/admin
# Credenciales: usuario/contraseña que creaste
```

---

## 🧪 Verificar Funcionamiento

### Backend Testing

```bash
# API Login (en terminal con curl o Postman)
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'

# Respuesta esperada:
# {"token":"...", "user_id":1, "username":"admin"}
```

### Frontend Testing

1. Ve a http://localhost:4200
2. Haz login con admin/1234
3. Deberías ver el dashboard con:
   - Stats de instrumentos
   - Panel de alertas
   - Navegación a instrumentos, préstamos, reportes

### Endpoints clave

```
Login:
POST http://localhost:8000/api/login/

Instrumentos:
GET http://localhost:8000/api/instrumentos/

Préstamos:
GET http://localhost:8000/api/prestamos/

Reportes:
GET http://localhost:8000/api/reportes/estadisticas_generales/
```

---

## 📋 Estructura de Archivos

```
django_angular/
├── entorno/                    # Entorno virtual Python
├── api/                        # App Django backend
│   ├── views.py               # ViewSets y lógica
│   ├── serializers.py         # Serialización JSON
│   ├── models.py              # Modelos de BD
│   └── urls.py                # Rutas API
├── Inventario/                # Configuración Django
│   ├── settings.py            # CORS, DB, apps
│   ├── urls.py                # URLs principales
│   └── wsgi.py                # Deploy settings
├── manage.py                  # Comando Django cli
├── miapi/                     # Aplicación Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/          # Componente login
│   │   │   ├── dashboard/     # Layout principal
│   │   │   ├── services/      # HTTP services
│   │   │   ├── models/        # TypeScript interfaces
│   │   │   └── core/          # Guards, interceptors
│   │   └── main.ts
│   ├── package.json           # Dependencies npm
│   └── angular.json           # Config Angular
└── README.md                  # Este archivo
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to Backend"

**Síntoma:** Frontend muestra error de conexión en login

```bash
# Solución:
1. Verifica que backend está ejecutando:
   - Abre http://localhost:8000
   - Deberías ver página de Django

2. Verifica URL en src/app/services/auth.service.ts
   - Debe ser: http://localhost:8000/api

3. Verifica CORS en backend:
   - Abre Inventario/settings.py
   - Busca CORS_ALLOWED_ORIGINS
   - Debe incluir "http://localhost:4200"
```

### Error: "CORS error in console"

**Síntoma:** Network tab muestra error CORS

```bash
# Solución:
1. Instalar cors en backend:
   pip install django-cors-headers

2. Agregar a INSTALLED_APPS:
   INSTALLED_APPS = [
       'corsheaders',
       # ...
   ]

3. Agregar middleware:
   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',
       # ... resto de middleware
   ]

4. Agregar allowed origins:
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:4200",
   ]

5. Reiniciar backend
```

### Error: "npm install hangs"

```bash
# Solución:
1. Cancelar (Ctrl+C)

2. Limpiar cache:
   npm cache clean --force

3. Reinstalar:
   npm install --legacy-peer-deps
```

### Error: "Port 4200 already in use"

```bash
# Solución option 1: Usar puerto diferente
ng serve --port 4201

# Solución option 2: Matar proceso en puerto
# Windows:
netstat -ano | findstr :4200
taskkill /PID <pid> /F

# macOS/Linux:
lsof -i :4200
kill -9 <PID>
```

### Error: "Port 8000 already in use"

```bash
# Solución: Usar puerto diferente
python manage.py runserver 8001

# Luego actualizar URL en frontend:
# src/app/services/auth.service.ts
# private apiUrl = 'http://localhost:8001/api';
```

---

## ⚡ Comandos Útiles

### Backend

```bash
# Activar entorno
entorno\Scripts\activate  # Windows
source entorno/bin/activate  # macOS/Linux

# Crear migraciones (después cambiar modelos)
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Ver usuarios
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.all()

# Limpiar BD y empezar de cero
python manage.py flush

# Crear superusuario
python manage.py createsuperuser

# Ver logs
python manage.py runserver --verbosity 2
```

### Frontend

```bash
# Instalar dependencias
npm install

# Dev server (con hot reload)
ng serve

# Build producción
ng build --configuration production

# Ejecutar tests
ng test

# Linting
ng lint
```

---

## 📚 Documentación Adicional

- [Backend README](./README_BACKEND.md) - Documentación API Django
- [Frontend README](./miapi/README_FRONTEND.md) - Documentación Angular
- [Integración Angular-Django](./INTEGRACION_ANGULAR_DJANGO.md) - Arquitectura y flujos

---

## ✅ Checklist Final

Antes de decir "está funcionando":

- [ ] Backend ejecutándose en http://localhost:8000
- [ ] Frontend ejecutándose en http://localhost:4200
- [ ] Puedo hacer login con admin/1234
- [ ] Dashboard muestra estadísticas
- [ ] Puedo ver lista de instrumentos
- [ ] Puedo crear un instrumento
- [ ] Puedo ver lista de préstamos
- [ ] Puedo ver reportes
- [ ] Puedo logout y volver a login
- [ ] Consola del navegador sin errores
- [ ] Network tab sin CORS errors

---

## 🎓 Próximos Pasos (Opcional)

1. **Personalizar Estilos**
   - Editar archivos `.css` en components

2. **Agregar Validaciones**
   - Implementar Reactive Forms en Angular
   - Validación del lado del cliente

3. **Deploy a Producción**
   - Build frontend: `ng build --configuration production`
   - Deploy backend: Heroku, AWS, Azure, etc.
   - Servir Angular desde Django estático

4. **Mejorar Performance**
   - Lazy loading de módulos
   - Implementar virtual scrolling
   - Caché de datos

5. **Agregar Funcionalidades**
   - Más reportes
   - Gráficos (Chart.js, Plotly)
   - Notificaciones en tiempo real (WebSockets)

---

## 📞 Support

Si tienes problemas:

1. Revisar los logs en la terminal
2. Revisar DevTools (F12) en el navegador
3. Revisar este documento
4. Revisar documentación de [Django](https://docs.djangoproject.com/) o [Angular](https://angular.io/docs)

---

**¡Listo para usar! 🚀**
