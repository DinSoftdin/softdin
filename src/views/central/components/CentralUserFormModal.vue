<script setup lang="ts">
import { computed, onBeforeUnmount, provide, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { centralUserService } from '@/services/central-user.service'
import type { CentralUser } from '@/types/central-user'
import { centralAuditRouteForUser } from '@/utils/central-audit-navigation'
import { CENTRAL_USER_FIELD_HELP } from '@/utils/central-form-help'
import CentralFormLabel from '@/views/central/components/CentralFormLabel.vue'
import CentralFormRequiredLegend from '@/views/central/components/CentralFormRequiredLegend.vue'
import CentralFieldHelp from '@/views/central/components/CentralFieldHelp.vue'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  user: CentralUser | null
}>()

const emit = defineEmits<{
  saved: [options?: { user?: CentralUser; mailFailed?: boolean }]
}>()

const router = useRouter()

function buildMailFailureMessage(response: {
  message: string
  debug_activation_url?: string
  debug_mail_error?: string
}): string {
  let message = response.message

  if (import.meta.env.DEV && response.debug_mail_error) {
    message += ` Detalle: ${response.debug_mail_error}`
  }

  if (import.meta.env.DEV && response.debug_activation_url) {
    message += ` Enlace de desarrollo: ${response.debug_activation_url}`
  }

  return `${message} Puede reenviar la invitación desde este formulario.`
}

const isCreateMode = computed(() => props.user === null)

const saving = ref(false)
const resendingInvitation = ref(false)
const mailFailurePending = ref(false)
const successMessage = ref<string | null>(null)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const existingAvatarUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const removePhoto = ref(false)
const loadingAvatar = ref(false)

const form = reactive({
  name: '',
  email: '',
  state: true,
})

const activeHelpKey = ref<string | null>(null)
provide('centralFieldHelpGroup', activeHelpKey)

const userInitials = computed(() => {
  const name = form.name.trim() || props.user?.name?.trim() || ''
  if (!name) {
    return '?'
  }

  const parts = name.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
})

const displayedAvatar = computed(() => {
  if (removePhoto.value) {
    return null
  }

  return previewUrl.value ?? existingAvatarUrl.value
})

const hasPhoto = computed(() => Boolean(displayedAvatar.value))

const photoHint = computed(() => {
  if (selectedFile.value) {
    return `Nueva foto seleccionada: ${selectedFile.value.name}`
  }

  if (removePhoto.value) {
    return 'El avatar se eliminará al guardar.'
  }

  if (props.user?.has_avatar) {
    return 'Puede reemplazar el avatar actual o eliminarlo.'
  }

  return 'Puede agregar un avatar al usuario.'
})

function clearPreview(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function clearExistingAvatarUrl(): void {
  if (existingAvatarUrl.value) {
    URL.revokeObjectURL(existingAvatarUrl.value)
    existingAvatarUrl.value = null
  }
}

function resetPhotoState(): void {
  removePhoto.value = false
  selectedFile.value = null
  clearPreview()
  clearExistingAvatarUrl()

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function loadCurrentAvatar(): Promise<void> {
  clearExistingAvatarUrl()

  if (!props.user?.has_avatar) {
    return
  }

  loadingAvatar.value = true

  try {
    const blob = await centralUserService.fetchAvatar(props.user.id)
    existingAvatarUrl.value = URL.createObjectURL(blob)
  } catch {
    existingAvatarUrl.value = null
  } finally {
    loadingAvatar.value = false
  }
}

function resetCreateForm(): void {
  form.name = ''
  form.email = ''
  form.state = true
  if (!mailFailurePending.value) {
    error.value = null
  }
  fieldErrors.value = {}
  resetPhotoState()
}

function resetEditForm(): void {
  form.name = props.user?.name ?? ''
  form.email = props.user?.email ?? ''
  form.state = props.user?.state ?? true
  if (!mailFailurePending.value) {
    error.value = null
  } else {
    mailFailurePending.value = false
  }
  successMessage.value = null
  fieldErrors.value = {}
  resetPhotoState()
}

function resetForm(): void {
  if (isCreateMode.value) {
    resetCreateForm()
    return
  }

  resetEditForm()
}

function openFilePicker(): void {
  fileInput.value?.click()
}

function onPhotoSelected(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    error.value = 'Seleccione un archivo de imagen válido (JPG, PNG o WebP).'
    input.value = ''
    return
  }

  error.value = null
  removePhoto.value = false
  clearPreview()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function markRemovePhoto(): void {
  removePhoto.value = true
  selectedFile.value = null
  clearPreview()

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function cancelPhotoChanges(): void {
  removePhoto.value = false
  selectedFile.value = null
  clearPreview()

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function close(): void {
  open.value = false
}

function openAuditHistory(): void {
  if (!props.user) {
    return
  }

  close()
  void router.push(centralAuditRouteForUser({
    id: props.user.id,
    name: props.user.name,
  }))
}

function applyApiErrors(errors?: Record<string, string[]>): void {
  if (!errors) {
    return
  }

  const mapped: Record<string, string> = {}
  for (const [key, messages] of Object.entries(errors)) {
    if (messages[0]) {
      mapped[key] = messages[0]
    }
  }

  fieldErrors.value = mapped
}

async function handleResendInvitation(): Promise<void> {
  if (!props.user) {
    return
  }

  resendingInvitation.value = true
  error.value = null
  successMessage.value = null

  try {
    const response = await centralUserService.resendInvitation(props.user.id)
    if (!response.mail_sent) {
      error.value = buildMailFailureMessage(response)
      return
    }
    successMessage.value = response.message
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string }
      error.value = responseData?.message ?? 'No se pudo reenviar la invitación.'
      return
    }
    error.value = 'Error de conexión con el servidor.'
  } finally {
    resendingInvitation.value = false
  }
}

async function handleSubmit(): Promise<void> {
  saving.value = true
  error.value = null
  fieldErrors.value = {}

  try {
    if (isCreateMode.value) {
      const response = await centralUserService.create(
        {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          state: form.state,
        },
        { photo: selectedFile.value ?? undefined },
      )

      emit('saved', { user: response.user, mailFailed: !response.mail_sent })

      if (!response.mail_sent) {
        mailFailurePending.value = true
        error.value = buildMailFailureMessage(response)
        return
      }
    } else if (props.user) {
      await centralUserService.update(
        props.user.id,
        {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          state: form.state,
        },
        {
          photo: selectedFile.value,
          removePhoto: removePhoto.value,
        },
      )
    }

    emit('saved')
    close()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as {
        message?: string
        errors?: Record<string, string[]>
      }
      applyApiErrors(responseData?.errors)
      error.value = responseData?.message ?? 'No se pudo guardar el usuario.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    saving.value = false
  }
}

watch(
  () => open.value,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''

    if (!isOpen) {
      activeHelpKey.value = null
    }
  },
  { immediate: true },
)

watch(
  () => [open.value, props.user?.id ?? 'create'] as const,
  ([isOpen]) => {
    if (isOpen) {
      resetForm()

      if (!isCreateMode.value) {
        void loadCurrentAvatar()
      }
    } else {
      resetPhotoState()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  resetPhotoState()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop">
      <form class="modal-panel" autocomplete="off" @submit.prevent="handleSubmit">
        <header class="modal-header">
          <div>
            <p class="modal-kicker">{{ isCreateMode ? 'Nuevo usuario' : 'Editar usuario' }}</p>
            <h2 class="modal-title">
              {{ isCreateMode ? 'Crear usuario central' : user?.name }}
            </h2>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar" @click="close">×</button>
        </header>

        <div class="modal-body space-y-4">
          <CentralFormRequiredLegend />

          <p class="form-recommendation">
            Doble clic en el icono
            <span class="form-recommendation-icon" aria-hidden="true">ℹ</span>
            de cada campo para ver su descripción; al alejar el mouse se oculta.
            <template v-if="isCreateMode">
              Al guardar se enviará un correo de activación para que el usuario defina su contraseña.
            </template>
            <template v-else>
              Use el historial de cambios para revisar la auditoría.
            </template>
          </p>

          <div class="field-block">
            <CentralFormLabel optional help-trigger="dblclick" :help="CENTRAL_USER_FIELD_HELP.avatar">
              Avatar
            </CentralFormLabel>

            <div class="avatar-row">
              <span class="avatar-preview">
                <img
                  v-if="hasPhoto"
                  :src="displayedAvatar!"
                  alt="Avatar del usuario"
                  class="h-full w-full object-cover"
                />
                <span v-else class="avatar-initials">{{ userInitials }}</span>
              </span>

              <div class="avatar-actions">
                <p class="avatar-hint">{{ loadingAvatar ? 'Cargando avatar...' : photoHint }}</p>

                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  @change="onPhotoSelected"
                />

                <div class="avatar-buttons">
                  <button type="button" class="btn-secondary" :disabled="saving" @click="openFilePicker">
                    {{
                      props.user?.has_avatar || selectedFile
                        ? 'Cambiar avatar'
                        : 'Agregar avatar'
                    }}
                  </button>

                  <button
                    v-if="props.user?.has_avatar && !removePhoto && !selectedFile"
                    type="button"
                    class="btn-danger-outline"
                    :disabled="saving"
                    @click="markRemovePhoto"
                  >
                    Eliminar avatar
                  </button>

                  <button
                    v-if="removePhoto || selectedFile"
                    type="button"
                    class="btn-secondary"
                    :disabled="saving"
                    @click="cancelPhotoChanges"
                  >
                    Deshacer cambio
                  </button>
                </div>

                <p v-if="fieldErrors.photo" class="field-error">{{ fieldErrors.photo }}</p>
              </div>
            </div>
          </div>

          <div class="field-block">
            <CentralFormLabel for="user-name" required help-trigger="dblclick" :help="CENTRAL_USER_FIELD_HELP.name">
              Nombre
            </CentralFormLabel>
            <input
              id="user-name"
              v-model="form.name"
              type="text"
              required
              autocomplete="off"
              class="input-field"
            />
            <p v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</p>
          </div>

          <div class="field-block">
            <CentralFormLabel for="user-email" required help-trigger="dblclick" :help="CENTRAL_USER_FIELD_HELP.email">
              Correo
            </CentralFormLabel>
            <input
              id="user-email"
              v-model="form.email"
              type="email"
              required
              autocomplete="off"
              class="input-field"
            />
            <p v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</p>
          </div>

          <div class="field-block field-block-checkbox">
            <div class="checkbox-row">
              <label class="checkbox-label">
                <input v-model="form.state" type="checkbox" />
                <span>Activo</span>
                <CentralFieldHelp trigger="dblclick" :text="CENTRAL_USER_FIELD_HELP.state" />
              </label>
            </div>
            <p v-if="fieldErrors.state" class="field-error">{{ fieldErrors.state }}</p>
          </div>

          <div
            v-if="!isCreateMode && user?.pending_activation"
            class="invitation-notice"
          >
            <p class="invitation-notice-title">Activación pendiente</p>
            <p class="invitation-notice-text">
              Este usuario aún no ha definido su contraseña. Puede reenviarle el correo de activación.
            </p>
            <button
              type="button"
              class="btn-secondary"
              :disabled="saving || resendingInvitation"
              @click="handleResendInvitation"
            >
              {{ resendingInvitation ? 'Reenviando...' : 'Reenviar invitación' }}
            </button>
          </div>

          <p v-if="successMessage" class="alert-success">{{ successMessage }}</p>
          <p v-if="error" class="alert-error">{{ error }}</p>
        </div>

        <footer class="modal-footer">
          <button
            v-if="!isCreateMode && user"
            type="button"
            class="btn-link"
            @click="openAuditHistory"
          >
            Ver historial de cambios
          </button>
          <div class="modal-footer-actions">
            <button type="button" class="btn-secondary" @click="close">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : isCreateMode ? 'Crear usuario' : 'Guardar cambios' }}
            </button>
          </div>
        </footer>
      </form>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  padding: 1rem;
}

.modal-panel {
  position: relative;
  z-index: 101;
  width: 100%;
  max-width: 32rem;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
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
  flex: 1;
  min-height: 0;
  padding: 1rem 1.25rem;
  overflow-y: auto;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid #e2e8f0;
  padding: 0.875rem 1.25rem;
}

.modal-footer-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.btn-link {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-brand-700);
  text-decoration: underline;
  cursor: pointer;
}

.field-block {
  position: relative;
}

.field-block-checkbox .checkbox-label {
  cursor: pointer;
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

.checkbox-row {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #334155;
}

.field-error {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #b91c1c;
}

.field-hint {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}

.form-recommendation {
  margin: 0;
  border-radius: 0.5rem;
  background: #f8fafc;
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #475569;
}

.form-recommendation-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background: #e2e8f0;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #64748b;
  vertical-align: middle;
}

.alert-error {
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.alert-success {
  border-radius: 0.5rem;
  background: #ecfdf5;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #047857;
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
  background: var(--color-brand-600);
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.avatar-row {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 480px) {
  .avatar-row {
    flex-direction: row;
    align-items: center;
  }
}

.avatar-preview {
  display: flex;
  height: 5rem;
  width: 5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background: #e2e8f0;
  color: #475569;
}

.avatar-initials {
  font-size: 1.125rem;
  font-weight: 700;
}

.avatar-actions {
  flex: 1;
}

.avatar-hint {
  font-size: 0.875rem;
  color: #64748b;
}

.avatar-buttons {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-danger-outline {
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
  background: #fff;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.btn-danger-outline:disabled {
  opacity: 0.6;
}

.invitation-notice {
  border: 1px solid #fde68a;
  border-radius: 0.75rem;
  background: #fffbeb;
  padding: 0.875rem 1rem;
}

.invitation-notice-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
}

.invitation-notice-text {
  margin: 0.375rem 0 0.75rem;
  font-size: 0.8125rem;
  color: #78350f;
}
</style>
