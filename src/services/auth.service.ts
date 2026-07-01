import { api } from '@/services/api'
import type {
  AuthResponse,
  CentralLoginResponse,
  CentralAdminLoginCredentials,
  LoginCredentials,
  MeResponse,
  ProfilePhotoResponse,
  ProfileUpdateResponse,
  PublicTenantsResponse,
  RegisterPayload,
  RegisterResponse,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  MessageResponse,
  UpdateProfilePayload,
} from '@/types/auth'

export const authService = {
  async fetchPublicTenants(): Promise<PublicTenantsResponse> {
    const { data } = await api.get<PublicTenantsResponse>('/auth/tenants')
    return data
  },

  async register(payload: RegisterPayload, logo?: File | null): Promise<RegisterResponse> {
    if (logo && payload.tenant_mode === 'new') {
      const formData = new FormData()
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
        }
      }
      formData.append('logo', logo)

      const { data } = await api.post<RegisterResponse>('/auth/register', formData, {
        timeout: 180_000,
      })
      return data
    }

    const { data } = await api.post<RegisterResponse>('/auth/register', payload, {
      timeout: 180_000,
    })
    return data
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const { data } = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email })
    return data
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    const { data } = await api.post<MessageResponse>('/auth/reset-password', payload)
    return data
  },

  async centralLogin(email: string, password: string): Promise<CentralLoginResponse> {
    const { data } = await api.post<CentralLoginResponse>('/auth/central-login', {
      email,
      password,
    })
    return data
  },

  async centralAdminLogin(credentials: CentralAdminLoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/central-admin-login', credentials)
    return data
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials)
    return data
  },

  async switchTenant(tenant: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/switch-tenant', { tenant })
    return data
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<ProfileUpdateResponse> {
    const { data } = await api.patch<ProfileUpdateResponse>('/auth/profile', payload)
    return data
  },

  async uploadProfilePhoto(file: File): Promise<ProfilePhotoResponse> {
    const formData = new FormData()
    formData.append('photo', file)
    const { data } = await api.post<ProfilePhotoResponse>('/auth/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async fetchProfilePhoto(): Promise<Blob> {
    const { data } = await api.get<Blob>('/auth/profile/photo', {
      responseType: 'blob',
      headers: { Accept: 'image/*,*/*' },
    })
    return data
  },

  async deleteProfilePhoto(): Promise<ProfilePhotoResponse> {
    const { data } = await api.delete<ProfilePhotoResponse>('/auth/profile/photo')
    return data
  },

  async me(): Promise<MeResponse> {
    const { data } = await api.get<MeResponse>('/auth/me')
    return data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}
