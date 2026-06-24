import { api } from '@/services/api'
import type { CentralDashboardStats } from '@/types/central-dashboard'

export const centralDashboardService = {
  async fetchStats(): Promise<CentralDashboardStats> {
    const { data } = await api.get<CentralDashboardStats>('/admin/dashboard')
    return data
  },
}
