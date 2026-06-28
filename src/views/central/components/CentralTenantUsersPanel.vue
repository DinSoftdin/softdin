<script setup lang="ts">
import { ref, watch } from 'vue'
import axios from 'axios'
import { tenantService } from '@/services/tenant.service'
import type { CentralTenant, TenantAssignedUser, TenantAvailableUser } from '@/types/tenant'

const props = withDefaults(
  defineProps<{
    tenant: CentralTenant | null
    active?: boolean
  }>(),
  { active: true },
)

const loading = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const users = ref<TenantAssignedUser[]>([])

const availableLoading = ref(false)
const availableUsers = ref<TenantAvailableUser[]>([])
const selectedUserId = ref('')
const attachError = ref<string | null>(null)
const attaching = ref(false)
const detachConfirmOpen = ref(false)
const userToDetach = ref<TenantAssignedUser | null>(null)
const detachError = ref<string | null>(null)
const detachingUserId = ref<number | null>(null)

function resetAttachState(): void {
  selectedUserId.value = ''
  availableUsers.value = []
  attachError.value = null
}

function resetPanelState(): void {
  resetAttachState()
  detachConfirmOpen.value = false
  userToDetach.value = null
  detachError.value = null
  successMessage.value = null
  error.value = null
}

function openDetachConfirm(user: TenantAssignedUser): void {
  userToDetach.value = user
  detachError.value = null
  detachConfirmOpen.value = true
}

function closeDetachConfirm(): void {
  if (detachingUserId.value !== null) {
    return
  }

  detachConfirmOpen.value = false
  userToDetach.value = null
  detachError.value = null
}

async function loadUsers(): Promise<void> {
  if (!props.tenant) {
    return
  }

  loading.value = true
  error.value = null
  successMessage.value = null
  users.value = []

  try {
    const data = await tenantService.fetchCentralUsers(props.tenant.id)
    users.value = data.users
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudieron cargar los usuarios.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

async function loadAvailableUsers(): Promise<void> {
  if (!props.tenant) {
    return
  }

  availableLoading.value = true
  attachError.value = null

  try {
    const data = await tenantService.fetchCentralAvailableUsers(props.tenant.id)
    availableUsers.value = data.users
    if (selectedUserId.value && !data.users.some((user) => String(user.id) === selectedUserId.value)) {
      selectedUserId.value = ''
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      attachError.value = responseData?.message ?? 'No se pudieron cargar los usuarios disponibles.'
      return
    }

    attachError.value = 'Error de conexión con el servidor.'
  } finally {
    availableLoading.value = false
  }
}

async function refreshUsers(): Promise<void> {
  if (!props.tenant) {
    return
  }

  try {
    const data = await tenantService.fetchCentralUsers(props.tenant.id)
    users.value = data.users
    error.value = null
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudieron actualizar los usuarios.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  }
}

async function attachSelectedUser(): Promise<void> {
  if (!props.tenant || !selectedUserId.value) {
    return
  }

  attaching.value = true
  attachError.value = null
  successMessage.value = null

  try {
    const response = await tenantService.attachCentralUser(props.tenant.id, {
      user_id: Number(selectedUserId.value),
    })

    successMessage.value = response.message
    selectedUserId.value = ''
    await refreshUsers()
    await loadAvailableUsers()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      attachError.value = responseData?.message ?? 'No se pudo asociar el usuario.'
      return
    }

    attachError.value = 'Error de conexión con el servidor.'
  } finally {
    attaching.value = false
  }
}

async function confirmDetach(): Promise<void> {
  if (!props.tenant || !userToDetach.value) {
    return
  }

  const user = userToDetach.value
  detachingUserId.value = user.id
  detachError.value = null
  successMessage.value = null

  try {
    const response = await tenantService.detachCentralUser(props.tenant.id, user.id)

    users.value = users.value.filter((item) => Number(item.id) !== Number(user.id))
    successMessage.value = response.message
    detachConfirmOpen.value = false
    userToDetach.value = null
    await refreshUsers()
    await loadAvailableUsers()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      detachError.value = responseData?.message ?? 'No se pudo quitar el usuario del cliente.'
      return
    }

    detachError.value = 'Error de conexión con el servidor.'
  } finally {
    detachingUserId.value = null
  }
}

watch(
  () => [props.active, props.tenant?.id, props.tenant?.updated_at] as const,
  ([isActive]) => {
    if (isActive && props.tenant) {
      resetPanelState()
      void loadUsers()
      void loadAvailableUsers()
      return
    }

    resetPanelState()
  },
)
</script>

<template>
  <div v-if="tenant" class="users-panel">
    <div class="attach-row">
      <label class="field attach-field">
        <span class="field-label">Usuario activo</span>
        <select
          v-model="selectedUserId"
          class="field-input"
          :disabled="availableLoading || attaching"
        >
          <option value="">
            {{ availableLoading ? 'Cargando usuarios...' : 'Seleccione un usuario activo' }}
          </option>
          <option v-for="user in availableUsers" :key="user.id" :value="String(user.id)">
            {{ user.name }} — {{ user.email }}
          </option>
        </select>
      </label>

      <button
        type="button"
        class="btn-primary attach-btn"
        :disabled="!selectedUserId || attaching || availableLoading"
        @click="attachSelectedUser"
      >
        {{ attaching ? 'Asociando…' : 'Asociar' }}
      </button>
    </div>

    <p v-if="!availableLoading && availableUsers.length === 0" class="field-hint">
      No hay usuarios activos disponibles para asociar a este cliente.
    </p>

    <p v-if="attachError" class="alert-error">{{ attachError }}</p>
    <p v-if="successMessage" class="alert-success">{{ successMessage }}</p>

    <p v-if="loading" class="text-sm text-slate-500">Cargando usuarios...</p>
    <p v-else-if="error" class="alert-error">{{ error }}</p>
    <p v-else-if="users.length === 0" class="text-sm text-slate-500">
      No hay usuarios asignados a este cliente.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="users-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th class="actions-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td class="font-medium text-slate-900">{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <button
                type="button"
                class="action-icon-btn action-icon-btn-danger"
                data-tooltip="Quitar del cliente"
                aria-label="Quitar del cliente"
                @click="openDetachConfirm(user)"
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

  <Teleport to="body">
    <div
      v-if="detachConfirmOpen && userToDetach && tenant"
      class="modal-backdrop modal-backdrop-confirm"
      @click.self="closeDetachConfirm"
    >
      <div class="modal-panel modal-panel-danger" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div>
            <p class="modal-kicker modal-kicker-danger">Quitar del cliente</p>
            <h2 class="modal-title">¿Quitar a «{{ userToDetach.name }}»?</h2>
          </div>
          <button
            type="button"
            class="modal-close"
            aria-label="Cerrar"
            :disabled="detachingUserId !== null"
            @click="closeDetachConfirm"
          >
            ×
          </button>
        </header>

        <div class="modal-body space-y-3 text-sm text-slate-700">
          <p>
            Se eliminará la asociación del usuario con el cliente
            <strong>{{ tenant.name }}</strong> (sigla <code class="slug">{{ tenant.slug }}</code>).
          </p>
          <p>
            Correo del usuario:
            <strong>{{ userToDetach.email }}</strong>
          </p>
          <p class="text-red-700">
            El usuario seguirá existiendo en la plataforma central, pero perderá acceso a este cliente.
            Se enviará una notificación por correo. Confirme solo si está seguro.
          </p>
          <p v-if="detachError" class="alert-error">{{ detachError }}</p>
        </div>

        <footer class="modal-footer">
          <button
            type="button"
            class="btn-secondary"
            :disabled="detachingUserId !== null"
            @click="closeDetachConfirm"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-danger"
            :disabled="detachingUserId !== null"
            @click="confirmDetach"
          >
            {{ detachingUserId !== null ? 'Quitando...' : 'Sí, quitar del cliente' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.attach-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
}

.attach-field {
  flex: 1;
  min-width: 14rem;
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

.field-hint {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.attach-btn {
  flex-shrink: 0;
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
}

.action-icon-btn[data-tooltip]:hover::after,
.action-icon-btn[data-tooltip]:focus-visible::after {
  opacity: 1;
}

.action-icon-btn-danger {
  color: #b91c1c;
  border-color: #fecaca;
}

.action-icon {
  height: 1.125rem;
  width: 1.125rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 70;
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

.slug {
  border-radius: 0.375rem;
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  font-size: 0.8125rem;
  color: #334155;
}

.text-red-700 {
  color: #b91c1c;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}
</style>
