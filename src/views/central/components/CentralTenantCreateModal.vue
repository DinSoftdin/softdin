<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import axios from 'axios'
import { tenantService } from '@/services/tenant.service'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  saved: []
}>()

const saving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const form = reactive({
  name: '',
  slug: '',
  domain: '',
  database: '',
  owner_email: '',
})

const tenantInitials = computed(() => {
  const name = form.name.trim()
  if (!name) {
    return '?'
  }

  const parts = name.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
})

const hasLogo = computed(() => Boolean(previewUrl.value))

const logoHint = computed(() => {
  if (selectedFile.value) {
    return `Nuevo logo seleccionado: ${selectedFile.value.name}`
  }

  return 'Puede agregar el logo del cliente (JPG, PNG o WebP).'
})

function clearPreview(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function resetLogoState(): void {
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
  clearPreview()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function cancelLogoSelection(): void {
  resetLogoState()
}

const suggestedDatabase = computed(() => {
  const slug = normalizeSlug(form.slug)
  if (!slug) {
    return ''
  }

  return `din_${slug}`
})

const suggestedDomain = computed(() => {
  const slug = normalizeSlug(form.slug)
  if (!slug) {
    return ''
  }

  return `${slug}.localhost`
})

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function slugFromName(name: string): string {
  return normalizeSlug(
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-'),
  )
}

function resetForm(): void {
  form.name = ''
  form.slug = ''
  form.domain = ''
  form.database = ''
  form.owner_email = ''
  error.value = null
  successMessage.value = null
  fieldErrors.value = {}
  resetLogoState()
}

function close(): void {
  open.value = false
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
  saving.value = true
  error.value = null
  successMessage.value = null
  fieldErrors.value = {}

  const slug = normalizeSlug(form.slug)
  const payload = {
    name: form.name.trim(),
    slug,
    migrate: true,
    seed: true,
    ...(form.domain.trim() ? { domain: form.domain.trim() } : {}),
    ...(form.database.trim() ? { database: form.database.trim() } : {}),
    ...(form.owner_email.trim() ? { owner_email: form.owner_email.trim().toLowerCase() } : {}),
  }

  try {
    const response = await tenantService.createCentral(payload, {
      logo: selectedFile.value ?? undefined,
    })
    const provision = response.provision

    successMessage.value = [
      response.message,
      provision.database_created ? `Base de datos «${provision.database}» creada.` : null,
      provision.migrated ? 'Migraciones aplicadas.' : null,
      provision.seeded ? 'Datos maestros cargados (seed).' : null,
    ].filter(Boolean).join(' ')

    emit('saved')

    if (!provision.seeded) {
      error.value = 'El cliente se creó, pero no se confirmó la carga de datos maestros (seed).'
      return
    }

    close()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as {
        message?: string
        errors?: Record<string, string[]>
      }
      applyApiErrors(responseData?.errors)
      error.value = responseData?.message ?? 'No se pudo crear el cliente.'
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
    if (isOpen) {
      resetForm()
    } else {
      resetLogoState()
    }
  },
)

watch(
  () => form.name,
  (name, previous) => {
    if (!open.value || form.slug.trim() !== '') {
      return
    }

    if (previous === '' && name.trim() !== '') {
      form.slug = slugFromName(name)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="!saving && close()">
      <form class="modal-panel" @submit.prevent="handleSubmit">
        <header class="modal-header">
          <div>
            <p class="modal-kicker">Nuevo cliente</p>
            <h2 class="modal-title">Crear cliente</h2>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar" :disabled="saving" @click="close">
            ×
          </button>
        </header>

        <div class="modal-body space-y-4">
          <p class="field-hint intro">
            Se registrará el cliente en SoftDIN Central, se creará su base de datos, se aplicarán las
            migraciones y se cargarán los datos maestros iniciales (seed). Este proceso puede tardar
            varios minutos.
          </p>

          <div>
            <p class="label">Logo del cliente</p>
            <div class="logo-row">
              <span class="logo-preview">
                <img
                  v-if="hasLogo"
                  :src="previewUrl!"
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
                    {{ selectedFile ? 'Cambiar logo' : 'Agregar logo' }}
                  </button>

                  <button
                    v-if="selectedFile"
                    type="button"
                    class="btn-secondary"
                    :disabled="saving"
                    @click="cancelLogoSelection"
                  >
                    Quitar selección
                  </button>
                </div>

                <p v-if="fieldErrors.logo" class="field-error">{{ fieldErrors.logo }}</p>
              </div>
            </div>
          </div>

          <div>
            <label for="create-tenant-name" class="label">Nombre</label>
            <input
              id="create-tenant-name"
              v-model="form.name"
              type="text"
              required
              class="input-field"
              :disabled="saving"
            />
            <p v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</p>
          </div>

          <div>
            <label for="create-tenant-slug" class="label">Sigla (slug)</label>
            <input
              id="create-tenant-slug"
              v-model="form.slug"
              type="text"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              class="input-field font-mono text-sm"
              :disabled="saving"
            />
            <p v-if="fieldErrors.slug" class="field-error">{{ fieldErrors.slug }}</p>
            <p v-else-if="suggestedDatabase" class="field-hint">
              Base de datos sugerida: <code class="mono">{{ suggestedDatabase }}</code>
            </p>
          </div>

          <div>
            <label for="create-tenant-domain" class="label">Dominio principal (opcional)</label>
            <input
              id="create-tenant-domain"
              v-model="form.domain"
              type="text"
              class="input-field"
              :placeholder="suggestedDomain || 'cliente.localhost'"
              :disabled="saving"
            />
            <p v-if="fieldErrors.domain" class="field-error">{{ fieldErrors.domain }}</p>
            <p v-else class="field-hint">
              Si lo deja vacío, se usará
              <code class="mono">{{ suggestedDomain || 'sigla.localhost' }}</code>.
            </p>
          </div>

          <div>
            <label for="create-tenant-database" class="label">Base de datos (opcional)</label>
            <input
              id="create-tenant-database"
              v-model="form.database"
              type="text"
              pattern="[a-zA-Z0-9_]+"
              class="input-field font-mono text-sm"
              :placeholder="suggestedDatabase || 'din_sigla'"
              :disabled="saving"
            />
            <p v-if="fieldErrors.database" class="field-error">{{ fieldErrors.database }}</p>
            <p v-else class="field-hint">
              Si lo deja vacío, se generará automáticamente según la sigla.
            </p>
          </div>

          <div>
            <label for="create-tenant-owner" class="label">Correo del propietario (opcional)</label>
            <input
              id="create-tenant-owner"
              v-model="form.owner_email"
              type="email"
              class="input-field"
              placeholder="admin@empresa.com"
              :disabled="saving"
            />
            <p v-if="fieldErrors.owner_email" class="field-error">{{ fieldErrors.owner_email }}</p>
            <p v-else class="field-hint">
              Usuario central existente que quedará asociado como propietario del cliente.
            </p>
          </div>

          <p v-if="successMessage" class="alert-success">{{ successMessage }}</p>
          <p v-if="error" class="alert-error">{{ error }}</p>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn-secondary" :disabled="saving" @click="close">
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Creando cliente…' : 'Crear cliente' }}
          </button>
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
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid #e2e8f0;
  padding: 0.875rem 1.25rem;
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

.input-field:disabled {
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

.field-hint.intro {
  margin-top: 0;
  line-height: 1.5;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
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

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
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

.hidden {
  display: none;
}
</style>
