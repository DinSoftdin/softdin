import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { authRoutes } from '@/router/auth.routes'
import { appRoutes } from '@/router/app.routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    appRoutes,
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
