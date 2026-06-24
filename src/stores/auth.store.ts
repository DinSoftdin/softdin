import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authService } from '@/services/auth.service'
import {
  applyTenantUpdate,
  canManageTenantLogo,
  tenantLogoPublicUrl,
  tenantService,
} from '@/services/tenant.service'
import type {
  CentralAdminLoginCredentials,
  LoginCredentials,
  Tenant,
  UpdateProfilePayload,
  User,
} from '@/types/auth'

export type SessionMode = 'tenant' | 'central'

const STORAGE_KEY = 'softdin_auth'

interface StoredAuth {
  token: string
  user: User
  tenants: Tenant[]
  activeTenant: Tenant | null
  sessionMode: SessionMode | null
}

function readStorage(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredAuth) : null
  } catch {
    return null
  }
}

function writeStorage(data: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function removeStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export const useAuthStore = defineStore('auth', () => {
  const stored = readStorage()

  const token = ref<string | null>(stored?.token ?? null)
  const user = ref<User | null>(stored?.user ?? null)
  const tenants = ref<Tenant[]>(stored?.tenants ?? [])
  const activeTenant = ref<Tenant | null>(stored?.activeTenant ?? null)
  const sessionMode = ref<SessionMode | null>(
    stored?.sessionMode ?? (stored?.activeTenant ? 'tenant' : null),
  )
  const loading = ref(false)
  const avatarUrl = ref<string | null>(null)
  const tenantLogoVersion = ref(0)

  const isAuthenticated = computed(() => Boolean(token.value))
  const isCentralSession = computed(() => sessionMode.value === 'central')
  const isTenantSession = computed(() => sessionMode.value === 'tenant')
  const isSuperuser = computed(() => Boolean(user.value?.is_superuser))
  const isAdmin = computed(() => Boolean(user.value?.is_admin))
  const isPlatformAdmin = computed(
    () =>
      Boolean(
        user.value?.is_platform_admin ?? user.value?.is_superuser ?? user.value?.is_admin,
      ),
  )
  const platformRoleLabel = computed(() => {
    if (isSuperuser.value) {
      return 'Superusuario'
    }

    if (isAdmin.value) {
      return 'Admin cliente'
    }

    return null
  })
  const hasMultipleTenants = computed(() => tenants.value.length > 1)
  const canManageActiveTenantLogo = computed(() =>
    canManageTenantLogo(activeTenant.value, user.value),
  )
  const tenantLogoUrl = computed(() => {
    const tenant = activeTenant.value
    if (!tenant?.has_logo) {
      return null
    }

    return tenantLogoPublicUrl(tenant.slug, tenantLogoVersion.value)
  })

  function revokeAvatarUrl(): void {
    if (avatarUrl.value) {
      URL.revokeObjectURL(avatarUrl.value)
      avatarUrl.value = null
    }
  }

  function persist(): void {
    if (!token.value || !user.value) {
      return
    }

    writeStorage({
      token: token.value,
      user: user.value,
      tenants: tenants.value,
      activeTenant: activeTenant.value,
      sessionMode: sessionMode.value,
    })
  }

  function setSession(data: {
    token: string
    user: User
    tenants: Tenant[]
    activeTenant: Tenant | null
    sessionMode: SessionMode | null
  }): void {
    token.value = data.token
    user.value = data.user
    tenants.value = data.tenants
    activeTenant.value = data.activeTenant
    sessionMode.value = data.sessionMode
    persist()
    void loadAvatar()
  }

  function clearSession(): void {
    revokeAvatarUrl()
    tenantLogoVersion.value = 0
    token.value = null
    user.value = null
    tenants.value = []
    activeTenant.value = null
    sessionMode.value = null
    removeStorage()
  }

  async function loadAvatar(): Promise<void> {
    revokeAvatarUrl()

    if (!token.value || !user.value?.has_avatar) {
      return
    }

    try {
      const blob = await authService.fetchProfilePhoto()
      avatarUrl.value = URL.createObjectURL(blob)
    } catch {
      avatarUrl.value = null
    }
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true
    try {
      const data = await authService.login(credentials)
      setSession({
        token: data.token,
        user: data.user,
        tenants: data.tenants,
        activeTenant: data.active_tenant,
        sessionMode: data.session_mode ?? (data.active_tenant ? 'tenant' : null),
      })
    } finally {
      loading.value = false
    }
  }

  async function loginCentral(credentials: CentralAdminLoginCredentials): Promise<void> {
    loading.value = true
    try {
      const data = await authService.centralAdminLogin(credentials)
      setSession({
        token: data.token,
        user: data.user,
        tenants: data.tenants,
        activeTenant: null,
        sessionMode: data.session_mode ?? 'central',
      })
    } finally {
      loading.value = false
    }
  }

  async function fetchMe(): Promise<void> {
    if (!token.value) {
      return
    }

    const data = await authService.me()
    user.value = data.user
    tenants.value = data.tenants
    activeTenant.value = data.active_tenant
    sessionMode.value = data.session_mode ?? (data.active_tenant ? 'tenant' : null)

    if (sessionMode.value === 'central' && !data.user.is_superuser) {
      sessionMode.value = null
    }

    persist()
    await loadAvatar()
  }

  async function switchTenant(tenantSlug: string): Promise<void> {
    if (!token.value) {
      throw new Error('No hay sesión activa.')
    }

    if (activeTenant.value?.slug === tenantSlug) {
      return
    }

    const previousToken = token.value
    loading.value = true

    try {
      const data = await authService.switchTenant(tenantSlug)

      if (!data.token || !data.active_tenant) {
        throw new Error('No se recibió un token válido para el nuevo cliente.')
      }

      if (data.active_tenant.slug !== tenantSlug) {
        throw new Error('El cliente activo no coincide con el seleccionado.')
      }

      if (data.token === previousToken) {
        throw new Error('El token no fue renovado al cambiar de cliente.')
      }

      setSession({
        token: data.token,
        user: data.user,
        tenants: data.tenants,
        activeTenant: data.active_tenant,
        sessionMode: 'tenant',
      })
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
    const data = await authService.updateProfile(payload)
    user.value = data.user
    persist()
  }

  async function uploadProfilePhoto(file: File): Promise<void> {
    const data = await authService.uploadProfilePhoto(file)
    user.value = data.user
    persist()
    await loadAvatar()
  }

  function syncTenant(updated: Tenant): void {
    tenants.value = applyTenantUpdate(tenants.value, updated)

    if (activeTenant.value?.id === updated.id) {
      activeTenant.value = { ...activeTenant.value, ...updated }
    }

    persist()
  }

  function bumpTenantLogoVersion(): void {
    tenantLogoVersion.value += 1
  }

  async function uploadTenantLogo(file: File): Promise<void> {
    const tenant = activeTenant.value
    if (!tenant) {
      throw new Error('No hay un cliente activo.')
    }

    const data = await tenantService.uploadLogo(tenant.id, file)
    syncTenant(data.tenant)
    bumpTenantLogoVersion()
  }

  async function deleteTenantLogo(): Promise<void> {
    const tenant = activeTenant.value
    if (!tenant) {
      throw new Error('No hay un cliente activo.')
    }

    const data = await tenantService.deleteLogo(tenant.id)
    syncTenant(data.tenant)
    bumpTenantLogoVersion()
  }

  async function deleteProfilePhoto(): Promise<void> {
    const data = await authService.deleteProfilePhoto()
    user.value = data.user
    persist()
    revokeAvatarUrl()
  }

  async function logout(): Promise<void> {
    try {
      if (token.value) {
        await authService.logout()
      }
    } catch {
      // Sesión ya inválida en servidor.
    } finally {
      clearSession()
    }
  }

  return {
    token,
    user,
    tenants,
    activeTenant,
    sessionMode,
    avatarUrl,
    tenantLogoUrl,
    tenantLogoVersion,
    loading,
    isAuthenticated,
    isCentralSession,
    isTenantSession,
    isSuperuser,
    isAdmin,
    isPlatformAdmin,
    platformRoleLabel,
    hasMultipleTenants,
    canManageActiveTenantLogo,
    login,
    loginCentral,
    logout,
    fetchMe,
    loadAvatar,
    switchTenant,
    updateProfile,
    uploadProfilePhoto,
    deleteProfilePhoto,
    uploadTenantLogo,
    deleteTenantLogo,
    bumpTenantLogoVersion,
    clearSession,
    setSession,
  }
})
