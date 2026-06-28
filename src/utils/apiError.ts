import axios from 'axios'

export function extractAxiosErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return 'Error de conexión con el servidor.'
  }

  const status = error.response?.status
  const data = error.response?.data

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
    return 'Error interno del servidor. Compruebe que la API esté en ejecución y revise storage/logs/laravel.log.'
  }

  if (status === 503) {
    return 'El servicio no está disponible en este momento.'
  }

  if (status === 419) {
    return 'La sesión expiró. Recargue la página e intente de nuevo.'
  }

  if (typeof data === 'string' && data.trim() !== '') {
    return fallback
  }

  return fallback
}
