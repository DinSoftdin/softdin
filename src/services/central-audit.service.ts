import { api } from '@/services/api'
import type {
  CentralAuditEventDetailResponse,
  CentralAuditListFilters,
  CentralAuditListResponse,
} from '@/types/central-audit'

export interface CentralAuditExportResult {
  filename: string
  rows: number
  totalMatching: number
  truncated: boolean
}

function buildAuditQueryParams(filters: CentralAuditListFilters): Record<string, string | number | boolean> {
  return {
    from: filters.from || '',
    to: filters.to || '',
    event_category: filters.event_category || '',
    result: filters.result || '',
    search: filters.search?.trim() || '',
    exclude_reads: filters.exclude_reads ?? true,
    user_id: filters.user_id || '',
    tenant_id: filters.tenant_id || '',
    page: filters.page ?? 1,
    per_page: filters.per_page ?? 25,
  }
}

function parseFilename(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) {
    return fallback
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1])
  }

  const match = contentDisposition.match(/filename="?([^";]+)"?/i)
  return match?.[1] ?? fallback
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const centralAuditService = {
  buildQueryParams(filters: CentralAuditListFilters): Record<string, string | number | boolean> {
    return buildAuditQueryParams(filters)
  },

  async list(filters: CentralAuditListFilters = {}): Promise<CentralAuditListResponse> {
    const params = buildAuditQueryParams(filters)

    const { data } = await api.get<CentralAuditListResponse>('/admin/audit-events', {
      params: {
        page: params.page,
        per_page: params.per_page,
        from: params.from || undefined,
        to: params.to || undefined,
        event_category: params.event_category || undefined,
        result: params.result || undefined,
        search: params.search || undefined,
        exclude_reads: params.exclude_reads,
        user_id: params.user_id || undefined,
        tenant_id: params.tenant_id || undefined,
      },
    })
    return data
  },

  async exportCsv(filters: CentralAuditListFilters = {}): Promise<CentralAuditExportResult> {
    const params = buildAuditQueryParams(filters)

    const response = await api.get<Blob>('/admin/audit-events/export', {
      params: {
        from: params.from || undefined,
        to: params.to || undefined,
        event_category: params.event_category || undefined,
        result: params.result || undefined,
        search: params.search || undefined,
        exclude_reads: params.exclude_reads,
        user_id: params.user_id || undefined,
        tenant_id: params.tenant_id || undefined,
      },
      responseType: 'blob',
    })

    const rawContentType = response.headers['content-type']
    const contentType = typeof rawContentType === 'string' ? rawContentType : ''
    if (contentType.includes('application/json')) {
      const text = await response.data.text()
      const payload = JSON.parse(text) as { message?: string }
      throw new Error(payload.message ?? 'No se pudo exportar la auditoría.')
    }

    const fallbackName = `auditoria-central-${new Date().toISOString().slice(0, 10)}.csv`
    const filename = parseFilename(response.headers['content-disposition'], fallbackName)
    triggerBlobDownload(response.data, filename)

    return {
      filename,
      rows: Number(response.headers['x-export-rows'] ?? 0),
      totalMatching: Number(response.headers['x-export-total-matching'] ?? 0),
      truncated: response.headers['x-export-truncated'] === '1',
    }
  },

  async fetchEvent(eventId: string): Promise<CentralAuditEventDetailResponse> {
    const { data } = await api.get<CentralAuditEventDetailResponse>(
      `/admin/audit-events/${encodeURIComponent(eventId)}`,
    )
    return data
  },
}
