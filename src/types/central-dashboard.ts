export interface CentralDashboardKpis {
  tenants_total: number
  tenants_active: number
  users_total: number
  users_active: number
  users_pending_activation: number
  tenants_created_this_month: number
  audit_events_last_24h: number
}

export interface CentralDashboardSparklinePoint {
  date: string
  value: number
}

export interface CentralDashboardSparklines {
  tenants_active: CentralDashboardSparklinePoint[]
  users_active: CentralDashboardSparklinePoint[]
  users_pending_activation: CentralDashboardSparklinePoint[]
  audit_events: CentralDashboardSparklinePoint[]
}

export interface CentralDashboardTopTenant {
  id: string
  name: string
  slug: string
  users_count: number
}

export interface CentralDashboardStatusSlice {
  status: string
  label: string
  count: number
}

export interface CentralDashboardMonthBar {
  month: string
  label: string
  count: number
}

export interface CentralDashboardAuditResult {
  result: string
  label: string
  count: number
}

export interface CentralDashboardActivityItem {
  id: string
  occurred_at: string
  event_category: string
  category_label: string
  result: string
  actor_label: string | null
  request_path: string | null
  http_method: string | null
}

export interface CentralDashboardStats {
  kpis: CentralDashboardKpis
  tenants_by_status: CentralDashboardStatusSlice[]
  tenants_created_by_month: CentralDashboardMonthBar[]
  top_tenants_by_users: CentralDashboardTopTenant[]
  sparklines: CentralDashboardSparklines
  audit_results_last_7_days: CentralDashboardAuditResult[]
  recent_activity: CentralDashboardActivityItem[]
  generated_at: string
}

export interface ChartSegment {
  key: string
  label: string
  count: number
  color: string
}
