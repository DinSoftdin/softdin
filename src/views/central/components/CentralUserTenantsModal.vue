<script setup lang="ts">
import { ref, watch } from 'vue'
import axios from 'axios'
import { centralUserService } from '@/services/central-user.service'
import type { CentralUser, UserAssignedTenant, UserAvailableTenant } from '@/types/central-user'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  user: CentralUser | null
}>()

const emit = defineEmits<{
  changed: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const tenants = ref<UserAssignedTenant[]>([])

const showAttachForm = ref(false)
const availableLoading = ref(false)
const availableTenants = ref<UserAvailableTenant[]>([])
const availableSearch = ref('')
const attachError = ref<string | null>(null)
const attachingTenantId = ref<string | null>(null)
const attachConfirmOpen = ref(false)
const tenantToAttach = ref<UserAvailableTenant | null>(null)
const attachConfirmRole = ref('member')
const detachConfirmOpen = ref(false)
const tenantToDetach = ref<UserAssignedTenant | null>(null)
const detachError = ref<string | null>(null)
const detachingTenantId = ref<string | null>(null)

const roleOptions = [
  { value: 'owner', label: 'Propietario' },
  { value: 'admin', label: 'Administrador' },
  { value: 'member', label: 'Miembro' },
  { value: 'viewer', label: 'Consulta' },
]

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    member: 'Miembro',
    viewer: 'Consulta',
  }

  return labels[role] ?? role
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

function resetAttachForm(): void {
  availableSearch.value = ''
  availableTenants.value = []
  attachError.value = null
  attachConfirmOpen.value = false
  tenantToAttach.value = null
  attachConfirmRole.value = 'member'
}

function openAttachConfirm(tenant: UserAvailableTenant): void {
  tenantToAttach.value = tenant
  attachConfirmRole.value = 'member'
  attachError.value = null
  attachConfirmOpen.value = true
}

function closeAttachConfirm(): void {
  if (attachingTenantId.value !== null) {
    return
  }

  attachConfirmOpen.value = false
  tenantToAttach.value = null
  attachError.value = null
}

function openDetachConfirm(tenant: UserAssignedTenant): void {
  tenantToDetach.value = tenant
  detachError.value = null
  detachConfirmOpen.value = true
}

function closeDetachConfirm(): void {
  if (detachingTenantId.value !== null) {
    return
  }

  detachConfirmOpen.value = false
  tenantToDetach.value = null
  detachError.value = null
}

async function loadTenants(): Promise<void> {
  if (!props.user) {
    return
  }

  loading.value = true
  error.value = null
  successMessage.value = null
  tenants.value = []

  try {
    const data = await centralUserService.fetchTenants(props.user.id)
    tenants.value = data.tenants
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudieron cargar los clientes.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

async function refreshTenants(): Promise<void> {
  if (!props.user) {
    return
  }

  try {
    const data = await centralUserService.fetchTenants(props.user.id)
    tenants.value = data.tenants
    error.value = null
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudieron actualizar los clientes.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  }
}

async function loadAvailableTenants(): Promise<void> {
  if (!props.user) {
    return
  }

  availableLoading.value = true
  attachError.value = null

  try {
    const data = await centralUserService.fetchAvailableTenants(
      props.user.id,
      availableSearch.value,
    )
    availableTenants.value = data.tenants
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      attachError.value = responseData?.message ?? 'No se pudieron cargar los clientes disponibles.'
      return
    }

    attachError.value = 'Error de conexión con el servidor.'
  } finally {
    availableLoading.value = false
  }
}

function openAttachForm(): void {
  showAttachForm.value = true
  resetAttachForm()
  void loadAvailableTenants()
}

function closeAttachForm(): void {
  showAttachForm.value = false
  resetAttachForm()
}

async function confirmAttach(): Promise<void> {
  if (!props.user || !tenantToAttach.value) {
    return
  }

  const tenant = tenantToAttach.value
  attachingTenantId.value = tenant.id
  attachError.value = null

  try {
    const response = await centralUserService.attachTenant(props.user.id, {
      tenant_id: tenant.id,
      role: attachConfirmRole.value,
    })

    tenants.value = [...tenants.value, response.tenant]
      .filter((item, index, list) => list.findIndex((entry) => entry.id === item.id) === index)
      .sort((a, b) => a.name.localeCompare(b.name))

    availableTenants.value = availableTenants.value.filter((item) => item.id !== tenant.id)
    successMessage.value = response.message
    attachConfirmOpen.value = false
    tenantToAttach.value = null
    emit('changed')
    await refreshTenants()

    if (showAttachForm.value) {
      await loadAvailableTenants()
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      attachError.value = responseData?.message ?? 'No se pudo asociar el cliente.'
      return
    }

    attachError.value = 'Error de conexión con el servidor.'
  } finally {
    attachingTenantId.value = null
  }
}

async function confirmDetach(): Promise<void> {
  if (!props.user || !tenantToDetach.value) {
    return
  }

  const tenant = tenantToDetach.value
  detachingTenantId.value = tenant.id
  detachError.value = null
  successMessage.value = null

  try {
    const response = await centralUserService.detachTenant(props.user.id, tenant.id)

    tenants.value = tenants.value.filter((item) => item.id !== tenant.id)
    successMessage.value = response.message
    detachConfirmOpen.value = false
    tenantToDetach.value = null
    emit('changed')
    await refreshTenants()

    if (showAttachForm.value) {
      await loadAvailableTenants()
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      detachError.value = responseData?.message ?? 'No se pudo quitar el cliente del usuario.'
      return
    }

    detachError.value = 'Error de conexión con el servidor.'
  } finally {
    detachingTenantId.value = null
  }
}

function close(): void {
  open.value = false
}

watch(
  () => [open.value, props.user?.id] as const,
  ([isOpen]) => {
    if (isOpen && props.user) {
      showAttachForm.value = false
      resetAttachForm()
      detachConfirmOpen.value = false
      tenantToDetach.value = null
      detachError.value = null
      void loadTenants()
      return
    }

    showAttachForm.value = false
    resetAttachForm()
    detachConfirmOpen.value = false
    tenantToDetach.value = null
    detachError.value = null
  },
)

let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(availableSearch, () => {
  if (!showAttachForm.value) {
    return
  }

  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    void loadAvailableTenants()
  }, 300)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open && user" class="modal-backdrop" @click.self="close">
      <div class="modal-panel" role="dialog" aria-modal="true" :aria-labelledby="'tenants-modal-title'">
        <header class="modal-header">
          <div>
            <p class="modal-kicker">Clientes asociados</p>
            <h2 :id="'tenants-modal-title'" class="modal-title">{{ user.name }}</h2>
            <p class="modal-subtitle">{{ user.email }}</p>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar" @click="close">×</button>
        </header>

        <div class="modal-body">
          <div class="toolbar">
            <button
              v-if="!showAttachForm"
              type="button"
              class="btn-primary"
              @click="openAttachForm"
            >
              Asociar cliente existente
            </button>
          </div>

          <div v-if="showAttachForm" class="attach-panel">
            <div class="attach-panel-header">
              <div>
                <h3 class="attach-title">Clientes de la plataforma</h3>
                <p class="attach-hint">
                  Seleccione un cliente registrado en la base central (softdin_central).
                  La creación de clientes nuevos se gestionará en otro formulario.
                </p>
              </div>
              <button type="button" class="link-btn" @click="closeAttachForm">Cerrar listado</button>
            </div>

            <label class="field">
              <span class="field-label">Buscar en clientes centrales</span>
              <input
                v-model="availableSearch"
                type="search"
                class="field-input"
                placeholder="Nombre o sigla..."
              />
            </label>

            <p v-if="availableLoading" class="text-sm text-slate-500">Cargando clientes centrales...</p>
            <p v-else-if="availableTenants.length === 0" class="text-sm text-slate-500">
              No hay clientes centrales disponibles para asociar a este usuario.
            </p>

            <div v-else class="overflow-x-auto attach-table-wrap">
              <table class="users-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Sigla</th>
                    <th>Estado</th>
                    <th class="actions-col">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tenant in availableTenants" :key="tenant.id">
                    <td class="font-medium text-slate-900">{{ tenant.name }}</td>
                    <td><code class="slug">{{ tenant.slug }}</code></td>
                    <td>
                      <span class="status-badge" :class="statusClass(tenant.status)">
                        {{ statusLabel(tenant.status) }}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        class="btn-associate"
                        @click="openAttachConfirm(tenant)"
                      >
                        Asociar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p v-if="successMessage" class="alert-success">{{ successMessage }}</p>

          <p v-if="loading" class="text-sm text-slate-500">Cargando clientes...</p>
          <p v-else-if="error" class="alert-error">{{ error }}</p>
          <p v-else-if="tenants.length === 0" class="text-sm text-slate-500">
            No hay clientes asignados a este usuario.
          </p>

          <div v-else class="overflow-x-auto">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Sigla</th>
                  <th>Rol en cliente</th>
                  <th>Estado</th>
                  <th class="actions-col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tenant in tenants" :key="tenant.id">
                  <td class="font-medium text-slate-900">{{ tenant.name }}</td>
                  <td><code class="slug">{{ tenant.slug }}</code></td>
                  <td>
                    <span class="role-badge">{{ roleLabel(tenant.role) }}</span>
                  </td>
                  <td>
                    <span class="status-badge" :class="statusClass(tenant.status)">
                      {{ statusLabel(tenant.status) }}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      class="action-icon-btn action-icon-btn-danger"
                      data-tooltip="Quitar del usuario"
                      aria-label="Quitar del usuario"
                      @click="openDetachConfirm(tenant)"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                        <path
                          fill="currentColor"
                          d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4c0-.55-.45-1-1-1h-5.5l-1-1h-5l-1 1H5c-.55 0-1 .45-1 1v2h16V3c0-.55-.45-1-1-1z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn-secondary" @click="close">Cerrar</button>
        </footer>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="attachConfirmOpen && tenantToAttach && user"
      class="modal-backdrop modal-backdrop-confirm"
      @click.self="closeAttachConfirm"
    >
      <div class="modal-panel modal-panel-confirm" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div>
            <p class="modal-kicker modal-kicker-confirm">Asociar cliente</p>
            <h2 class="modal-title">¿Asociar «{{ tenantToAttach.name }}»?</h2>
          </div>
          <button
            type="button"
            class="modal-close"
            aria-label="Cerrar"
            :disabled="attachingTenantId !== null"
            @click="closeAttachConfirm"
          >
            ×
          </button>
        </header>

        <div class="modal-body space-y-3 text-sm text-slate-700">
          <p>
            Se vinculará el cliente
            <strong>{{ tenantToAttach.name }}</strong> (sigla <code class="slug">{{ tenantToAttach.slug }}</code>)
            al usuario <strong>{{ user.name }}</strong>.
          </p>
          <p>
            Correo del usuario:
            <strong>{{ user.email }}</strong>
          </p>

          <label class="field">
            <span class="field-label">Rol en el cliente</span>
            <select v-model="attachConfirmRole" class="field-input" :disabled="attachingTenantId !== null">
              <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <p class="text-brand-700">
            Al confirmar, el usuario quedará asociado con el rol seleccionado y recibirá una notificación por correo.
          </p>

          <p v-if="attachError" class="alert-error">{{ attachError }}</p>
        </div>

        <footer class="modal-footer">
          <button
            type="button"
            class="btn-secondary"
            :disabled="attachingTenantId !== null"
            @click="closeAttachConfirm"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-confirm"
            :disabled="attachingTenantId !== null"
            @click="confirmAttach"
          >
            {{ attachingTenantId !== null ? 'Asociando...' : 'Sí, asociar cliente' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="detachConfirmOpen && tenantToDetach && user"
      class="modal-backdrop modal-backdrop-confirm"
      @click.self="closeDetachConfirm"
    >
      <div class="modal-panel modal-panel-danger" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div>
            <p class="modal-kicker modal-kicker-danger">Quitar del usuario</p>
            <h2 class="modal-title">¿Quitar «{{ tenantToDetach.name }}»?</h2>
          </div>
          <button
            type="button"
            class="modal-close"
            aria-label="Cerrar"
            :disabled="detachingTenantId !== null"
            @click="closeDetachConfirm"
          >
            ×
          </button>
        </header>

        <div class="modal-body space-y-3 text-sm text-slate-700">
          <p>
            Se eliminará la asociación del usuario
            <strong>{{ user.name }}</strong> con el cliente
            <strong>{{ tenantToDetach.name }}</strong> (sigla <code class="slug">{{ tenantToDetach.slug }}</code>).
          </p>
          <p>
            Correo del usuario:
            <strong>{{ user.email }}</strong>
          </p>
          <p>
            Rol actual en el cliente:
            <strong>{{ roleLabel(tenantToDetach.role) }}</strong>
          </p>
          <p>
            Estado del cliente:
            <strong>{{ statusLabel(tenantToDetach.status) }}</strong>
          </p>
          <p class="text-red-700">
            El cliente seguirá existiendo en la plataforma central, pero el usuario perderá acceso a él.
            Se enviará una notificación por correo. Confirme solo si está seguro.
          </p>
          <p v-if="detachError" class="alert-error">{{ detachError }}</p>
        </div>

        <footer class="modal-footer">
          <button
            type="button"
            class="btn-secondary"
            :disabled="detachingTenantId !== null"
            @click="closeDetachConfirm"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-danger"
            :disabled="detachingTenantId !== null"
            @click="confirmDetach"
          >
            {{ detachingTenantId !== null ? 'Quitando...' : 'Sí, quitar del usuario' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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

.modal-backdrop-confirm {
  z-index: 60;
}

.modal-panel {
  width: 100%;
  max-width: 46rem;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
}

.modal-panel-confirm {
  max-width: 32rem;
  border: 1px solid #bbf7d0;
}

.modal-panel-danger {
  max-width: 32rem;
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

.modal-kicker-confirm {
  color: var(--color-brand-700);
}

.modal-kicker-danger {
  color: #b91c1c;
}

.text-brand-700 {
  color: var(--color-brand-700);
}

.text-red-700 {
  color: #b91c1c;
}

.slug {
  border-radius: 0.375rem;
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  font-size: 0.8125rem;
  color: #334155;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.modal-title {
  margin-top: 0.25rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #64748b;
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

.btn-confirm {
  border-radius: 0.5rem;
  background: var(--color-brand-700);
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--color-brand-800, #166534);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  border-radius: 0.5rem;
  background: #dc2626;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.875rem;
}

.attach-panel {
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  padding: 0.875rem;
}

.attach-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.attach-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.attach-hint {
  margin-top: 0.25rem;
  max-width: 32rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.link-btn {
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: #64748b;
  white-space: nowrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
}

.field-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 0.5rem 0.625rem;
  font-size: 0.875rem;
  color: #0f172a;
}

.attach-table-wrap {
  margin-top: 0.875rem;
  max-height: 16rem;
  overflow-y: auto;
}

.btn-associate {
  border-radius: 0.5rem;
  border: 1px solid var(--color-brand-700);
  background: #fff;
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-brand-700);
  white-space: nowrap;
}

.btn-associate:hover:not(:disabled) {
  background: var(--color-brand-700);
  color: #fff;
}

.btn-associate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.users-table th,
.users-table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 0.625rem 0.5rem;
  text-align: left;
}

.users-table th {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.actions-col {
  width: 5rem;
  text-align: center;
}

.role-badge {
  display: inline-flex;
  border-radius: 9999px;
  background: #f1f5f9;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
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

.alert-error {
  margin-top: 0.75rem;
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.alert-success {
  margin-bottom: 0.75rem;
  border-radius: 0.5rem;
  background: #f0fdf4;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #166534;
}

.btn-secondary {
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  color: #334155;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8fafc;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  border-radius: 0.5rem;
  border: 1px solid var(--color-brand-700);
  background: var(--color-brand-700);
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.action-icon-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

.action-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  height: 1.125rem;
  width: 1.125rem;
}

.action-icon-btn-danger {
  color: #b91c1c;
  border-color: #fecaca;
}

.action-icon-btn-danger:hover:not(:disabled) {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fca5a5;
}
</style>
