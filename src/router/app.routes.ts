import type { RouteRecordRaw } from 'vue-router'

export const appRoutes: RouteRecordRaw = {
  path: '/',
  component: () => import('@/views/app/AppLayout.vue'),
  meta: { requiresAuth: true, requiresTenantSession: true },
  children: [
    {
      path: '',
      name: 'home',
      component: () => import('@/views/app/HomeView.vue'),
    },
    {
      path: 'registros-maestros',
      name: 'registros-maestros',
      component: () => import('@/views/RegistrosMaestros/RegistrosMaestrosView.vue'),
      meta: { title: 'Registros Maestros', module: 'Registros Maestros' },
    },
    {
      path: 'datos-maestros',
      redirect: { name: 'registros-maestros' },
    },
    {
      path: 'perfil',
      name: 'profile',
      component: () => import('@/views/app/ProfileView.vue'),
      meta: { title: 'Editar perfil' },
    },
    {
      path: 'cliente/logo',
      name: 'tenant-branding',
      component: () => import('@/views/app/TenantBrandingView.vue'),
      meta: { title: 'Logo del cliente', requiresTenantLogoManage: true },
    },
    {
      path: 'auditoria',
      name: 'tenant-audit',
      component: () => import('@/views/app/TenantAuditListView.vue'),
      meta: { title: 'Auditoría', requiresTenantAudit: true },
    },
    {
      path: 'registros-maestros/geografia',
      name: 'registros-maestros-geografia',
      component: () => import('@/views/RegistrosMaestros/GeografiaAdminView.vue'),
      meta: { title: 'Geografía', module: 'Registros Maestros' },
    },
    {
      path: 'maestros/geografia',
      redirect: { name: 'registros-maestros-geografia' },
    },
    {
      path: 'registros-maestros/cargos',
      name: 'registros-maestros-cargos',
      component: () => import('@/views/app/PlaceholderView.vue'),
      meta: { title: 'Cargos', module: 'Registros Maestros' },
    },
    {
      path: 'maestros/cargos',
      redirect: { name: 'registros-maestros-cargos' },
    },
    {
      path: 'registros-maestros/terceros',
      name: 'registros-maestros-terceros',
      component: () => import('@/views/app/PlaceholderView.vue'),
      meta: { title: 'Terceros', module: 'Registros Maestros' },
    },
    {
      path: 'maestros/terceros',
      redirect: { name: 'registros-maestros-terceros' },
    },
    {
      path: 'maestros',
      redirect: { name: 'registros-maestros' },
    },
    {
      path: 'nomina/empleados',
      name: 'nomina-empleados',
      component: () => import('@/views/app/PlaceholderView.vue'),
      meta: { title: 'Empleados', module: 'Nómina' },
    },
    {
      path: 'nomina/liquidaciones',
      name: 'nomina-liquidaciones',
      component: () => import('@/views/app/PlaceholderView.vue'),
      meta: { title: 'Liquidaciones', module: 'Nómina' },
    },
    {
      path: 'hov/consulta',
      name: 'hov-consulta',
      component: () => import('@/views/app/PlaceholderView.vue'),
      meta: { title: 'Consulta', module: 'Hojas de vida' },
    },
    {
      path: 'otros/reportes',
      name: 'otros-reportes',
      component: () => import('@/views/app/PlaceholderView.vue'),
      meta: { title: 'Reportes', module: 'Otros' },
    },
  ],
}
