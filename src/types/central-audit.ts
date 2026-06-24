export interface CentralAuditFieldChange {
  id: number
  audit_event_id: string
  field_path: string
  field_label?: string
  old_value: string | null
  new_value: string | null
  old_value_label?: string
  new_value_label?: string
  value_type: string | null
}

export interface CentralAuditEventDetail {
  id: string
  occurred_at: string
  event_category: string
  category_label?: string
  result: string
  http_status: number | null
  http_method: string | null
  request_path: string | null
  actor_label: string | null
  actor_id: string | null
  duration_ms: number | null
  error_summary: string | null
  entity_label?: string
  changes_summary?: string
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  changed_field_paths: string[] | null
}

export interface CentralAuditEventDetailResponse {
  event: CentralAuditEventDetail
  field_changes: CentralAuditFieldChange[]
}

export interface CentralAuditListItem {
  id: string
  occurred_at: string
  event_category: string
  category_label: string
  result: string
  actor_label: string | null
  http_method: string | null
  request_path: string | null
  http_status: number | null
  duration_ms: number | null
  error_summary: string | null
  entity_label: string
  changes_summary: string
}

export interface CentralAuditListFilters {
  page?: number
  per_page?: number
  from?: string
  to?: string
  event_category?: string
  result?: string
  search?: string
  exclude_reads?: boolean
  user_id?: string
  tenant_id?: string
}

export interface CentralAuditListResponse {
  data: CentralAuditListItem[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

export const CENTRAL_AUDIT_CATEGORY_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'central.api.create', label: 'Creaciones' },
  { value: 'central.api.update', label: 'Actualizaciones' },
  { value: 'central.api.delete', label: 'Eliminaciones' },
  { value: 'central.auth.login', label: 'Accesos (login)' },
] as const

export const CENTRAL_AUDIT_RESULT_OPTIONS = [
  { value: '', label: 'Todos los resultados' },
  { value: 'success', label: 'Éxito' },
  { value: 'failure', label: 'Fallo' },
  { value: 'pending', label: 'Pendiente' },
] as const
