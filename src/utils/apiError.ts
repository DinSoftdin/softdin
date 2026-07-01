import axios from 'axios'

export function extractAxiosErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return 'Error de conexión con el servidor.'
  }

  if (!error.response) {
    if (error.code === 'ERR_NETWORK') {
      return 'No hay respuesta del servidor (ERR_NETWORK). Revise certificado SSL, VITE_API_URL con /api/v1, CORS_ALLOWED_ORIGINS y que la API esté desplegada.'
    }

    return 'No hay respuesta del servidor. Compruebe VITE_API_URL, que la API esté en ejecución y accesible desde el navegador.'
  }

  const status = error.response.status
  const data = error.response.data

  if (typeof data === 'object' && data !== null) {
    const payload = data as { message?: string; errors?: Record<string, string[]> }
    const firstFieldError = payload.errors
      ? Object.values(payload.errors).flat()[0]
      : undefined

    if (firstFieldError) {
      return firstFieldError
    }

    if (typeof payload.message === 'string' && payload.message.trim() !== '') {
      return payload.message
    }
  }

  if (status === 500) {
    return 'Error interno del servidor. Revise storage/logs/laravel.log en softdin-api.'
  }

  if (status === 503) {
    return 'El servicio no está disponible en este momento.'
  }

  if (status === 419) {
    return 'La sesión expiró. Recargue la página e intente de nuevo.'
  }

  if (typeof data === 'string' && data.trim() !== '') {
    if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
      return `${fallback} (HTTP ${status}: el servidor respondió HTML, no JSON).`
    }

    return fallback
  }

  return `${fallback} (HTTP ${status}).`
}
