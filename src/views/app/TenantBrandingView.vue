<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()

const fileInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const removeLogo = ref(false)

const tenantInitials = computed(() => {
  const name = auth.activeTenant?.name?.trim() ?? ''
  if (!name) {
    return '?'
  }

  const parts = name.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
})

const displayedLogo = computed(() => {
  if (removeLogo.value) {
    return null
  }

  return previewUrl.value ?? auth.tenantLogoUrl
})

const hasLogo = computed(() => Boolean(displayedLogo.value))

const logoHint = computed(() => {
  if (selectedFile.value) {
    return `Nuevo logo seleccionado: ${selectedFile.value.name}`
  }

  if (removeLogo.value) {
    return 'El logo actual se eliminará al guardar.'
  }

  if (auth.activeTenant?.has_logo) {
    return 'Puede reemplazar el logo actual o eliminarlo.'
  }

  return 'Puede agregar el logo de la empresa.'
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

function onLogoSelected(event: Event): void {
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
  removeLogo.value = false
  clearPreview()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function markRemoveLogo(): void {
  removeLogo.value = true
  selectedFile.value = null
  clearPreview()

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function cancelLogoChanges(): void {
  removeLogo.value = false
  selectedFile.value = null
  clearPreview()

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleSave(): Promise<void> {
  if (!auth.canManageActiveTenantLogo) {
    error.value = 'No tiene permiso para modificar el logo de este cliente.'
    return
  }

  if (!selectedFile.value && !removeLogo.value) {
    error.value = 'No hay cambios pendientes.'
    return
  }

  saving.value = true
  message.value = null
  error.value = null

  try {
    if (selectedFile.value) {
      await auth.uploadTenantLogo(selectedFile.value)
      message.value = 'Logo de empresa actualizado.'
    } else if (removeLogo.value && auth.activeTenant?.has_logo) {
      await auth.deleteTenantLogo()
      message.value = 'Logo de empresa eliminado.'
    }

    selectedFile.value = null
    removeLogo.value = false
    clearPreview()

    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as {
        message?: string
        errors?: Record<string, string[]>
      }
      const firstFieldError = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : undefined
      error.value = firstFieldError ?? responseData?.message ?? 'No se pudo guardar el logo.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    saving.value = false
  }
}

onUnmounted(() => clearPreview())
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Logo del cliente</h1>
      <p class="mt-1 text-sm text-slate-600">
        Imagen que se muestra en el menú lateral para
        <span class="font-medium text-slate-800">{{ auth.activeTenant?.name }}</span>.
      </p>
    </div>

    <div v-if="!auth.canManageActiveTenantLogo" class="alert alert-warning">
      Solo el propietario o un administrador del cliente puede modificar el logo.
    </div>

    <section class="card">
      <div class="logo-row">
        <span class="logo-preview">
          <img
            v-if="hasLogo"
            :src="displayedLogo ?? undefined"
            :alt="auth.activeTenant?.name ?? 'Logo del cliente'"
            class="h-full w-full object-contain"
          />
          <span v-else>{{ tenantInitials }}</span>
        </span>

        <div class="min-w-0 flex-1">
          <p class="text-sm text-slate-600">{{ logoHint }}</p>
          <p class="mt-1 text-xs text-slate-500">
            Formatos: JPG, PNG o WebP. Tamaño máximo 10 MB.
          </p>

          <div v-if="auth.canManageActiveTenantLogo" class="mt-4 flex flex-wrap gap-2">
            <button type="button" class="btn-secondary" @click="openFilePicker">
              {{ auth.activeTenant?.has_logo || selectedFile ? 'Cambiar logo' : 'Agregar logo' }}
            </button>

            <button
              v-if="auth.activeTenant?.has_logo && !removeLogo && !selectedFile"
              type="button"
              class="btn-danger-outline"
              @click="markRemoveLogo"
            >
              Eliminar logo
            </button>

            <button
              v-if="selectedFile || removeLogo"
              type="button"
              class="btn-ghost"
              @click="cancelLogoChanges"
            >
              Cancelar cambios
            </button>
          </div>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onLogoSelected"
      />

      <div v-if="auth.canManageActiveTenantLogo" class="mt-6 flex items-center gap-3 border-t border-slate-100 pt-6">
        <button
          type="button"
          class="btn-primary"
          :disabled="saving || (!selectedFile && !removeLogo)"
          @click="handleSave"
        >
          {{ saving ? 'Guardando…' : 'Guardar logo' }}
        </button>
      </div>

      <p v-if="message" class="mt-4 text-sm text-emerald-700">{{ message }}</p>
      <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    </section>
  </div>
</template>

<style scoped>
.card {
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.logo-row {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.logo-preview {
  display: flex;
  height: 5rem;
  width: 5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-brand-700);
}

.alert {
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.alert-warning {
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.btn-primary,
.btn-secondary,
.btn-danger-outline,
.btn-ghost {
  border-radius: 0.5rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}

.btn-primary {
  background: var(--color-brand-600);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-brand-700);
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-secondary {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-danger-outline {
  border: 1px solid #fecaca;
  background: #fff;
  color: #b91c1c;
}

.btn-danger-outline:hover {
  background: #fef2f2;
}

.btn-ghost {
  color: #64748b;
}

.btn-ghost:hover {
  background: #f8fafc;
  color: #334155;
}
</style>
