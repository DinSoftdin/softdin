<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import CentralTenantCreateModal from '@/views/central/components/CentralTenantCreateModal.vue'
import CentralTenantEditModal from '@/views/central/components/CentralTenantEditModal.vue'
import CentralTenantUsersModal from '@/views/central/components/CentralTenantUsersModal.vue'
import { tenantLogoPublicUrl, tenantService } from '@/services/tenant.service'
import type { CentralTenant } from '@/types/tenant'

const loading = ref(true)
const error = ref<string | null>(null)
const tenants = ref<CentralTenant[]>([])
const search = ref('')

const createModalOpen = ref(false)
const editModalOpen = ref(false)
const usersModalOpen = ref(false)
const deleteModalOpen = ref(false)
const selectedTenant = ref<CentralTenant | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const filteredTenants = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) {
    return tenants.value
  }

  return tenants.value.filter((tenant) => {
    const primaryDomain = primaryDomainOf(tenant)?.toLowerCase() ?? ''
    return (
      tenant.name.toLowerCase().includes(term)
      || tenant.slug.toLowerCase().includes(term)
      || tenant.database.toLowerCase().includes(term)
      || tenant.status.toLowerCase().includes(term)
      || primaryDomain.includes(term)
    )
  })
})

const stats = computed(() => ({
  total: tenants.value.length,
  active: tenants.value.filter((tenant) => tenant.status === 'active').length,
}))

function primaryDomainOf(tenant: CentralTenant): string | null {
  const domains = tenant.domains ?? []
  const primary = domains.find((domain) => domain.is_primary)
  return primary?.domain ?? domains[0]?.domain ?? null
}

function tenantLogoUrl(tenant: CentralTenant): string {
  const version = tenant.updated_at
    ? new Date(tenant.updated_at).getTime()
    : Date.now()

  return tenantLogoPublicUrl(tenant.slug, version)
}

function tenantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
}

function statusLabel(status: string): string {
  if (status === 'active') {
    return 'Activo'
  }

  if (status === 'suspended') {
    return 'Suspendido'
  }

  return status
}

function statusClass(status: string): string {
  if (status === 'active') {
    return 'status-active'
  }

  if (status === 'suspended') {
    return 'status-suspended'
  }

  return 'status-default'
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

async function loadTenants(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    tenants.value = await tenantService.listCentral()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudo cargar el listado de clientes.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

async function onTenantSaved(): Promise<void> {
  await loadTenants()

  if (selectedTenant.value) {
    const refreshed = tenants.value.find((item) => item.id === selectedTenant.value?.id)
    if (refreshed) {
      selectedTenant.value = refreshed
    }
  }
}

onMounted(() => {
  void loadTenants()
})

function openCreateModal(): void {
  createModalOpen.value = true
}

function openEditModal(tenant: CentralTenant): void {
  selectedTenant.value = tenant
  editModalOpen.value = true
}

function openUsersModal(tenant: CentralTenant): void {
  selectedTenant.value = tenant
  usersModalOpen.value = true
}

function onTenantRowDblClick(tenant: CentralTenant, event: MouseEvent): void {
  if ((event.target as HTMLElement).closest('.actions-cell')) {
    return
  }

  openEditModal(tenant)
}

function openDeleteModal(tenant: CentralTenant): void {
  selectedTenant.value = tenant
  deleteError.value = null
  deleteModalOpen.value = true
}

function closeDeleteModal(): void {
  if (deleting.value) {
    return
  }

  deleteModalOpen.value = false
  deleteError.value = null
}

async function confirmDeleteTenant(): Promise<void> {
  if (!selectedTenant.value) {
    return
  }

  deleting.value = true
  deleteError.value = null

  try {
    await tenantService.deleteCentral(selectedTenant.value.id)
    deleteModalOpen.value = false
    selectedTenant.value = null
    await loadTenants()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      deleteError.value = responseData?.message ?? 'No se pudo eliminar el cliente.'
      return
    }

    deleteError.value = 'Error de conexión con el servidor.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="text-sm font-medium text-brand-600">Administración</p>
          <h1 class="mt-1 text-2xl font-bold text-slate-900">Clientes</h1>
          <p class="mt-2 text-sm text-slate-600">
            Listado de todos los clientes registrados en SoftDIN Central.
            Doble clic en un cliente para abrir su formulario de edición.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-primary" @click="openCreateModal">
            Crear cliente
          </button>
          <button type="button" class="btn-secondary" :disabled="loading" @click="loadTenants">
            {{ loading ? 'Actualizando…' : 'Actualizar' }}
          </button>
        </div>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-2">
        <div class="stat-card">
          <p class="stat-label">Total clientes</p>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Activos</p>
          <p class="stat-value">{{ stats.active }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div class="border-b border-slate-200 px-4 py-4 sm:px-6">
        <label for="tenant-search" class="sr-only">Buscar clientes</label>
        <input
          id="tenant-search"
          v-model="search"
          type="search"
          placeholder="Buscar por nombre, sigla, dominio, BD o estado…"
          class="search-input"
        />
      </div>

      <p v-if="error" class="mx-4 my-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
        {{ error }}
      </p>

      <div v-if="loading" class="px-6 py-12 text-center text-sm text-slate-500">
        Cargando clientes…
      </div>

      <div
        v-else-if="filteredTenants.length === 0"
        class="px-6 py-12 text-center text-sm text-slate-500"
      >
        {{
          search.trim()
            ? 'No hay clientes que coincidan con la búsqueda.'
            : 'No hay clientes registrados en la plataforma.'
        }}
      </div>

      <div v-else>
        <p class="table-hint">Doble clic en una fila para editar el cliente.</p>
        <div class="overflow-x-auto">
        <table class="tenants-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Sigla</th>
              <th>Dominio</th>
              <th>Base de datos</th>
              <th>Estado</th>
              <th>Creado</th>
              <th class="actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tenant in filteredTenants"
              :key="tenant.id"
              class="data-row"
              tabindex="0"
              title="Doble clic para editar"
              @dblclick="onTenantRowDblClick(tenant, $event)"
              @keydown.enter="openEditModal(tenant)"
            >
              <td>
                <div class="tenant-cell">
                  <span class="tenant-logo">
                    <img
                      v-if="tenant.has_logo"
                      :key="`${tenant.id}-${tenant.updated_at ?? ''}`"
                      :src="tenantLogoUrl(tenant)"
                      :alt="tenant.name"
                      class="h-full w-full object-cover"
                    />
                    <span v-else class="tenant-initials">{{ tenantInitials(tenant.name) }}</span>
                  </span>
                  <span class="font-medium text-slate-900">{{ tenant.name }}</span>
                </div>
              </td>
              <td>
                <code class="slug">{{ tenant.slug }}</code>
              </td>
              <td class="text-slate-600">{{ primaryDomainOf(tenant) ?? '—' }}</td>
              <td>
                <code class="database">{{ tenant.database }}</code>
              </td>
              <td>
                <span class="status-badge" :class="statusClass(tenant.status)">
                  {{ statusLabel(tenant.status) }}
                </span>
              </td>
              <td class="whitespace-nowrap text-slate-600">{{ formatDate(tenant.created_at) }}</td>
              <td>
                <div class="actions-cell">
                  <button
                    type="button"
                    class="action-icon-btn"
                    data-tooltip="Usuarios"
                    aria-label="Usuarios"
                    @click="openUsersModal(tenant)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                      <path
                        fill="currentColor"
                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="action-icon-btn"
                    data-tooltip="Editar"
                    aria-label="Editar"
                    @click="openEditModal(tenant)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                      <path
                        fill="currentColor"
                        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="action-icon-btn action-icon-btn-danger"
                    data-tooltip="Eliminar"
                    aria-label="Eliminar"
                    @click="openDeleteModal(tenant)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                      <path
                        fill="currentColor"
                        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <div
        v-if="!loading && filteredTenants.length > 0"
        class="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-6"
      >
        Mostrando {{ filteredTenants.length }} de {{ tenants.length }} cliente(s)
      </div>
    </section>

    <CentralTenantCreateModal v-model:open="createModalOpen" @saved="onTenantSaved" />
    <CentralTenantEditModal
      v-model:open="editModalOpen"
      :tenant="selectedTenant"
      @saved="onTenantSaved"
    />
    <CentralTenantUsersModal
      v-model:open="usersModalOpen"
      :tenant="selectedTenant"
    />

    <Teleport to="body">
      <div v-if="deleteModalOpen && selectedTenant" class="modal-backdrop" @click.self="closeDeleteModal">
        <div class="modal-panel modal-panel-danger" role="dialog" aria-modal="true">
          <header class="modal-header">
            <div>
              <p class="modal-kicker modal-kicker-danger">Eliminación permanente</p>
              <h2 class="modal-title">¿Eliminar «{{ selectedTenant.name }}»?</h2>
            </div>
            <button
              type="button"
              class="modal-close"
              aria-label="Cerrar"
              :disabled="deleting"
              @click="closeDeleteModal"
            >
              ×
            </button>
          </header>

          <div class="modal-body space-y-3 text-sm text-slate-700">
            <p>
              Si elimina este cliente, se borrarán de forma
              <strong>permanente e irreversible</strong> todos los registros asociados en SoftDIN Central.
            </p>
            <p>
              También se eliminará la base de datos del tenant:
              <code class="database">{{ selectedTenant.database }}</code>
            </p>
            <p class="text-red-700">
              Esta acción no se puede deshacer. Confirme solo si está seguro.
            </p>
            <p v-if="deleteError" class="alert-error">{{ deleteError }}</p>
          </div>

          <footer class="modal-footer">
            <button type="button" class="btn-secondary" :disabled="deleting" @click="closeDeleteModal">
              Cancelar
            </button>
            <button type="button" class="btn-danger" :disabled="deleting" @click="confirmDeleteTenant">
              {{ deleting ? 'Eliminando…' : 'Sí, eliminar permanentemente' }}
            </button>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.text-brand-600 {
  color: var(--color-brand-600);
}

.btn-primary {
  border-radius: 0.5rem;
  background: var(--color-brand-600);
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-brand-700);
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

.btn-secondary:hover:not(:disabled) {
  background: #f8fafc;
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

.search-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  outline: none;
}

.search-input:focus {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-100);
}

.tenants-table {
  width: 100%;
  min-width: 62rem;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.tenants-table th {
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

.tenants-table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 0.875rem 1rem;
  vertical-align: middle;
}

.table-hint {
  margin: 0;
  padding: 0.75rem 1rem 0;
  font-size: 0.75rem;
  color: #64748b;
}

.data-row {
  cursor: pointer;
}

.tenants-table tbody tr:hover {
  background: #fafafa;
}

.tenant-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tenant-logo {
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.tenant-initials {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-brand-700);
}

.slug,
.database {
  border-radius: 0.375rem;
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  font-size: 0.8125rem;
  color: #334155;
}

.status-badge {
  display: inline-flex;
  border-radius: 9999px;
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-suspended {
  background: #fef3c7;
  color: #92400e;
}

.status-default {
  background: #e2e8f0;
  color: #475569;
}

.actions-col {
  text-align: right;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.375rem;
}

.action-icon-btn {
  position: relative;
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #475569;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}

.action-icon-btn[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 0.375rem);
  left: 50%;
  z-index: 10;
  transform: translateX(-50%);
  border-radius: 0.375rem;
  background: #0f172a;
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
  color: #fff;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.action-icon-btn[data-tooltip]:hover::after,
.action-icon-btn[data-tooltip]:focus-visible::after {
  opacity: 1;
}

.action-icon-btn:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

.action-icon {
  height: 1.125rem;
  width: 1.125rem;
}

.action-icon-btn-danger {
  color: #b91c1c;
  border-color: #fecaca;
}

.action-icon-btn-danger:hover {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fca5a5;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  padding: 1rem;
}

.modal-panel {
  width: 100%;
  max-width: 32rem;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
}

.modal-panel-danger {
  border: 1px solid #fecaca;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
}

.modal-kicker {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-brand-700);
}

.modal-kicker-danger {
  color: #b91c1c;
}

.modal-title {
  margin-top: 0.25rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  color: #64748b;
}

.modal-body {
  padding: 1rem 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid #e2e8f0;
  padding: 0.875rem 1.25rem;
}

.btn-danger {
  border-radius: 0.5rem;
  background: #dc2626;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-danger:disabled {
  opacity: 0.6;
}

.alert-error {
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
