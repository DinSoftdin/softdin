import { api } from '@/services/api'
import type { Tenant, TenantLogoResponse } from '@/types/auth'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export function tenantLogoPublicUrl(slug: string, version = 0): string {
  const query = version > 0 ? `?v=${version}` : ''
  return `${API_BASE}/tenants/${encodeURIComponent(slug)}/logo${query}`
}

export const tenantService = {
  async uploadLogo(tenantId: string, file: File): Promise<TenantLogoResponse> {
    const formData = new FormData()
    formData.append('logo', file)
    const { data } = await api.post<TenantLogoResponse>(
      `/tenants/${encodeURIComponent(tenantId)}/logo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  async deleteLogo(tenantId: string): Promise<TenantLogoResponse> {
    const { data } = await api.delete<TenantLogoResponse>(
      `/tenants/${encodeURIComponent(tenantId)}/logo`,
    )
    return data
  },
}

export function canManageTenantLogo(tenant: Tenant | null, isAdmin: boolean): boolean {
  if (!tenant) {
    return false
  }

  if (isAdmin) {
    return true
  }

  return tenant.role === 'owner' || tenant.role === 'admin'
}

export function applyTenantUpdate(tenants: Tenant[], updated: Tenant): Tenant[] {
  return tenants.map((tenant) => (tenant.id === updated.id ? { ...tenant, ...updated } : tenant))
}
