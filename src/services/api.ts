import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export function setupApiInterceptors(
  getToken: () => string | null,
  getTenantSlug: () => string | null,
  onUnauthorized: () => void,
  onTenantMismatch?: () => void,
): void {
  api.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
