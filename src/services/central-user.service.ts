import { api } from '@/services/api'
import type {
  AttachCentralUserTenantPayload,
  AttachCentralUserTenantResponse,
  CentralUser,
  CentralUserAvatarResponse,
  CentralUserMutationResponse,
  CentralUsersResponse,
  DeleteCentralUserAvatarResponse,
  DeleteCentralUserResponse,
  DetachCentralUserTenantResponse,
  ResendCentralUserInvitationResponse,
  StoreCentralUserOptions,
  StoreCentralUserPayload,
  UpdateCentralUserOptions,
  UpdateCentralUserPayload,
  UserAvailableTenantsResponse,
  UserTenantsResponse,
} from '@/types/central-user'

function appendBoolean(formData: FormData, key: string, value: boolean | undefined): void {
  if (value === undefined) {
    return
  }

  formData.append(key, value ? '1' : '0')
}

function buildUserFormData(
  payload: StoreCentralUserPayload | UpdateCentralUserPayload,
  options?: { photo?: File | null; removePhoto?: boolean },
): FormData {
  const formData = new FormData()
  formData.append('name', payload.name)
  formData.append('email', payload.email)
  appendBoolean(formData, 'is_admin', payload.is_admin)
  appendBoolean(formData, 'is_superuser', payload.is_superuser)
  appendBoolean(formData, 'state', payload.state)

  if ('password' in payload && payload.password) {
    formData.append('password', payload.password)
    if (payload.password_confirmation) {
      formData.append('password_confirmation', payload.password_confirmation)
    }
  }

  if (options?.removePhoto) {
    formData.append('remove_photo', '1')
  }

  if (options?.photo) {
    formData.append('photo', options.photo)
  }

  return formData
}

export const centralUserService = {
  async list(search = ''): Promise<CentralUser[]> {
    const { data } = await api.get<CentralUsersResponse>('/admin/users', {
      params: search.trim() ? { search: search.trim() } : undefined,
    })
    return data.data
  },

  async create(
    payload: StoreCentralUserPayload,
    options?: StoreCentralUserOptions,
  ): Promise<CentralUserMutationResponse> {
    if (options?.photo) {
      const formData = buildUserFormData(payload, { photo: options.photo })
      const { data } = await api.post<CentralUserMutationResponse>('/admin/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    }

    const { data } = await api.post<CentralUserMutationResponse>('/admin/users', payload)
    return data
  },

  async update(
    userId: number,
    payload: UpdateCentralUserPayload,
    options?: UpdateCentralUserOptions,
  ): Promise<CentralUserMutationResponse> {
    if (options?.photo || options?.removePhoto) {
      const formData = buildUserFormData(payload, {
        photo: options.photo,
        removePhoto: options.removePhoto,
      })
      const { data } = await api.post<CentralUserMutationResponse>(
        `/admin/users/${userId}?_method=PATCH`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return data
    }

    const { data } = await api.patch<CentralUserMutationResponse>(
      `/admin/users/${userId}`,
      payload,
    )
    return data
  },

  async delete(userId: number): Promise<DeleteCentralUserResponse> {
    const { data } = await api.delete<DeleteCentralUserResponse>(`/admin/users/${userId}`)
    return data
  },

  async resendInvitation(userId: number): Promise<ResendCentralUserInvitationResponse> {
    const { data } = await api.post<ResendCentralUserInvitationResponse>(
      `/admin/users/${userId}/resend-invitation`,
    )
    return data
  },

  async fetchTenants(userId: number): Promise<UserTenantsResponse> {
    const { data } = await api.get<UserTenantsResponse>(`/admin/users/${userId}/tenants`)
    return data
  },

  async fetchAvailableTenants(userId: number, search = ''): Promise<UserAvailableTenantsResponse> {
    const { data } = await api.get<UserAvailableTenantsResponse>(
      `/admin/users/${userId}/tenants/available`,
      { params: search.trim() ? { search: search.trim() } : undefined },
    )
    return data
  },

  async attachTenant(
    userId: number,
    payload: AttachCentralUserTenantPayload,
  ): Promise<AttachCentralUserTenantResponse> {
    const { data } = await api.post<AttachCentralUserTenantResponse>(
      `/admin/users/${userId}/tenants`,
      payload,
    )
    return data
  },

  async detachTenant(userId: number, tenantId: string): Promise<DetachCentralUserTenantResponse> {
    const { data } = await api.delete<DetachCentralUserTenantResponse>(
      `/admin/users/${userId}/tenants/${encodeURIComponent(tenantId)}`,
    )
    return data
  },

  async fetchAvatar(userId: number): Promise<Blob> {
    const { data } = await api.get<Blob>(`/admin/users/${userId}/avatar`, {
      responseType: 'blob',
    })
    return data
  },

  async uploadAvatar(userId: number, file: File): Promise<CentralUserAvatarResponse> {
    const formData = new FormData()
    formData.append('photo', file)
    const { data } = await api.post<CentralUserAvatarResponse>(
      `/admin/users/${userId}/avatar`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  async deleteAvatar(userId: number): Promise<DeleteCentralUserAvatarResponse> {
    const { data } = await api.delete<DeleteCentralUserAvatarResponse>(
      `/admin/users/${userId}/avatar`,
    )
    return data
  },
}
