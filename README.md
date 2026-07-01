# SoftDIN — Frontend (SPA)

Aplicación web Vue 3 + TypeScript + Vite para **SoftDIN Central** (administración de plataforma) y el **sistema operacional por cliente** (tenant RRHH).

Repositorio: [github.com/DinSoftdin/softdin](https://github.com/DinSoftdin/softdin)

## Requisitos

- Node.js 20+
- API Laravel en ejecución ([softdin-api](../softdin-api))

## Configuración local

```powershell
cd softdin
Copy-Item .env.example .env
npm install
npm run dev
```

Variables en `.env`:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API **con** `/api/v1` | `http://localhost:8000/api/v1` |

Si `VITE_API_URL` omite `/api/v1`, el cliente lo añade automáticamente (ver `src/config/apiBase.ts`).

Tras cambiar `.env`, reinicie `npm run dev`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Compilación de producción |
| `npm run preview` | Vista previa del build |

## Estructura de vistas

```
src/views/
├── app/                    # Sistema operacional (sesión tenant)
│   ├── AppLayout.vue
│   ├── AppHeader.vue
│   ├── AppSidebar.vue
│   ├── HomeView.vue
│   ├── ProfileView.vue
│   └── ...
├── RegistrosMaestros/      # Módulo Registros Maestros (mismo nivel que app/)
│   ├── RegistrosMaestrosView.vue
│   ├── GeografiaAdminView.vue
│   └── components/
├── central/                # SoftDIN Central (superusuario)
│   ├── CentralAppLayout.vue
│   ├── CentralTenantsListView.vue
│   ├── CentralUsersListView.vue
│   └── components/
├── auth/                   # Login y registro de clientes (tenants)
└── authCentral/            # Login central de superusuarios
```

## Rutas principales

### Autenticación

| Ruta | Nombre | Descripción |
|------|--------|-------------|
| `/login` | `login` | Acceso clientes (usuarios con tenant) |
| `/login-central` | `login-central` | Acceso SoftDIN Central (superusuario) |

### Sistema operacional (requiere sesión tenant + header `X-Tenant`)

| Ruta | Nombre | Descripción |
|------|--------|-------------|
| `/` | `home` | Inicio |
| `/registros-maestros` | `registros-maestros` | Catálogo de maestros |
| `/registros-maestros/geografia` | `registros-maestros-geografia` | Administración geográfica |
| `/registros-maestros/cargos` | `registros-maestros-cargos` | Cargos (placeholder) |
| `/registros-maestros/terceros` | `registros-maestros-terceros` | Terceros (placeholder) |
| `/perfil` | `profile` | Editar perfil y foto |
| `/auditoria` | `tenant-audit` | Auditoría del cliente |
| `/cliente/logo` | `tenant-branding` | Logo del cliente (admin) |

Rutas legacy (`/datos-maestros`, `/maestros/*`) redirigen a las rutas anteriores.

### SoftDIN Central (requiere superusuario)

| Ruta | Nombre | Descripción |
|------|--------|-------------|
| `/central` | `central-home` | Panel central |
| `/central/admin/tenants` | `admin-tenants` | Clientes |
| `/central/admin/users` | `admin-users` | Usuarios de plataforma |
| `/central/admin/audit` | `admin-audit` | Auditoría central |
| `/central/perfil` | `central-profile` | Perfil del superusuario |

## Sesión y API

- Estado de autenticación en Pinia (`src/stores/auth.store.ts`) y `localStorage`.
- Modos: `central` (sin tenant activo) o `tenant` (cliente operacional).
- Peticiones autenticadas envían `Authorization: Bearer <token>`.
- En sesión tenant se envía `X-Tenant: <slug>`.
- Al iniciar la app se sincroniza la sesión (`bootstrapSession`) y se carga la foto de perfil.

## SoftDIN Central — funciones recientes

- Edición de clientes con **tipos de servicio** (`rrhh`, `sgi`) en pestaña dedicada.
- Modal **Usuarios** por cliente (asociar / quitar) con avatar en listado.
- Avatar del usuario logueado en cabecera (foto o iniciales).
- Login central con traza de diagnóstico en consola (`centralLoginTrace.ts`).

## Documentación relacionada

- API backend: [softdin-api/README.md](../softdin-api/README.md)
- Endpoints: [softdin-api/docs/api-endpoints.md](../softdin-api/docs/api-endpoints.md)
