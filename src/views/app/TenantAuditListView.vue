<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import TenantAuditEventModal from '@/views/app/components/TenantAuditEventModal.vue'
import { tenantAuditService } from '@/services/tenant-audit.service'
import {
  TENANT_AUDIT_CATEGORY_OPTIONS,
  TENANT_AUDIT_RESULT_OPTIONS,
  type TenantAuditListItem,
} from '@/types/tenant-audit'
import { tenantAuditResultLabel } from '@/utils/tenant-audit-labels'

const loading = ref(true)
const exporting = ref(false)
const error = ref<string | null>(null)
const exportMessage = ref<string | null>(null)
const items = ref<TenantAuditListItem[]>([])
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)
const perPage = ref(25)

const detailModalOpen = ref(false)
const selectedEventId = ref<string | null>(null)

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultFromDate(days = 7): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatDateInput(date)
}

function defaultToDate(): string {
  return formatDateInput(new Date())
}

function dateInputToIsoStart(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString()
}

function dateInputToIsoEnd(value: string): string {
  return new Date(`${value}T23:59:59.999`).toISOString()
}

const filters = reactive({
  fromDate: defaultFromDate(),
  toDate: defaultToDate(),
  event_category: '',
  result: '',
  search: '',
  exclude_reads: true,
})

const stats = computed(() => ({
  total: total.value,
  page: currentPage.value,
  lastPage: lastPage.value,
}))

function formatWhen(value?: string | null): string {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function resultClass(result: string): string {
  if (result === 'success') {
    return 'result-success'
  }

  if (result === 'failure') {
    return 'result-failure'
  }

  return 'result-pending'
}

function resetFilters(): void {
  filters.fromDate = defaultFromDate()
  filters.toDate = defaultToDate()
  filters.event_category = ''
  filters.result = ''
  filters.search = ''
  filters.exclude_reads = true
}

function currentFilters(page = currentPage.value) {
  return {
    page,
    per_page: perPage.value,
    from: dateInputToIsoStart(filters.fromDate),
    to: dateInputToIsoEnd(filters.toDate),
    event_category: filters.event_category || undefined,
    result: filters.result || undefined,
    search: filters.search,
    exclude_reads: filters.exclude_reads,
  }
}

async function exportCsv(): Promise<void> {
  exporting.value = true
  exportMessage.value = null
  error.value = null

  try {
    const result = await tenantAuditService.exportCsv(currentFilters(1))

    if (result.truncated) {
      exportMessage.value = `Se exportaron ${result.rows.toLocaleString('es-CO')} de ${result.totalMatching.toLocaleString('es-CO')} eventos (límite 5.000).`
    } else {
      exportMessage.value = `Exportación completada: ${result.rows.toLocaleString('es-CO')} evento(s) en ${result.filename}.`
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudo exportar la auditoría.'
      return
    }

    if (err instanceof Error) {
      error.value = err.message
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    exporting.value = false
  }
}

async function loadEvents(page = 1): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const response = await tenantAuditService.list(currentFilters(page))

    items.value = response.data
    currentPage.value = response.meta.current_page
    lastPage.value = response.meta.last_page
    total.value = response.meta.total
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudo cargar la auditoría.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

function applyFilters(): void {
  void loadEvents(1)
}

function applyPreset(preset: 'changes' | 'logins' | 'failures'): void {
  resetFilters()

  if (preset === 'changes') {
    filters.exclude_reads = true
  } else if (preset === 'logins') {
    filters.event_category = 'auth.login'
    filters.exclude_reads = false
  } else if (preset === 'failures') {
    filters.result = 'failure'
    filters.exclude_reads = false
  }

  void loadEvents(1)
}

function openDetail(event: TenantAuditListItem): void {
  selectedEventId.value = event.id
  detailModalOpen.value = true
}

function goToPage(page: number): void {
  if (page < 1 || page > lastPage.value || page === currentPage.value) {
    return
  }

  void loadEvents(page)
}

onMounted(() => {
  void loadEvents(1)
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-sm font-medium text-brand-600">Administración</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900">Auditoría</h1>
          <p class="mt-2 text-sm text-slate-600">
            Consulta de eventos registrados en el cliente activo: cambios en maestros, nómina, hojas de vida y accesos.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn-secondary"
            :disabled="loading || exporting"
            title="Exporta hasta 5.000 eventos con los filtros actuales"
            @click="exportCsv"
          >
            {{ exporting ? 'Exportando…' : 'Exportar CSV' }}
          </button>
          <button type="button" class="btn-secondary" :disabled="loading" @click="loadEvents(currentPage)">
            {{ loading ? 'Actualizando…' : 'Actualizar' }}
          </button>
        </div>
      </div>

      <p v-if="exportMessage" class="export-message">{{ exportMessage }}</p>

      <div class="mt-6 grid gap-3 sm:grid-cols-2">
        <div class="stat-card">
          <p class="stat-label">Eventos encontrados</p>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Página</p>
          <p class="stat-value">{{ stats.page }} / {{ stats.lastPage || 1 }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <form class="filters-form" @submit.prevent="applyFilters">
        <div class="filters-grid">
          <div>
            <label for="audit-from" class="label">Desde</label>
            <input id="audit-from" v-model="filters.fromDate" type="date" class="input-field" />
          </div>

          <div>
            <label for="audit-to" class="label">Hasta</label>
            <input id="audit-to" v-model="filters.toDate" type="date" class="input-field" />
          </div>

          <div>
            <label for="audit-category" class="label">Acción</label>
            <select id="audit-category" v-model="filters.event_category" class="input-field">
              <option
                v-for="option in TENANT_AUDIT_CATEGORY_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="audit-result" class="label">Resultado</label>
            <select id="audit-result" v-model="filters.result" class="input-field">
              <option
                v-for="option in TENANT_AUDIT_RESULT_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="filters-search">
            <label for="audit-search" class="label">Buscar</label>
            <input
              id="audit-search"
              v-model="filters.search"
              type="search"
              class="input-field"
              placeholder="Actor, ruta, error…"
            />
          </div>
        </div>

        <div class="filters-actions">
          <label class="checkbox-label">
            <input v-model="filters.exclude_reads" type="checkbox" />
            Ocultar consultas (GET)
          </label>

          <div class="preset-buttons">
            <button type="button" class="chip-btn" @click="applyPreset('changes')">Cambios</button>
            <button type="button" class="chip-btn" @click="applyPreset('logins')">Accesos</button>
            <button type="button" class="chip-btn" @click="applyPreset('failures')">Errores</button>
          </div>

          <div class="filters-submit">
            <button type="button" class="btn-secondary" @click="resetFilters(); applyFilters()">
              Limpiar
            </button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Buscando…' : 'Buscar' }}
            </button>
          </div>
        </div>
      </form>
    </section>

    <section class="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <p v-if="error" class="alert-error">{{ error }}</p>
      <p v-else-if="loading && items.length === 0" class="state-message">Cargando eventos…</p>
      <p v-else-if="items.length === 0" class="state-message">No hay eventos con los filtros seleccionados.</p>

      <div v-else class="table-wrap">
        <table class="audit-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Cambios</th>
              <th>Actor</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="event in items"
              :key="event.id"
              class="audit-row"
              tabindex="0"
              @click="openDetail(event)"
              @keydown.enter="openDetail(event)"
            >
              <td class="whitespace-nowrap">{{ formatWhen(event.occurred_at) }}</td>
              <td>{{ event.category_label }}</td>
              <td>{{ event.entity_label }}</td>
              <td class="changes-cell">{{ event.changes_summary }}</td>
              <td>{{ event.actor_label ?? '—' }}</td>
              <td>
                <span class="result-badge" :class="resultClass(event.result)">
                  {{ tenantAuditResultLabel(event.result) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer v-if="lastPage > 1" class="pagination">
        <button
          type="button"
          class="btn-secondary"
          :disabled="loading || currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          Anterior
        </button>
        <span class="pagination-label">Página {{ currentPage }} de {{ lastPage }}</span>
        <button
          type="button"
          class="btn-secondary"
          :disabled="loading || currentPage >= lastPage"
          @click="goToPage(currentPage + 1)"
        >
          Siguiente
        </button>
      </footer>
    </section>

    <TenantAuditEventModal v-model:open="detailModalOpen" :event-id="selectedEventId" />
  </div>
</template>

<style scoped>
.btn-primary {
  border-radius: 0.5rem;
  background: var(--color-brand-600);
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.btn-secondary {
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

.stat-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  padding: 0.875rem 1rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
}

.stat-value {
  margin-top: 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.filters-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .filters-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filters-search {
    grid-column: span 2;
  }
}

.label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.input-field {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
}

.input-field:focus {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-100);
}

.filters-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .filters-actions {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #334155;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip-btn {
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  color: #334155;
}

.chip-btn:hover {
  background: #f1f5f9;
}

.filters-submit {
  display: flex;
  gap: 0.5rem;
}

.table-wrap {
  overflow-x: auto;
}

.audit-table {
  width: 100%;
  min-width: 56rem;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.audit-table th {
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.audit-table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 0.875rem 1rem;
  vertical-align: top;
}

.audit-row {
  cursor: pointer;
}

.audit-row:hover {
  background: #fafafa;
}

.changes-cell {
  max-width: 16rem;
  color: #475569;
}

.result-badge {
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.result-success {
  background: #dcfce7;
  color: #166534;
}

.result-failure {
  background: #fee2e2;
  color: #991b1b;
}

.result-pending {
  background: #fef3c7;
  color: #92400e;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  border-top: 1px solid #e2e8f0;
  padding: 1rem;
}

.pagination-label {
  font-size: 0.875rem;
  color: #64748b;
}

.state-message {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
}

.alert-error {
  margin: 1rem;
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.export-message {
  margin-top: 1rem;
  border-radius: 0.5rem;
  background: #ecfdf5;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #047857;
}
</style>
