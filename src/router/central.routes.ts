import type { RouteRecordRaw } from 'vue-router'

export const centralRoutes: RouteRecordRaw = {
  path: '/central',
  component: () => import('@/views/central/CentralAppLayout.vue'),
  meta: { requiresAuth: true, requiresCentralSession: true, requiresSuperuser: true },
  children: [
    {
      path: '',
      name: 'central-home',
      component: () => import('@/views/central/CentralHomeView.vue'),
      meta: { title: 'Inicio' },
    },
    {
      path: 'admin/tenants',
      name: 'admin-tenants',
      component: () => import('@/views/central/CentralTenantsListView.vue'),
      meta: { title: 'Clientes', module: 'Administración' },
    },
    {
      path: 'admin/users',
      name: 'admin-users',
      component: () => import('@/views/central/CentralUsersListView.vue'),
      meta: { title: 'Usuarios', module: 'Administración' },
    },
    {
      path: 'admin/audit',
      name: 'admin-audit',
      component: () => import('@/views/central/CentralAuditListView.vue'),
      meta: { title: 'Auditoría', module: 'Administración' },
    },
    {
      path: 'perfil',
      name: 'central-profile',
      component: () => import('@/views/app/ProfileView.vue'),
      meta: { title: 'Editar perfil' },
    },
  ],
}
