<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { tenantLogoPublicUrl, tenantService } from '@/services/tenant.service'
import type { CentralTenant } from '@/types/tenant'
import { centralAuditRouteForTenant } from '@/utils/central-audit-navigation'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  tenant: CentralTenant | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const router = useRouter()

const saving = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const removeLogo = ref(false)

const form = reactive({
  name: '',
  slug: '',
  status: 'active',
  domain: '',
})

const tenantInitials = computed(() => {
  const name = form.name.trim() || props.tenant?.name || ''
  if (!name) {
    return '?'
  }

  const parts = name.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
})

const existingLogoUrl = computed(() => {
  if (!props.tenant?.has_logo || removeLogo.value) {
    return null
  }

  const version = props.tenant.updated_at
    ? new Date(props.tenant.updated_at).getTime()
    : 0

  return tenantLogoPublicUrl(props.tenant.slug, version)
})

const displayedLogo = computed(() => {
  if (removeLogo.value) {
    return null
  }

  return previewUrl.value ?? existingLogoUrl.value
})

const hasLogo = computed(() => Boolean(displayedLogo.value))

const logoHint = computed(() => {
  if (selectedFile.value) {
    return `Nuevo logo seleccionado: ${selectedFile.value.name}`
  }

  if (removeLogo.value) {
    return 'El logo se eliminará al guardar.'
  }

  if (props.tenant?.has_logo) {
    return 'Puede reemplazar el logo actual o eliminarlo.'
  }

  return 'Puede agregar el logo del cliente.'
})

function clearPreview(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function resetLogoState(): void {
  removeLogo.value = false
  selectedFile.value = null
  clearPreview()

  if (fileInput.value) {
    fileInput.value.value = ''
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
  resetLogoState()
}

function primaryDomainOf(tenant: CentralTenant): string {
  const domains = tenant.domains ?? []
  const primary = domains.find((item) => item.is_primary)
  return primary?.domain ?? domains[0]?.domain ?? ''
}

function resetForm(): void {
  if (!props.tenant) {
    return
  }

  form.name = props.tenant.name
  form.slug = props.tenant.slug
  form.status = props.tenant.status
  form.domain = primaryDomainOf(props.tenant)
  error.value = null
  fieldErrors.value = {}
  resetLogoState()
}

function close(): void {
  open.value = false
}

function openAuditHistory(): void {
  if (!props.tenant) {
    return
  }

  close()
  void router.push(centralAuditRouteForTenant({
    id: props.tenant.id,
    name: props.tenant.name,
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

async function handleSubmit(): Promise<void> {
  if (!props.tenant) {
    return
  }

  saving.value = true
  error.value = null
  fieldErrors.value = {}

  try {
    await tenantService.updateCentral(
      props.tenant.id,
      {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        status: form.status,
        domain: form.domain.trim(),
      },
      {
        logo: selectedFile.value,
        removeLogo: removeLogo.value,
      },
    )

    emit('saved')
    close()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as {
        message?: string
        errors?: Record<string, string[]>
      }
      applyApiErrors(responseData?.errors)
      error.value = responseData?.message ?? 'No se pudo actualizar el cliente.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    saving.value = false
  }
}

watch(
  () => [open.value, props.tenant?.id] as const,
  ([isOpen]) => {
    if (isOpen) {
      resetForm()
    } else {
      resetLogoState()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open && tenant" class="modal-backdrop" @click.self="close">
      <form class="modal-panel" @submit.prevent="handleSubmit">
        <header class="modal-header">
          <div>
            <p class="modal-kicker">Editar cliente</p>
            <h2 class="modal-title">{{ tenant.name }}</h2>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar" @click="close">×</button>
        </header>

        <div class="modal-body space-y-4">
          <div>
            <p class="label">Logo del cliente</p>
            <div class="logo-row">
              <span class="logo-preview">
                <img
                  v-if="hasLogo"
                  :src="displayedLogo!"
                  alt="Logo del cliente"
                  class="h-full w-full object-cover"
                />
                <span v-else class="logo-initials">{{ tenantInitials }}</span>
              </span>

              <div class="logo-actions">
                <p class="logo-hint">{{ logoHint }}</p>

                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="hidden"
                  :disabled="saving"
                  @change="onLogoSelected"
                />

                <div class="logo-buttons">
                  <button
                    type="button"
                    class="btn-secondary"
                    :disabled="saving"
                    @click="openFilePicker"
                  >
                    {{
                      tenant.has_logo || selectedFile
                        ? 'Cambiar logo'
                        : 'Agregar logo'
                    }}
                  </button>

                  <button
                    v-if="tenant.has_logo && !removeLogo && !selectedFile"
                    type="button"
                    class="btn-danger-outline"
                    :disabled="saving"
                    @click="markRemoveLogo"
                  >
                    Eliminar logo
                  </button>

                  <button
                    v-if="removeLogo || selectedFile"
                    type="button"
                    class="btn-secondary"
                    :disabled="saving"
                    @click="cancelLogoChanges"
                  >
                    Deshacer cambio
                  </button>
                </div>

                <p v-if="fieldErrors.logo" class="field-error">{{ fieldErrors.logo }}</p>
              </div>
            </div>
          </div>

          <div>
            <label for="tenant-name" class="label">Nombre</label>
            <input id="tenant-name" v-model="form.name" type="text" required class="input-field" />
            <p v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</p>
          </div>

          <div>
            <label for="tenant-slug" class="label">Sigla (slug)</label>
            <input
              id="tenant-slug"
              v-model="form.slug"
              type="text"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              class="input-field font-mono text-sm"
            />
            <p v-if="fieldErrors.slug" class="field-error">{{ fieldErrors.slug }}</p>
          </div>

          <div>
            <label for="tenant-status" class="label">Estado</label>
            <select id="tenant-status" v-model="form.status" class="input-field">
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
            </select>
            <p v-if="fieldErrors.status" class="field-error">{{ fieldErrors.status }}</p>
          </div>

          <div>
            <label for="tenant-domain" class="label">Dominio principal</label>
            <input id="tenant-domain" v-model="form.domain" type="text" required class="input-field" />
            <p v-if="fieldErrors.domain" class="field-error">{{ fieldErrors.domain }}</p>
          </div>

          <div>
            <label for="tenant-database" class="label">Base de datos</label>
            <input
              id="tenant-database"
              :value="tenant.database"
              type="text"
              disabled
              class="input-field input-disabled"
            />
            <p class="field-hint">No se puede modificar; define la relación con la BD del tenant.</p>
          </div>

          <p v-if="error" class="alert-error">{{ error }}</p>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn-link" @click="openAuditHistory">
            Ver historial de cambios
          </button>
          <div class="modal-footer-actions">
            <button type="button" class="btn-secondary" @click="close">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar cambios' }}
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
  padding: 1rem 1.25rem;
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

.input-disabled {
  background: #f8fafc;
  color: #64748b;
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

.alert-error {
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
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

.space-y-4 > * + * {
  margin-top: 1rem;
}

.logo-row {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

@media (min-width: 480px) {
  .logo-row {
    flex-direction: row;
    align-items: flex-start;
  }
}

.logo-preview {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
  overflow: hidden;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #e2e8f0;
}

.logo-initials {
  font-size: 1rem;
  font-weight: 600;
  color: #64748b;
}

.logo-actions {
  flex: 1;
  min-width: 0;
}

.logo-hint {
  font-size: 0.75rem;
  color: #64748b;
}

.logo-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-danger-outline {
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
  background: #fff;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.hidden {
  display: none;
}
</style>
