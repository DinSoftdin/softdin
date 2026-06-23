import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/registro',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/recuperar-contrasena',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue'),
      meta: { guest: true },
    },
    {
      path: '/restablecer-contrasena',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'datos-maestros',
          name: 'datos-maestros',
          component: () => import('@/views/DatosMaestrosView.vue'),
        },
        {
          path: 'perfil',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
          meta: { title: 'Editar perfil' },
        },
        {
          path: 'cliente/logo',
          name: 'tenant-branding',
          component: () => import('@/views/TenantBrandingView.vue'),
          meta: { title: 'Logo del cliente' },
        },
        {
          path: 'maestros/cargos',
          name: 'maestros-cargos',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Cargos', module: 'Maestros' },
        },
        {
          path: 'maestros/paises',
          name: 'maestros-paises',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Países', module: 'Maestros' },
        },
        {
          path: 'maestros/terceros',
          name: 'maestros-terceros',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Terceros', module: 'Maestros' },
        },
        {
          path: 'nomina/empleados',
          name: 'nomina-empleados',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Empleados', module: 'Nómina' },
        },
        {
          path: 'nomina/liquidaciones',
          name: 'nomina-liquidaciones',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Liquidaciones', module: 'Nómina' },
        },
        {
          path: 'hov/consulta',
          name: 'hov-consulta',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Consulta', module: 'Hojas de vida' },
        },
        {
          path: 'otros/reportes',
          name: 'otros-reportes',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Reportes', module: 'Otros' },
        },
        {
          path: 'admin/tenants',
          name: 'admin-tenants',
          component: () => import('@/views/PlaceholderView.vue'),
          meta: { title: 'Clientes (Tenants)', module: 'Administración', requiresAdmin: true },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'home' }
  }

  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      auth.clearSession()
      return { name: 'login' }
    }
  }

  return true
})

export default router
