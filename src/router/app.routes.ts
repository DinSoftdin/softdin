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
      path: 'datos-maestros',
      redirect: { name: 'maestros-geografia' },
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
      path: 'maestros/geografia',
      name: 'maestros-geografia',
      component: () => import('@/views/app/GeografiaAdminView.vue'),
      meta: { title: 'Geografía', module: 'Maestros' },
    },
    {
      path: 'maestros/cargos',
      name: 'maestros-cargos',
      component: () => import('@/views/app/PlaceholderView.vue'),
      meta: { title: 'Cargos', module: 'Maestros' },
    },
    {
      path: 'maestros/terceros',
      name: 'maestros-terceros',
      component: () => import('@/views/app/PlaceholderView.vue'),
      meta: { title: 'Terceros', module: 'Maestros' },
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
