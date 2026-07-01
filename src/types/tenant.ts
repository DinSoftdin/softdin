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
  has_avatar?: boolean
  is_superuser?: boolean
  is_platform_admin?: boolean
}

export interface TenantAvailableUser {
  id: number
  name: string
  email: string
  has_avatar?: boolean
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
  role?: string
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

export type TenantServiceType = 'rrhh' | 'sgi'

export interface TenantServiceTypesMap {
  rrhh: boolean
  sgi: boolean
}

export interface CentralTenantData {
  service_types?: TenantServiceTypesMap | TenantServiceType[]
}

export interface UpdateCentralTenantPayload {
  name: string
  slug: string
  status: string
  domain: string
  service_types?: TenantServiceTypesMap
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

export interface TenantDatabaseStatusResponse {
  database: string
  database_exists: boolean
  database_created: boolean
  provisioned_at?: string | null
}

export interface TenantDatabaseProvisionResponse {
  message: string
  async?: boolean
  provision: {
    database: string
    database_created: boolean
    migrated: boolean
    seeded: boolean
    database_exists?: boolean
  }
  tenant: CentralTenant
  progress?: TenantProvisionProgress
}

export type TenantProvisionStatus = 'idle' | 'running' | 'completed' | 'failed'

export interface TenantProvisionProgress {
  status: TenantProvisionStatus
  phase: string | null
  current: number
  total: number
  file: string | null
  percent: number
  message: string | null
  error: string | null
  started_at?: string | null
  finished_at?: string | null
  result?: {
    database: string
    database_created: boolean
    migrated: boolean
    seeded: boolean
  } | null
}

export interface TenantDatabaseProvisionStartResponse {
  message: string
  async: boolean
  progress: TenantProvisionProgress
}

export interface TenantDatabaseProvisionProgressResponse {
  message?: string
  progress: TenantProvisionProgress
  database: string
  database_exists: boolean
  provision?: TenantDatabaseProvisionResponse['provision']
  tenant?: CentralTenant
}

export interface TenantDatabaseDropResponse {
  message: string
  deletion: {
    database: string
    database_dropped: boolean
    database_exists: boolean
  }
  tenant: CentralTenant
}

export interface CentralTenant {
  id: string
  name: string
  slug: string
  database: string
  status: string
  has_logo?: boolean
  users_count?: number
  data?: CentralTenantData | null
  domains?: TenantDomain[]
  created_at?: string | null
  updated_at?: string | null
}

export interface CentralTenantsResponse {
  data: CentralTenant[]
}

export interface TenantServiceTypeOption {
  value: TenantServiceType
  label: string
  /** Permite marcar el módulo en el formulario (selección múltiple). */
  selectable: boolean
  /** Permite crear/eliminar la BD operacional del módulo. */
  provisionable: boolean
  comingSoon?: boolean
}

export const TENANT_SERVICE_TYPE_OPTIONS: readonly TenantServiceTypeOption[] = [
  { value: 'rrhh', label: 'RRHH', selectable: true, provisionable: true },
  { value: 'sgi', label: 'SGI', selectable: true, provisionable: false, comingSoon: true },
]
