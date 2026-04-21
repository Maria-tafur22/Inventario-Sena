# GA7-220501096-AA4-EV03 - Componente Frontend en React

## Descripcion

Este modulo implementa un frontend en React para el proyecto de inventario musical, integrando autenticacion por sesion con Django y flujos de negocio de instrumentos y prestamos.

## Funcionalidades implementadas

1. Inicio de sesion con backend Django (sesion + CSRF).
2. Consulta de instrumentos y categorias.
3. Registro de instrumento.
4. Consulta y registro de prestamos.
5. Devolucion de prestamos activos.

## Estructura tecnica

- `src/App.tsx`: componente principal con vistas y formularios.
- `src/api.ts`: capa de servicios y cliente HTTP.
- `src/types.ts`: tipado del dominio.
- `src/styles.css`: estilos base.

## Estandares aplicados

1. Tipado estricto con TypeScript.
2. Nombres claros de funciones y variables.
3. Comentarios en bloques de logica no trivial.
4. Separacion de responsabilidades (UI, servicios, tipos).

## Ejecucion

1. Abrir terminal en `frontend_react_ev03`.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev`.
4. Abrir `http://localhost:5173`.

## Requisitos de integracion

1. Backend Django en ejecucion en `http://localhost:8000`.
2. Usuario valido con rol `administrador` o `almacenista`.
