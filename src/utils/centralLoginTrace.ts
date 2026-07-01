import axios from 'axios'
import { api } from '@/services/api'
import { API_BASE_URL, VITE_API_URL_RAW, wasApiBaseUrlNormalized } from '@/config/apiBase'
import type { AuthResponse, CentralAdminLoginCredentials } from '@/types/auth'
import { extractAxiosErrorMessage } from '@/utils/apiError'

export type TraceStepStatus = 'ok' | 'fail' | 'warn'

export interface TraceStep {
  step: number
  status: TraceStepStatus
  title: string
  detail?: string
}

export class CentralLoginTraceError extends Error {
  readonly steps: TraceStep[]

  constructor(message: string, steps: TraceStep[]) {
    super(message)
    this.name = 'CentralLoginTraceError'
    this.steps = steps
  }
}

function apiOrigin(baseUrl: string): string {
  return baseUrl.replace(/\/api\/v\d+\/?$/i, '')
}

function pushStep(
  steps: TraceStep[],
  status: TraceStepStatus,
  title: string,
  detail?: string,
): void {
  steps.push({ step: steps.length + 1, status, title, detail })
}

function describeResponseBody(data: unknown): string {
  if (data === null || data === undefined) {
    return '(cuerpo vacío)'
  }

  if (typeof data === 'string') {
    const trimmed = data.trim()
    if (trimmed.includes('<!DOCTYPE html>') || trimmed.includes('<html')) {
      return 'HTML (probable proxy, SPA o página de error — no JSON Laravel)'
    }

    const preview = trimmed.slice(0, 180).replace(/\s+/g, ' ')
    return preview.length < trimmed.length ? `${preview}…` : preview
  }

  if (typeof data === 'object') {
    try {
      const json = JSON.stringify(data)
      return json.length > 280 ? `${json.slice(0, 280)}…` : json
    } catch {
      return '[objeto no serializable]'
    }
  }

  return String(data)
}

function interpretBackendRejection(fieldErrors: Record<string, string[]>): string {
  const emailMsg = fieldErrors.email?.[0] ?? ''
  const passwordMsg = fieldErrors.password?.[0] ?? ''

  if (passwordMsg) {
    return `Validación Laravel (campo password): ${passwordMsg}`
  }

  if (emailMsg.includes('Credenciales inválidas')) {
    return 'AuthController::centralAdminLogin — usuario inexistente o contraseña incorrecta'
  }

  if (emailMsg.includes('inactiva')) {
    return 'ensureUserCanAuthenticate — cuenta inactiva (state=false)'
  }

  if (emailMsg.includes('no está activada')) {
    return 'ensureUserCanAuthenticate — contraseña no definida (pending_activation)'
  }

  if (emailMsg.includes('superusuarios')) {
    return 'AuthController::centralAdminLogin — el usuario no es superusuario (is_superuser=false)'
  }

  if (emailMsg) {
    return `Validación Laravel (campo email): ${emailMsg}`
  }

  const first = Object.entries(fieldErrors)
    .map(([field, messages]) => `${field}: ${messages[0] ?? ''}`)
    .find(Boolean)

  return first ? `Validación Laravel — ${first}` : 'Validación Laravel — rechazo sin detalle en errors'
}

function failureMessageFromResponse(status: number, data: unknown): string {
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

  if (status === 404) {
    return 'Ruta no encontrada (404). Compruebe VITE_API_URL — debe terminar en /api/v1.'
  }

  return `No se pudo iniciar sesión en SoftDIN Central. (HTTP ${status}).`
}

export function formatTraceSteps(steps: TraceStep[]): string {
  return steps
    .map((item) => {
      const marker =
        item.status === 'ok' ? '✓' : item.status === 'warn' ? '!' : '✗'
      const line = `[PASO ${item.step}] ${marker} ${item.title}`
      return item.detail ? `${line}\n       ${item.detail}` : line
    })
    .join('\n')
}

function describeNetworkError(code: string | undefined, message: string): string {
  if (code === 'ERR_NETWORK') {
    return [
      'ERR_NETWORK — el navegador no pudo completar la petición.',
      'Causas frecuentes:',
      '· Certificado SSL inválido o autofirmado en Traefik/Dokploy',
      '· VITE_API_URL apunta al frontend en lugar de la API',
      '· CORS: falta el dominio del frontend en CORS_ALLOWED_ORIGINS (softdin-api/.env)',
      '· La API no está desplegada o Traefik no enruta /api/v1 al contenedor Laravel',
    ].join('\n       ')
  }

  return `${code ?? 'NETWORK'} — ${message}`
}

export async function centralAdminLoginWithTrace(
  credentials: CentralAdminLoginCredentials,
): Promise<{ data: AuthResponse; steps: TraceStep[] }> {
  const steps: TraceStep[] = []
  const viteRaw = VITE_API_URL_RAW

  if (viteRaw && wasApiBaseUrlNormalized()) {
    pushStep(
      steps,
      'warn',
      'VITE_API_URL sin /api/v1',
      `Valor configurado: ${viteRaw}\n       Se usa automáticamente: ${API_BASE_URL}\n       Recomendado en Dokploy: VITE_API_URL=${apiOrigin(API_BASE_URL)}/api/v1`,
    )
  }

  pushStep(
    steps,
    viteRaw ? 'ok' : 'warn',
    'Configuración frontend (VITE_API_URL)',
    viteRaw
      ? `Efectiva: ${API_BASE_URL}`
      : `No definida — usando fallback ${API_BASE_URL}`,
  )

  const endpoint = `${API_BASE_URL}/auth/central-admin-login`
  pushStep(steps, 'ok', 'Endpoint login central', `POST ${endpoint}`)

  pushStep(
    steps,
    'ok',
    'Cabeceras de la petición',
    'Accept: application/json · Sin Authorization · Sin X-Tenant (ruta exenta en tenancy.php)',
  )

  const origin = apiOrigin(API_BASE_URL)

  try {
    const health = await axios.get(`${origin}/up`, {
      timeout: 10_000,
      validateStatus: () => true,
      headers: { Accept: 'application/json' },
    })

    if (health.status >= 200 && health.status < 300) {
      pushStep(steps, 'ok', 'Conectividad API', `GET ${origin}/up → HTTP ${health.status}`)
    } else {
      pushStep(
        steps,
        'warn',
        'Conectividad API',
        `GET ${origin}/up → HTTP ${health.status} (el host responde pero /up no está OK)`,
      )
    }
  } catch (err) {
    const detail = axios.isAxiosError(err)
      ? err.response
        ? `HTTP ${err.response.status}`
        : describeNetworkError(err.code, err.message)
      : String(err)

    pushStep(steps, 'fail', 'Conectividad API', `GET ${origin}/up → FALLO: ${detail}`)
  }

  pushStep(
    steps,
    'ok',
    'AuthController::centralAdminLogin (servidor)',
    '1) validate email/password → 2) buscar User → 3) ensureUserCanAuthenticate → 4) Hash::check → 5) isSuperuser → 6) createToken',
  )

  let response: { status: number; data: unknown }

  try {
    const axiosResponse = await api.post<AuthResponse>(
      '/auth/central-admin-login',
      {
        email: credentials.email.trim(),
        password: credentials.password,
      },
      { validateStatus: () => true },
    )

    response = { status: axiosResponse.status, data: axiosResponse.data }
  } catch (err) {
    pushStep(
      steps,
      'fail',
      'Petición POST login',
      axios.isAxiosError(err)
        ? err.response
          ? `HTTP ${err.response.status} — ${describeResponseBody(err.response.data)}`
          : describeNetworkError(err.code, err.message)
        : String(err),
    )

    const message = extractAxiosErrorMessage(
      err,
      'No se pudo iniciar sesión en SoftDIN Central.',
    )
    throw new CentralLoginTraceError(message, steps)
  }

  pushStep(
    steps,
    response.status === 200 ? 'ok' : 'fail',
    'Respuesta HTTP',
    `HTTP ${response.status} — ${describeResponseBody(response.data)}`,
  )

  if (response.status === 200) {
    const data = response.data as AuthResponse

    if (!data?.token) {
      pushStep(steps, 'fail', 'Contenido JSON', 'HTTP 200 pero falta token en la respuesta')
      throw new CentralLoginTraceError(
        'La API respondió 200 pero no devolvió token de sesión.',
        steps,
      )
    }

    pushStep(
      steps,
      'ok',
      'Sesión emitida',
      `token=ok · session_mode=${data.session_mode ?? 'central'} · is_superuser=${String(data.user?.is_superuser ?? false)}`,
    )

    return { data, steps }
  }

  if (response.status === 422 && typeof response.data === 'object' && response.data !== null) {
    const payload = response.data as { errors?: Record<string, string[]> }
    if (payload.errors) {
      pushStep(
        steps,
        'fail',
        'Condición no cumplida en el servidor',
        interpretBackendRejection(payload.errors),
      )
    }
  } else if (response.status >= 500) {
    pushStep(
      steps,
      'fail',
      'Error en el servidor',
      'Excepción no controlada en Laravel — revise storage/logs/laravel.log',
    )
  } else if (response.status === 404) {
    pushStep(
      steps,
      'fail',
      'Ruta no encontrada',
      `Verifique que VITE_API_URL sea {APP_URL}/api/v1 (actual: ${API_BASE_URL})`,
    )
  } else if (typeof response.data === 'string') {
    pushStep(
      steps,
      'fail',
      'Formato de respuesta',
      'El servidor no devolvió JSON Laravel — revise proxy, URL o despliegue de la API',
    )
  }

  const message = failureMessageFromResponse(response.status, response.data)
  throw new CentralLoginTraceError(message, steps)
}
