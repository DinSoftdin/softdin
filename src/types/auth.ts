export interface Tenant {
  id: string
  name: string
  slug: string
  database: string
  status: string
  has_logo?: boolean
  role?: string
}

export interface User {
  id: number
  name: string
  email: string
  is_admin?: boolean
  has_avatar?: boolean
}

export interface PublicTenant {
  id: string
  name: string
  slug: string
  has_logo?: boolean
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  tenant_mode: 'new' | 'existing'
  tenant_slug: string
  tenant_name?: string
  tenant_domain?: string
  migrate?: boolean
  seed?: boolean
}

export interface PublicTenantsResponse {
  tenants: PublicTenant[]
}

export interface RegisterResponse {
  message: string
  user: User
}

export interface ForgotPasswordResponse {
  message: string
  debug_reset_url?: string
  debug_mail_error?: string
  debug_mail_hint?: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  password: string
  password_confirmation: string
}

export interface MessageResponse {
  message: string
}

export interface LoginCredentials {
  email: string
  password: string
  tenant: string
}

export interface UpdateProfilePayload {
  name: string
  password?: string
  password_confirmation?: string
  current_password?: string
}

export interface ProfileUpdateResponse {
  user: User
  message: string
}

export interface ProfilePhotoResponse {
  user: User
  message: string
  avatar_size?: number
}

export interface CentralLoginResponse {
  user: User
  tenants: Tenant[]
}

export interface AuthResponse {
  token: string
  user: User
  tenants: Tenant[]
  active_tenant: Tenant | null
}

export interface MeResponse {
  user: User
  tenants: Tenant[]
  active_tenant: Tenant | null
  token_tenant?: Tenant | null
}

export interface TenantLogoResponse {
  tenant: Tenant
  message: string
  logo_size?: number
}
