import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/registro',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { guest: true },
  },
  {
    path: '/recuperar-contrasena',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { guest: true },
  },
  {
    path: '/restablecer-contrasena',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { guest: true },
  },
]
