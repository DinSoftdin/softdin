export interface CentralUser {
  id: number
  name: string
  email: string
  is_admin: boolean
  is_superuser: boolean
  is_platform_admin: boolean
  state: boolean
  has_avatar?: boolean
  pending_activation?: boolean
  tenants_count?: number
  created_at?: string | null
  updated_at?: string | null
}

export interface CentralUsersResponse {
  data: CentralUser[]
}

export interface StoreCentralUserPayload {
  name: string
  email: string
  is_admin?: boolean
  is_superuser?: boolean
  state?: boolean
}

export interface StoreCentralUserOptions {
  photo?: File | null
}

export interface UpdateCentralUserPayload {
  name: string
  email: string
  password?: string
  password_confirmation?: string
  is_admin?: boolean
  is_superuser?: boolean
  state?: boolean
}

export interface UpdateCentralUserOptions {
  photo?: File | null
  removePhoto?: boolean
}

export interface CentralUserAvatarResponse {
  message: string
  user: CentralUser
  avatar_size?: number
}

export interface DeleteCentralUserAvatarResponse {
  message: string
  user: CentralUser
}

export interface ResendCentralUserInvitationResponse {
  message: string
  mail_sent?: boolean
  debug_activation_url?: string
  debug_mail_error?: string
}

export interface CentralUserMutationResponse {
  message: string
  user: CentralUser
  mail_sent?: boolean
  debug_activation_url?: string
  debug_mail_error?: string
}

export interface DeleteCentralUserResponse {
  message: string
}

export interface UserAssignedTenant {
  id: string
  name: string
  slug: string
  status: string
  role: string
}

export interface UserAvailableTenant {
  id: string
  name: string
  slug: string
  status: string
}

export interface UserTenantsResponse {
  user: CentralUser
  tenants: UserAssignedTenant[]
}

export interface UserAvailableTenantsResponse {
  tenants: UserAvailableTenant[]
}

export interface AttachCentralUserTenantPayload {
  tenant_id: string
  role: string
}

export interface AttachCentralUserTenantResponse {
  message: string
  mail_sent?: boolean
  tenant: UserAssignedTenant
}

export interface DetachCentralUserTenantResponse {
  message: string
  mail_sent?: boolean
}
