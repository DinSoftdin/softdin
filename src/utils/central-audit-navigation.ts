import type { RouteLocationRaw } from 'vue-router'

export interface CentralAuditHistoryUserContext {
  id: number
  name: string
}

export interface CentralAuditHistoryTenantContext {
  id: string
  name: string
}

export function centralAuditRouteForUser(user: CentralAuditHistoryUserContext): RouteLocationRaw {
  return {
    name: 'admin-audit',
    query: {
      user_id: String(user.id),
      user_name: user.name,
    },
  }
}

export function centralAuditRouteForTenant(tenant: CentralAuditHistoryTenantContext): RouteLocationRaw {
  return {
    name: 'admin-audit',
    query: {
      tenant_id: tenant.id,
      tenant_name: tenant.name,
    },
  }
}

export function centralAuditContextFromQuery(query: Record<string, unknown>): {
  userId: string | null
  userName: string | null
  tenantId: string | null
  tenantName: string | null
  label: string | null
} {
  const userId = typeof query.user_id === 'string' && query.user_id.trim() !== ''
    ? query.user_id.trim()
    : null
  const userName = typeof query.user_name === 'string' && query.user_name.trim() !== ''
    ? query.user_name.trim()
    : null
  const tenantId = typeof query.tenant_id === 'string' && query.tenant_id.trim() !== ''
    ? query.tenant_id.trim()
    : null
  const tenantName = typeof query.tenant_name === 'string' && query.tenant_name.trim() !== ''
    ? query.tenant_name.trim()
    : null

  let label: string | null = null

  if (userId) {
    label = userName ? `Historial del usuario «${userName}»` : `Historial del usuario #${userId}`
  } else if (tenantId) {
    label = tenantName ? `Historial del cliente «${tenantName}»` : `Historial del cliente`
  }

  return { userId, userName, tenantName, tenantId, label }
}
