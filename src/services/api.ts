import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

function isPublicAuthRequest(config: { method?: string; url?: string }): boolean {
  if (config.method?.toLowerCase() !== 'post') {
    return false
  }

  const path = config.url ?? ''

  return (
    path.includes('/auth/login')
    || path.includes('/auth/central-login')
    || path.includes('/auth/central-admin-login')
    || path.includes('/auth/register')
    || path.includes('/auth/forgot-password')
    || path.includes('/auth/reset-password')
  )
}

export function setupApiInterceptors(
  getToken: () => string | null,
  getTenantSlug: () => string | null,
  onUnauthorized: () => void,
  onTenantMismatch?: () => void,
): void {
  api.interceptors.request.use((config) => {
    const token = getToken()
    if (token && !isPublicAuthRequest(config)) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      delete config.headers.Authorization
    }

    const slug = getTenantSlug()
    if (slug) {
      config.headers['X-Tenant'] = slug
    } else {
      delete config.headers['X-Tenant']
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  })

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status
      const message = error.response?.data?.message

      if (status === 401) {
        onUnauthorized()
      }

      if (
        status === 403
        && typeof message === 'string'
        && message.toLowerCase().includes('token')
        && message.toLowerCase().includes('tenant')
        && onTenantMismatch
      ) {
        onTenantMismatch()
      }

      return Promise.reject(error)
    },
  )
}
