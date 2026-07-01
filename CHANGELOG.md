# Changelog — SoftDIN Frontend

## [Unreleased]

### Added

- Carpeta `src/views/RegistrosMaestros/` (mismo nivel que `app/`) con catálogo y geografía.
- Rutas `/registros-maestros` y subrutas; redirecciones desde `/datos-maestros` y `/maestros/*`.
- Avatares en listado de usuarios por cliente (central) y en cabecera de usuario logueado.
- Tipos de servicio del cliente (`rrhh`, `sgi`) en edición central.
- Modal independiente de usuarios por cliente.
- `bootstrapSession` para sincronizar perfil y foto al cargar la SPA.

### Changed

- README del proyecto con estructura de vistas y rutas.
- Login central: enlaces «Olvidó su contraseña» y «Acceso Clientes» en la misma fila.
- Sidebar central: icono de marca con `favicon.svg`.

## [2026-06-19]

### Added

- SoftDIN Central: clientes, usuarios, auditoría, provisionamiento RRHH.
- Traza de diagnóstico en login central (`centralLoginTrace.ts`).
- Normalización automática de `VITE_API_URL` con `/api/v1`.
