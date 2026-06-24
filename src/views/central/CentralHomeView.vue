<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { centralMenuItems } from '@/config/centralMenu'
import { centralDashboardService } from '@/services/central-dashboard.service'
import { useAuthStore } from '@/stores/auth.store'
import type { CentralDashboardStats, ChartSegment } from '@/types/central-dashboard'
import CentralActivityFeed from '@/views/central/components/dashboard/CentralActivityFeed.vue'
import CentralAuditEventModal from '@/views/central/components/dashboard/CentralAuditEventModal.vue'
import CentralBarChart from '@/views/central/components/dashboard/CentralBarChart.vue'
import CentralDonutChart from '@/views/central/components/dashboard/CentralDonutChart.vue'
import CentralHorizontalBarChart from '@/views/central/components/dashboard/CentralHorizontalBarChart.vue'
import CentralKpiCard from '@/views/central/components/dashboard/CentralKpiCard.vue'

const auth = useAuthStore()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const stats = ref<CentralDashboardStats | null>(null)
const auditModalOpen = ref(false)
const selectedAuditEventId = ref<string | null>(null)

const quickLinks = computed(() =>
  centralMenuItems.filter(
    (item) => item.routeName !== 'central-home' && (!item.requiresSuperuser || auth.isSuperuser),
  ),
)

const tenantStatusSegments = computed<ChartSegment[]>(() => {
  const palette: Record<string, string> = {
    active: '#16a34a',
    suspended: '#f59e0b',
  }

  return (stats.value?.tenants_by_status ?? []).map((item) => ({
    key: item.status,
    label: item.label,
    count: item.count,
    color: palette[item.status] ?? '#94a3b8',
  }))
})

const auditResultSegments = computed<ChartSegment[]>(() => {
  const palette: Record<string, string> = {
    success: '#16a34a',
    failure: '#dc2626',
    pending: '#f59e0b',
  }

  return (stats.value?.audit_results_last_7_days ?? []).map((item) => ({
    key: item.result,
    label: item.label,
    count: item.count,
    color: palette[item.result] ?? '#94a3b8',
  }))
})

const tenantsMonthlyBars = computed(() =>
  (stats.value?.tenants_created_by_month ?? []).map((item) => ({
    key: item.month,
    label: item.label,
    count: item.count,
  })),
)

const topTenantsBars = computed(() =>
  (stats.value?.top_tenants_by_users ?? []).map((item) => ({
    key: item.id,
    label: item.name,
    sublabel: item.slug,
    count: item.users_count,
  })),
)

function openAuditDetail(eventId: string): void {
  selectedAuditEventId.value = eventId
  auditModalOpen.value = true
}

async function loadDashboard(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    stats.value = await centralDashboardService.fetchStats()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudo cargar el panel de inicio.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

function goTo(routeName: string): void {
  router.push({ name: routeName })
}

onMounted(() => {
  void loadDashboard()
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="hero-kicker">SoftDIN Central</p>
        <h1 class="hero-title">Hola, {{ auth.user?.name }}</h1>
        <p class="hero-text">
          Panel de administración de la plataforma.
          <span v-if="auth.platformRoleLabel">
            Accede como <strong>{{ auth.platformRoleLabel }}</strong>.
          </span>
        </p>
      </div>
      <button type="button" class="btn-secondary" :disabled="loading" @click="loadDashboard">
        {{ loading ? 'Actualizando…' : 'Actualizar indicadores' }}
      </button>
    </section>

    <p v-if="error" class="alert-error">{{ error }}</p>

    <section v-if="loading && !stats" class="loading-card">
      Cargando indicadores…
    </section>

    <template v-else-if="stats">
      <section class="kpi-grid">
        <CentralKpiCard
          label="Clientes activos"
          :value="stats.kpis.tenants_active"
          :hint="`${stats.kpis.tenants_total} registrados en total · tendencia 30 días`"
          :sparkline="stats.sparklines.tenants_active"
        />
        <CentralKpiCard
          label="Usuarios activos"
          :value="stats.kpis.users_active"
          :hint="`${stats.kpis.users_total} usuarios en central · tendencia 30 días`"
          accent="slate"
          :sparkline="stats.sparklines.users_active"
          sparkline-color="#475569"
        />
        <CentralKpiCard
          label="Pendientes de activación"
          :value="stats.kpis.users_pending_activation"
          hint="Evolución de cuentas sin contraseña (30 días)"
          accent="amber"
          :sparkline="stats.sparklines.users_pending_activation"
          sparkline-color="#d97706"
        />
        <CentralKpiCard
          label="Eventos de auditoría (24 h)"
          :value="stats.kpis.audit_events_last_24h"
          :hint="`${stats.kpis.tenants_created_this_month} cliente(s) creado(s) este mes`"
          accent="sky"
          :sparkline="stats.sparklines.audit_events"
          sparkline-color="#0284c7"
        />
      </section>

      <section class="charts-grid">
        <CentralDonutChart
          title="Estado de clientes"
          subtitle="Distribución actual en SoftDIN Central"
          :segments="tenantStatusSegments"
          center-label="Clientes"
        />
        <CentralBarChart
          title="Clientes creados por mes"
          subtitle="Últimos 6 meses"
          :items="tenantsMonthlyBars"
        />
        <CentralDonutChart
          title="Auditoría (7 días)"
          subtitle="Resultado de eventos registrados"
          :segments="auditResultSegments"
          center-label="Eventos"
        />
      </section>

      <CentralHorizontalBarChart
        title="Top clientes por usuarios asignados"
        subtitle="Clientes con más usuarios vinculados en SoftDIN Central"
        :items="topTenantsBars"
      />

      <CentralActivityFeed :items="stats.recent_activity" @select="openAuditDetail" />
    </template>

    <CentralAuditEventModal
      v-model:open="auditModalOpen"
      :event-id="selectedAuditEventId"
    />

    <section class="quick-links-card">
      <h2 class="quick-links-title">Accesos rápidos</h2>
      <div class="quick-links-grid">
        <button
          v-for="item in quickLinks"
          :key="item.routeName"
          type="button"
          class="quick-link"
          @click="goTo(item.routeName)"
        >
          <span class="quick-link-icon">{{ item.icon }}</span>
          <span class="quick-link-label">{{ item.label }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: space-between;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

@media (min-width: 640px) {
  .hero-card {
    flex-direction: row;
    align-items: flex-start;
  }
}

.hero-kicker {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-brand-600);
}

.hero-title {
  margin-top: 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.hero-text {
  margin-top: 0.5rem;
  font-size: 0.9375rem;
  color: #475569;
}

.btn-secondary {
  flex-shrink: 0;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.btn-secondary:disabled {
  opacity: 0.6;
}

.alert-error {
  border-radius: 0.75rem;
  background: #fef2f2;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.loading-card {
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
}

.kpi-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .kpi-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.charts-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .charts-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.quick-links-card {
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.quick-links-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.quick-links-grid {
  margin-top: 0.875rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.quick-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.quick-link:hover {
  border-color: var(--color-brand-500);
  background: var(--color-brand-50);
  color: var(--color-brand-800);
}

.quick-link-icon {
  display: inline-flex;
  height: 1.75rem;
  width: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: #0f172a;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}
</style>
