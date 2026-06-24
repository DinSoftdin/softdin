import type { RouteRecordRaw } from 'vue-router'

export const authCentralRoutes: RouteRecordRaw[] = [
  {
    path: '/logincentral',
    name: 'login-central',
    component: () => import('@/views/authCentral/LoginCentralView.vue'),
    meta: { guest: 'central' },
  },
  {
    path: '/central/recuperar-contrasena',
    name: 'central-forgot-password',
    component: () => import('@/views/authCentral/ForgotPasswordCentralView.vue'),
    meta: { guest: 'central' },
  },
]
