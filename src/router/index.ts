import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { authRoutes } from '@/router/auth.routes'
import { authCentralRoutes } from '@/router/authCentral.routes'
import { appRoutes } from '@/router/app.routes'
import { centralRoutes } from '@/router/central.routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    ...authCentralRoutes,
    appRoutes,
    centralRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

function resolveGuestRedirect(auth: ReturnType<typeof useAuthStore>, guest: unknown): string {
  if (guest === 'central') {
    return auth.isCentralSession ? 'central-home' : 'home'
  }

  if (auth.isCentralSession) {
    return 'central-home'
  }

  return 'home'
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    const loginRoute = to.meta.requiresCentralSession ? 'login-central' : 'login'
    return { name: loginRoute, query: { redirect: to.fullPath } }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    if (to.name === 'login') {
      auth.clearSession()
      return true
    }

    return { name: resolveGuestRedirect(auth, to.meta.guest) }
  }

  if (to.meta.requiresTenantSession) {
    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (!auth.isTenantSession || !auth.activeTenant) {
      if (auth.isCentralSession) {
        return { name: 'central-home' }
      }

      return { name: 'login' }
    }
  }

  if (to.meta.requiresCentralSession) {
    if (!auth.isAuthenticated) {
      return { name: 'login-central', query: { redirect: to.fullPath } }
    }

    if (auth.isCentralSession && !auth.isSuperuser) {
      auth.clearSession()
      return { name: 'login-central', query: { redirect: to.fullPath } }
    }

    if (!auth.isCentralSession) {
      return auth.isTenantSession ? { name: 'home' } : { name: 'login-central' }
    }

    if (!auth.isSuperuser) {
      return { name: 'login-central' }
    }
  }

  if (to.meta.requiresAdmin && !auth.isPlatformAdmin) {
    return auth.isCentralSession ? { name: 'central-home' } : { name: 'home' }
  }

  if (to.meta.requiresTenantLogoManage && !auth.canManageActiveTenantLogo) {
    return { name: 'home' }
  }

  if (to.meta.requiresTenantAudit && !auth.canViewTenantAudit) {
    return { name: 'home' }
  }

  if (to.meta.requiresSuperuser && !auth.isSuperuser) {
    return { name: 'central-home' }
  }

  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      auth.clearSession()
      return { name: to.meta.requiresCentralSession ? 'login-central' : 'login' }
    }
  }

  return true
})

export default router
