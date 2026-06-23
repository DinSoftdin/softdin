import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { applyTenantDocumentBranding, resetDocumentBranding } from '@/utils/documentBranding'

export function useTenantDocumentBranding(): void {
  const auth = useAuthStore()
  const route = useRoute()

  function syncBranding(): void {
    const pageTitle = typeof route.meta.title === 'string' ? route.meta.title : null
    const isGuestRoute = Boolean(route.meta.guest)

    if (!auth.isAuthenticated || isGuestRoute || !auth.activeTenant) {
      resetDocumentBranding()
      return
    }

    applyTenantDocumentBranding(auth.activeTenant, pageTitle, auth.tenantLogoVersion)
  }

  watch(
    () => [
      auth.isAuthenticated,
      auth.activeTenant?.id,
      auth.activeTenant?.slug,
      auth.activeTenant?.has_logo,
      auth.tenantLogoVersion,
      route.meta.title,
      route.meta.guest,
      route.name,
    ],
    () => syncBranding(),
    { immediate: true },
  )
}
