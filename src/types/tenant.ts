export interface TenantDomain {
  id: string
  domain: string
  is_primary: boolean
}

export interface TenantAssignedUser {
  id: number
  name: string
  email: string
  role: string
  is_superuser?: boolean
  is_platform_admin?: boolean
}

export interface TenantAvailableUser {
  id: number
  name: string
  email: string
  is_superuser?: boolean
  is_platform_admin?: boolean
}

export interface TenantUsersResponse {
  tenant: CentralTenant
  users: TenantAssignedUser[]
}

export interface TenantAvailableUsersResponse {
  users: TenantAvailableUser[]
}

export interface AttachCentralTenantUserPayload {
  user_id: number
  role: string
}

export interface AttachCentralTenantUserResponse {
  message: string
  user: TenantAssignedUser
}

export interface DetachCentralTenantUserResponse {
  message: string
}

export interface CreateCentralTenantOptions {
  logo?: File | null
}

export interface UpdateCentralTenantOptions {
  logo?: File | null
  removeLogo?: boolean
}

export interface CreateCentralTenantPayload {
  name: string
  slug: string
  domain?: string
  database?: string
  owner_email?: string
  owner_role?: string
  migrate?: boolean
  seed?: boolean
}

export interface CreateCentralTenantResponse {
  message: string
  tenant: CentralTenant
  provision: {
    database: string
    database_created: boolean
    migrated: boolean
    seeded: boolean
    tenancy_mode?: string
    tenant_header?: string
  }
}

export interface UpdateCentralTenantPayload {
  name: string
  slug: string
  status: string
  domain: string
}

export interface UpdateCentralTenantResponse {
  message: string
  tenant: CentralTenant
}

export interface DeleteCentralTenantResponse {
  message: string
  deletion: {
    database: string
    database_dropped: boolean
    slug?: string
  }
}

export interface CentralTenant {
  id: string
  name: string
  slug: string
  database: string
  status: string
  has_logo?: boolean
  users_count?: number
  domains?: TenantDomain[]
  created_at?: string | null
  updated_at?: string | null
}

export interface CentralTenantsResponse {
  data: CentralTenant[]
}
