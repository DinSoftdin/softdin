<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import CentralUserFormModal from '@/views/central/components/CentralUserFormModal.vue'
import CentralUserAvatar from '@/views/central/components/CentralUserAvatar.vue'
import CentralUserTenantsModal from '@/views/central/components/CentralUserTenantsModal.vue'
import { centralUserService } from '@/services/central-user.service'
import type { CentralUser } from '@/types/central-user'

const loading = ref(true)
const error = ref<string | null>(null)
const users = ref<CentralUser[]>([])
const search = ref('')

const formModalOpen = ref(false)
const formUser = ref<CentralUser | null>(null)
const formModalKey = ref(0)
const tenantsModalOpen = ref(false)
const deleteModalOpen = ref(false)
const selectedUser = ref<CentralUser | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) {
    return users.value
  }

  return users.value.filter((user) => (
    user.name.toLowerCase().includes(term)
    || user.email.toLowerCase().includes(term)
    || userTypeLabel(user).toLowerCase().includes(term)
    || stateLabel(user.state).toLowerCase().includes(term)
  ))
})

const stats = computed(() => ({
  total: users.value.length,
  active: users.value.filter((user) => user.state).length,
  pendingActivation: users.value.filter((user) => user.pending_activation).length,
  clientAdmins: users.value.filter((user) => user.is_admin).length,
  superusers: users.value.filter((user) => user.is_superuser).length,
}))

function userTypeLabel(user: CentralUser): string {
  const roles: string[] = []

  if (user.is_superuser) {
    roles.push('Super-Usuario')
  }

  if (user.is_admin) {
    roles.push('Admin cliente')
  }

  if (roles.length === 0) {
    return ''
  }

  return roles.join(' · ')
}

function userTypeClass(user: CentralUser): string {
  if (user.is_superuser && user.is_admin) {
    return 'type-superuser-admin'
  }

  if (user.is_superuser) {
    return 'type-superuser'
  }

  if (user.is_admin) {
    return 'type-admin'
  }

  return 'type-default'
}

function stateLabel(state: boolean): string {
  return state ? 'Activo' : 'Inactivo'
}

function stateClass(state: boolean): string {
  return state ? 'state-active' : 'state-inactive'
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

async function loadUsers(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    users.value = await centralUserService.list()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudo cargar el listado de usuarios.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadUsers()
})

function openCreateModal(): void {
  formUser.value = null
  formModalKey.value += 1
  formModalOpen.value = true
}

function openEditModal(user: CentralUser): void {
  formUser.value = user
  formModalKey.value += 1
  formModalOpen.value = true
}

function onUserRowDblClick(user: CentralUser, event: MouseEvent): void {
  if ((event.target as HTMLElement).closest('.actions-cell')) {
    return
  }

  openEditModal(user)
}

function onFormModalOpenChange(isOpen: boolean): void {
  formModalOpen.value = isOpen

  if (!isOpen) {
    formUser.value = null
  }
}

function handleUserSaved(options?: { user?: CentralUser; mailFailed?: boolean }): void {
  void loadUsers()

  if (options?.mailFailed && options.user) {
    formUser.value = options.user
  }
}

function openTenantsModal(user: CentralUser): void {
  selectedUser.value = user
  tenantsModalOpen.value = true
}

function openDeleteModal(user: CentralUser): void {
  selectedUser.value = user
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

async function confirmDeleteUser(): Promise<void> {
  if (!selectedUser.value) {
    return
  }

  deleting.value = true
  deleteError.value = null

  try {
    await centralUserService.delete(selectedUser.value.id)
    deleteModalOpen.value = false
    selectedUser.value = null
    await loadUsers()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      deleteError.value = responseData?.message ?? 'No se pudo eliminar el usuario.'
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
          <h1 class="mt-1 text-2xl font-bold text-slate-900">Usuarios</h1>
          <p class="mt-2 text-sm text-slate-600">
            Usuarios registrados en la base central (softdin_central).
            Doble clic en un usuario para abrir su formulario de edición.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-primary" @click="openCreateModal">
            Crear usuario
          </button>
          <button type="button" class="btn-secondary" :disabled="loading" @click="loadUsers">
            {{ loading ? 'Actualizando...' : 'Actualizar' }}
          </button>
        </div>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div class="stat-card">
          <p class="stat-label">Total usuarios</p>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Activos</p>
          <p class="stat-value">{{ stats.active }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Pendientes por activación</p>
          <p class="stat-value">{{ stats.pendingActivation }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Admon de cliente</p>
          <p class="stat-value">{{ stats.clientAdmins }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Super-Usuarios</p>
          <p class="stat-value">{{ stats.superusers }}</p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div class="border-b border-slate-200 px-4 py-4 sm:px-6">
        <label for="user-search" class="sr-only">Buscar usuarios</label>
        <input
          id="user-search"
          v-model="search"
          type="search"
          placeholder="Buscar por nombre, correo, tipo o estado..."
          class="search-input"
        />
      </div>

      <p v-if="error" class="mx-4 my-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
        {{ error }}
      </p>

      <div v-if="loading" class="px-6 py-12 text-center text-sm text-slate-500">
        Cargando usuarios...
      </div>

      <div
        v-else-if="filteredUsers.length === 0"
        class="px-6 py-12 text-center text-sm text-slate-500"
      >
        {{
          search.trim()
            ? 'No hay usuarios que coincidan con la búsqueda.'
            : 'No hay usuarios registrados en la plataforma central.'
        }}
      </div>

      <div v-else>
        <p class="table-hint">Doble clic en una fila para editar el usuario.</p>
        <div class="overflow-x-auto">
        <table class="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Creado</th>
              <th class="actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="data-row"
              tabindex="0"
              title="Doble clic para editar"
              @dblclick="onUserRowDblClick(user, $event)"
              @keydown.enter="openEditModal(user)"
            >
              <td>
                <div class="user-cell">
                  <CentralUserAvatar
                    :key="`${user.id}-${user.has_avatar}-${user.updated_at ?? ''}`"
                    :user-id="user.id"
                    :name="user.name"
                    :has-avatar="user.has_avatar"
                  />
                  <span class="font-medium text-slate-900">{{ user.name }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span
                  v-if="userTypeLabel(user)"
                  class="type-badge"
                  :class="userTypeClass(user)"
                >
                  {{ userTypeLabel(user) }}
                </span>
              </td>
              <td>
                <span class="state-badge" :class="stateClass(user.state)">
                  {{ stateLabel(user.state) }}
                </span>
                <span v-if="user.pending_activation" class="pending-badge">Pendiente activación</span>
              </td>
              <td class="whitespace-nowrap text-slate-600">{{ formatDate(user.created_at) }}</td>
              <td>
                <div class="actions-cell">
                  <button
                    type="button"
                    class="action-icon-btn"
                    data-tooltip="Clientes"
                    aria-label="Clientes"
                    @click="openTenantsModal(user)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                      <path
                        fill="currentColor"
                        d="M4 4h16v2H4V4zm0 5h10v2H4V9zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="action-icon-btn"
                    data-tooltip="Editar"
                    aria-label="Editar"
                    @click="openEditModal(user)"
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
                    @click="openDeleteModal(user)"
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
        v-if="!loading && filteredUsers.length > 0"
        class="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-6"
      >
        Mostrando {{ filteredUsers.length }} de {{ users.length }} usuario(s)
      </div>
    </section>

    <CentralUserFormModal
      :key="formModalKey"
      :open="formModalOpen"
      :user="formUser"
      @update:open="onFormModalOpenChange"
      @saved="handleUserSaved"
    />
    <CentralUserTenantsModal v-model:open="tenantsModalOpen" :user="selectedUser" @changed="loadUsers" />

    <Teleport to="body">
      <div v-if="deleteModalOpen && selectedUser" class="modal-backdrop" @click.self="closeDeleteModal">
        <div class="modal-panel modal-panel-danger" role="dialog" aria-modal="true">
          <header class="modal-header">
            <div>
              <p class="modal-kicker modal-kicker-danger">Eliminación permanente</p>
              <h2 class="modal-title">¿Eliminar «{{ selectedUser.name }}»?</h2>
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
              Si elimina este usuario, se borrará de forma
              <strong>permanente e irreversible</strong> de SoftDIN Central.
            </p>
            <p>
              Correo:
              <strong>{{ selectedUser.email }}</strong>
            </p>
            <p>
              También se eliminarán todas sus asociaciones con clientes
              ({{ selectedUser.tenants_count ?? 0 }} cliente(s) vinculado(s)).
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
            <button type="button" class="btn-danger" :disabled="deleting" @click="confirmDeleteUser">
              {{ deleting ? 'Eliminando...' : 'Sí, eliminar permanentemente' }}
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

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.users-table th {
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
}

.users-table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 0.75rem 1rem;
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

.users-table tbody tr:hover {
  background: #f8fafc;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.type-badge {
  display: inline-flex;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-superuser {
  background: #e0e7ff;
  color: #3730a3;
}

.type-superuser-admin {
  background: linear-gradient(90deg, #e0e7ff 0%, #dbeafe 100%);
  color: #312e81;
}

.type-admin {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-default {
  background: #f1f5f9;
  color: #334155;
}

.state-badge {
  display: inline-flex;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.state-active {
  background: #dcfce7;
  color: #166534;
}

.state-inactive {
  background: #fee2e2;
  color: #991b1b;
}

.pending-badge {
  display: inline-flex;
  margin-left: 0.375rem;
  border-radius: 9999px;
  background: #fef3c7;
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #92400e;
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

.action-icon {
  height: 1.125rem;
  width: 1.125rem;
}

.action-icon-btn-danger {
  color: #b91c1c;
  border-color: #fecaca;
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

.space-y-3 > * + * {
  margin-top: 0.75rem;
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

.text-red-700 {
  color: #b91c1c;
}

.alert-error {
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}
</style>
