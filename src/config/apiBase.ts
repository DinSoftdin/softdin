/**
 * URL base de la API. Debe coincidir con APP_URL del servidor + /api/v1
 * (variable VITE_API_URL en softdin/.env o .env.production).
 */
const API_VERSION_SUFFIX = '/api/v1'

function hasApiVersionPath(url: string): boolean {
  return /\/api\/v\d+\/?$/i.test(url)
}

export function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()

  if (configured) {
    const normalized = configured.replace(/\/+$/, '')
    if (hasApiVersionPath(normalized)) {
      return normalized
    }

    return `${normalized}${API_VERSION_SUFFIX}`
  }

  return `http://localhost:8080${API_VERSION_SUFFIX}`
}

/** true si VITE_API_URL no incluía /api/v1 y se normalizó automáticamente */
export function wasApiBaseUrlNormalized(): boolean {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (!configured) {
    return false
  }

  return !hasApiVersionPath(configured.replace(/\/+$/, ''))
}

export const API_BASE_URL = resolveApiBaseUrl()
export const VITE_API_URL_RAW = import.meta.env.VITE_API_URL?.trim() ?? ''
