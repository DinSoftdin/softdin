<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()

const fileInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  name: auth.user?.name ?? '',
  currentPassword: '',
  password: '',
  passwordConfirmation: '',
})

const saving = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const removePhoto = ref(false)

const userInitials = computed(() => {
  const name = form.name.trim() || auth.user?.name?.trim() || ''
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

  return previewUrl.value ?? auth.avatarUrl
})

const hasPhoto = computed(() => Boolean(displayedAvatar.value))

const photoHint = computed(() => {
  if (selectedFile.value) {
    return `Nueva foto seleccionada: ${selectedFile.value.name}`
  }

  if (removePhoto.value) {
    return 'La foto actual se eliminará al guardar.'
  }

  if (auth.user?.has_avatar) {
    return 'Puede reemplazar la foto actual o eliminarla.'
  }

  return 'Puede agregar una foto de perfil.'
})

function clearPreview(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
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

function validateForm(): string | null {
  if (!form.name.trim()) {
    return 'El nombre es obligatorio.'
  }

  const wantsPasswordChange = Boolean(
    form.password || form.currentPassword || form.passwordConfirmation,
  )

  if (wantsPasswordChange) {
    if (!form.currentPassword) {
      return 'Ingrese la contraseña actual para cambiarla.'
    }

    if (!form.password || form.password.length < 8) {
      return 'La nueva contraseña debe tener al menos 8 caracteres.'
    }

    if (form.password !== form.passwordConfirmation) {
      return 'La confirmación de contraseña no coincide.'
    }
  }

  return null
}

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: Record<string, string[]> }
    const firstFieldError = data?.errors
      ? Object.values(data.errors).flat()[0]
      : undefined

    return firstFieldError ?? data?.message ?? 'No se pudo guardar el perfil.'
  }

  return 'Error de conexión con el servidor.'
}

async function handleSubmit(): Promise<void> {
  message.value = null
  error.value = null

  const validationError = validateForm()
  if (validationError) {
    error.value = validationError
    return
  }

  const nameChanged = form.name.trim() !== (auth.user?.name ?? '')
  const wantsPasswordChange = Boolean(form.password)
  const wantsPhotoChange = Boolean(selectedFile.value) || removePhoto.value

  if (!nameChanged && !wantsPasswordChange && !wantsPhotoChange) {
    error.value = 'No hay cambios por guardar.'
    return
  }

  saving.value = true

  try {
    if (removePhoto.value && auth.user?.has_avatar) {
      await auth.deleteProfilePhoto()
    } else if (selectedFile.value) {
      await auth.uploadProfilePhoto(selectedFile.value)
    }

    if (nameChanged || wantsPasswordChange) {
      const payload: {
        name: string
        password?: string
        password_confirmation?: string
        current_password?: string
      } = {
        name: form.name.trim(),
      }

      if (wantsPasswordChange) {
        payload.password = form.password
        payload.password_confirmation = form.passwordConfirmation
        payload.current_password = form.currentPassword
      }

      await auth.updateProfile(payload)
    }

    form.currentPassword = ''
    form.password = ''
    form.passwordConfirmation = ''
    removePhoto.value = false
    selectedFile.value = null
    clearPreview()

    if (fileInput.value) {
      fileInput.value.value = ''
    }

    message.value = 'Perfil actualizado correctamente.'
  } catch (err) {
    error.value = extractError(err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  form.name = auth.user?.name ?? ''
})

onUnmounted(() => {
  clearPreview()
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <form
      class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"
      @submit.prevent="handleSubmit"
    >
      <p class="text-sm font-medium text-brand-600">Mi cuenta</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-900">Editar perfil</h1>
      <p class="mt-2 text-sm text-slate-500">
        Usuario central en <strong>softdin_central</strong>. Modifique nombre, foto y contraseña.
      </p>

      <div class="mt-8 border-t border-slate-100 pt-6">
        <p class="label-section">Foto de perfil</p>
        <p class="mt-1 text-xs text-slate-500">
          Máximo recomendado 512×512 px y 512 KB. Si la imagen es mayor, se ajustará al guardar.
        </p>

        <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <span class="avatar-preview">
            <img
              v-if="hasPhoto"
              :src="displayedAvatar!"
              alt="Foto de perfil"
              class="h-full w-full object-cover"
            />
            <span v-else class="text-xl font-semibold">{{ userInitials }}</span>
          </span>

          <div class="flex-1 space-y-2">
            <p class="text-sm text-slate-600">{{ photoHint }}</p>

            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onPhotoSelected"
            />

            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn-secondary" @click="openFilePicker">
                {{ auth.user?.has_avatar || selectedFile ? 'Cambiar foto' : 'Agregar foto' }}
              </button>

              <button
                v-if="auth.user?.has_avatar && !removePhoto && !selectedFile"
                type="button"
                class="btn-danger-outline"
                @click="markRemovePhoto"
              >
                Eliminar foto
              </button>

              <button
                v-if="removePhoto || selectedFile"
                type="button"
                class="btn-secondary"
                @click="cancelPhotoChanges"
              >
                Deshacer cambio de foto
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 space-y-4 border-t border-slate-100 pt-6">
        <p class="label-section">Datos personales</p>

        <div>
          <label for="email" class="label">Correo</label>
          <input
            id="email"
            type="email"
            :value="auth.user?.email"
            disabled
            class="input input-disabled"
          />
        </div>

        <div>
          <label for="name" class="label">Nombre</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            autocomplete="name"
            class="input"
          />
        </div>
      </div>

      <div class="mt-8 space-y-4 border-t border-slate-100 pt-6">
        <div>
          <p class="label-section">Contraseña</p>
          <p class="mt-1 text-xs text-slate-500">
            Opcional. Complete estos campos solo si desea cambiar la contraseña.
          </p>
        </div>

        <div>
          <label for="currentPassword" class="label">Contraseña actual</label>
          <input
            id="currentPassword"
            v-model="form.currentPassword"
            type="password"
            autocomplete="current-password"
            class="input"
          />
        </div>

        <div>
          <label for="password" class="label">Nueva contraseña</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            class="input"
          />
        </div>

        <div>
          <label for="passwordConfirmation" class="label">Confirmar nueva contraseña</label>
          <input
            id="passwordConfirmation"
            v-model="form.passwordConfirmation"
            type="password"
            autocomplete="new-password"
            class="input"
          />
        </div>
      </div>

      <p v-if="message" class="alert-success mt-6">{{ message }}</p>
      <p v-if="error" class="alert-error mt-6">{{ error }}</p>

      <div class="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.label-section {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
}

.input:focus {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-100);
}

.input-disabled {
  background: #f1f5f9;
  color: #64748b;
}

.avatar-preview {
  display: flex;
  height: 6rem;
  width: 6rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background-color: var(--color-brand-600);
  color: #fff;
}

.btn-primary {
  border-radius: 0.5rem;
  background-color: var(--color-brand-600);
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-brand-700);
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
  color: #334155;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-danger-outline {
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
  background: #fff;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.btn-danger-outline:hover {
  background: #fef2f2;
}

.alert-success {
  border-radius: 0.5rem;
  background: #f0fdf4;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #166534;
}

.alert-error {
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.text-brand-600 {
  color: var(--color-brand-600);
}
</style>
