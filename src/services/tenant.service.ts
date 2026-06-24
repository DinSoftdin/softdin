import { api } from '@/services/api'
import type { Tenant, TenantLogoResponse } from '@/types/auth'
import type {
  AttachCentralTenantUserPayload,
  AttachCentralTenantUserResponse,
  CentralTenant,
  CentralTenantsResponse,
  CreateCentralTenantOptions,
  CreateCentralTenantPayload,
  CreateCentralTenantResponse,
  DeleteCentralTenantResponse,
  DetachCentralTenantUserResponse,
  TenantAvailableUsersResponse,
  TenantUsersResponse,
  UpdateCentralTenantOptions,
  UpdateCentralTenantPayload,
  UpdateCentralTenantResponse,
} from '@/types/tenant'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export function tenantLogoPublicUrl(slug: string, version = 0): string {
  const query = version > 0 ? `?v=${version}` : ''
  return `${API_BASE}/tenants/${encodeURIComponent(slug)}/logo${query}`
}

function appendBoolean(formData: FormData, key: string, value: boolean | undefined): void {
  if (value === undefined) {
    return
  }

  formData.append(key, value ? '1' : '0')
}

function buildTenantFormData(
  payload: CreateCentralTenantPayload | UpdateCentralTenantPayload,
  options?: { logo?: File | null; removeLogo?: boolean },
): FormData {
  const formData = new FormData()
  formData.append('name', payload.name)
  formData.append('slug', payload.slug)

  if ('status' in payload) {
    formData.append('status', payload.status)
    formData.append('domain', payload.domain)
  } else {
    appendBoolean(formData, 'migrate', payload.migrate ?? true)
    appendBoolean(formData, 'seed', payload.seed ?? true)

    if (payload.domain) {
      formData.append('domain', payload.domain)
    }

    if (payload.database) {
      formData.append('database', payload.database)
    }

    if (payload.owner_email) {
      formData.append('owner_email', payload.owner_email)
    }

    if (payload.owner_role) {
      formData.append('owner_role', payload.owner_role)
    }
  }

  if (options?.removeLogo) {
    formData.append('remove_logo', '1')
  }

  if (options?.logo) {
    formData.append('logo', options.logo)
  }

  return formData
}

export const tenantService = {
  async listCentral(): Promise<CentralTenant[]> {
    const { data } = await api.get<CentralTenantsResponse>('/tenants')
    return data.data
  },

  async fetchCentralUsers(tenantId: string): Promise<TenantUsersResponse> {
    const { data } = await api.get<TenantUsersResponse>(
      `/admin/tenants/${encodeURIComponent(tenantId)}/users`,
    )
    return data
  },

  async fetchCentralAvailableUsers(tenantId: string, search = ''): Promise<TenantAvailableUsersResponse> {
    const { data } = await api.get<TenantAvailableUsersResponse>(
      `/admin/tenants/${encodeURIComponent(tenantId)}/users/available`,
      { params: search.trim() ? { search: search.trim() } : undefined },
    )
    return data
  },

  async attachCentralUser(
    tenantId: string,
    payload: AttachCentralTenantUserPayload,
  ): Promise<AttachCentralTenantUserResponse> {
    const { data } = await api.post<AttachCentralTenantUserResponse>(
      `/admin/tenants/${encodeURIComponent(tenantId)}/users`,
      payload,
    )
    return data
  },

  async detachCentralUser(tenantId: string, userId: number): Promise<DetachCentralTenantUserResponse> {
    const { data } = await api.delete<DetachCentralTenantUserResponse>(
      `/admin/tenants/${encodeURIComponent(tenantId)}/users/${userId}`,
    )
    return data
  },

  async createCentral(
    payload: CreateCentralTenantPayload,
    options?: CreateCentralTenantOptions,
  ): Promise<CreateCentralTenantResponse> {
    if (options?.logo) {
      const formData = buildTenantFormData(payload, { logo: options.logo })
      const { data } = await api.post<CreateCentralTenantResponse>('/admin/tenants', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    }

    const { data } = await api.post<CreateCentralTenantResponse>('/admin/tenants', {
      ...payload,
      migrate: payload.migrate ?? true,
      seed: payload.seed ?? true,
    })
    return data
  },

  async updateCentral(
    tenantId: string,
    payload: UpdateCentralTenantPayload,
    options?: UpdateCentralTenantOptions,
  ): Promise<UpdateCentralTenantResponse> {
    if (options?.logo || options?.removeLogo) {
      const formData = buildTenantFormData(payload, {
        logo: options.logo,
        removeLogo: options.removeLogo,
      })
      const { data } = await api.post<UpdateCentralTenantResponse>(
        `/admin/tenants/${encodeURIComponent(tenantId)}?_method=PATCH`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return data
    }

    const { data } = await api.patch<UpdateCentralTenantResponse>(
      `/admin/tenants/${encodeURIComponent(tenantId)}`,
      payload,
    )
    return data
  },

  async deleteCentral(tenantId: string): Promise<DeleteCentralTenantResponse> {
    const { data } = await api.delete<DeleteCentralTenantResponse>(
      `/admin/tenants/${encodeURIComponent(tenantId)}`,
    )
    return data
  },

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

export function canManageTenantLogo(tenant: Tenant | null, isPlatformAdmin: boolean): boolean {
  if (!tenant) {
    return false
  }

  if (isPlatformAdmin) {
    return true
  }

  return tenant.role === 'owner' || tenant.role === 'admin'
}

export function applyTenantUpdate(tenants: Tenant[], updated: Tenant): Tenant[] {
  return tenants.map((tenant) => (tenant.id === updated.id ? { ...tenant, ...updated } : tenant))
}

