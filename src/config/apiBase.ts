/**
 * URL base de la API. Debe coincidir con APP_URL del servidor + /api/v1
 * (variable VITE_API_URL en softdin/.env o .env.production).
 */
export function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()

  if (configured) {
    return configured.replace(/\/+$/, '')
  }

  return 'http://localhost:8080/api/v1'
}

export const API_BASE_URL = resolveApiBaseUrl()
