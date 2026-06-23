<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import AuthShell from '@/components/auth/AuthShell.vue'
import { authService } from '@/services/auth.service'
import { tenantLogoPublicUrl } from '@/services/tenant.service'
import type { PublicTenant } from '@/types/auth'

const router = useRouter()

const loading = ref(false)
const loadingTenants = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const availableTenants = ref<PublicTenant[]>([])
const logoFile = ref<File | null>(null)
const logoPreviewUrl = ref<string | null>(null)
const logoInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  tenantMode: 'new' as 'new' | 'existing',
  tenantName: '',
  tenantSlug: '',
  tenantDomain: '',
  selectedTenantSlug: '',
})

const slugTouched = ref(false)
const domainTouched = ref(false)

const defaultDomainSuffix = 'localhost'

function suggestedDomain(slug: string): string {
  const normalized = slug.trim().toLowerCase()
  return normalized ? `${normalized}.${defaultDomainSuffix}` : ''
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
}

watch(
  () => form.tenantName,
  (value) => {
    if (form.tenantMode !== 'new' || slugTouched.value) {
      return
    }

    form.tenantSlug = slugify(value)
  },
)

watch(
  () => form.tenantSlug,
  (value) => {
    if (form.tenantMode !== 'new' || domainTouched.value) {
      return
    }

    form.tenantDomain = suggestedDomain(value)
  },
)

watch(
  () => form.tenantMode,
  () => {
    slugTouched.value = false
    domainTouched.value = false
    clearLogoSelection()
  },
)

const selectedExistingTenant = computed(() =>
  availableTenants.value.find((tenant) => tenant.slug === form.selectedTenantSlug) ?? null,
)

const clientDisplay = computed(() => {
  if (form.tenantMode === 'existing') {
    const tenant = selectedExistingTenant.value
    if (!tenant) {
      return null
    }

    return {
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.has_logo ? tenantLogoPublicUrl(tenant.slug) : null,
      initials: initialsFromName(tenant.name),
      subtitle: 'Cliente seleccionado',
    }
  }

  const name = form.tenantName.trim()
  const slug = form.tenantSlug.trim()

  if (!name && !slug && !logoPreviewUrl.value) {
    return null
  }

  return {
    name: name || 'Nuevo cliente',
    slug: slug || 'pendiente',
    logoUrl: logoPreviewUrl.value,
    initials: initialsFromName(name || slug || 'NC'),
    subtitle: 'Cliente a crear',
  }
})

function clearLogoPreview(): void {
  if (logoPreviewUrl.value) {
    URL.revokeObjectURL(logoPreviewUrl.value)
    logoPreviewUrl.value = null
  }
}

function clearLogoSelection(): void {
  logoFile.value = null
  clearLogoPreview()

  if (logoInput.value) {
    logoInput.value.value = ''
  }
}

function openLogoPicker(): void {
  logoInput.value?.click()
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
  clearLogoPreview()
  logoFile.value = file
  logoPreviewUrl.value = URL.createObjectURL(file)
}

onUnmounted(() => clearLogoPreview())

onMounted(async () => {
  loadingTenants.value = true

  try {
    const data = await authService.fetchPublicTenants()
    availableTenants.value = data.tenants
    if (data.tenants.length > 0) {
      form.selectedTenantSlug = data.tenants[0].slug
    }
  } catch {
    availableTenants.value = []
  } finally {
    loadingTenants.value = false
  }
})

function clearErrors(): void {
  error.value = null
  fieldErrors.value = {}
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
  clearErrors()

  if (form.password !== form.passwordConfirmation) {
    error.value = 'La confirmación de contraseña no coincide.'
    return
  }

  if (form.tenantMode === 'new' && !form.tenantName.trim()) {
    fieldErrors.value.tenant_name = 'Indique el nombre del nuevo cliente.'
    return
  }

  if (form.tenantMode === 'new' && !form.tenantDomain.trim()) {
    fieldErrors.value.tenant_domain = 'Indique el dominio del nuevo cliente.'
    return
  }

  if (form.tenantMode === 'existing' && !form.selectedTenantSlug) {
    fieldErrors.value.tenant_slug = 'Seleccione un cliente existente.'
    return
  }

  loading.value = true

  try {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      password_confirmation: form.passwordConfirmation,
      tenant_mode: form.tenantMode,
      tenant_slug:
        form.tenantMode === 'new'
          ? form.tenantSlug.trim().toLowerCase()
          : form.selectedTenantSlug,
      ...(form.tenantMode === 'new'
        ? {
            tenant_name: form.tenantName.trim(),
            tenant_domain: form.tenantDomain.trim(),
            migrate: true,
            seed: true,
          }
        : {}),
    }

    const data = await authService.register(payload, logoFile.value)

    await router.push({
      name: 'login',
      query: { message: data.message },
    })
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as {
        message?: string
        errors?: Record<string, string[]>
      }
      applyApiErrors(responseData?.errors)
      const firstFieldError = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : undefined
      error.value = firstFieldError ?? responseData?.message ?? 'No se pudo crear la cuenta.'
      return
    }

    if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
      error.value =
        'La operación tardó demasiado. Si el cliente se creó parcialmente, contacte al administrador o intente iniciar sesión.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell
    extra-wide
    title="Crear cuenta"
    subtitle="Complete sus datos de usuario y luego la información del cliente."
  >
    <form class="register-form" @submit.prevent="handleSubmit">
      <!-- Panel: Usuario -->
      <section class="form-panel">
        <header class="panel-header">
          <span class="panel-icon panel-icon-user">U</span>
          <div>
            <h2 class="panel-title">Datos del usuario</h2>
            <p class="panel-subtitle">Información de acceso a SoftDIN</p>
          </div>
        </header>

        <div class="panel-body">
          <div>
            <label for="name" class="label">Nombre completo</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              autocomplete="name"
              class="input-field"
              :class="{ 'input-error': fieldErrors.name }"
            />
            <p v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</p>
          </div>

          <div>
            <label for="email" class="label">Correo</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              autocomplete="username"
              class="input-field"
              :class="{ 'input-error': fieldErrors.email }"
            />
            <p v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</p>
          </div>

          <div>
            <label for="password" class="label">Contraseña</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="input-field"
              :class="{ 'input-error': fieldErrors.password }"
            />
            <p v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</p>
          </div>

          <div>
            <label for="passwordConfirmation" class="label">Confirmar contraseña</label>
            <input
              id="passwordConfirmation"
              v-model="form.passwordConfirmation"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="input-field"
            />
          </div>
        </div>
      </section>

      <!-- Panel: Cliente -->
      <section class="form-panel">
        <header class="panel-header">
          <span class="panel-icon panel-icon-client">C</span>
          <div>
            <h2 class="panel-title">Datos del cliente</h2>
            <p class="panel-subtitle">Nuevo cliente o unión a uno existente</p>
          </div>
        </header>

        <div v-if="clientDisplay" class="client-banner">
          <span class="client-banner-logo">
            <img
              v-if="clientDisplay.logoUrl"
              :src="clientDisplay.logoUrl"
              :alt="clientDisplay.name"
              class="h-full w-full object-contain"
            />
            <span v-else class="client-banner-initials">{{ clientDisplay.initials }}</span>
          </span>
          <div class="min-w-0 flex-1">
            <p class="client-banner-label">{{ clientDisplay.subtitle }}</p>
            <p class="truncate text-base font-semibold text-slate-900">
              {{ clientDisplay.name }}
            </p>
            <p class="truncate text-sm text-slate-500">{{ clientDisplay.slug }}</p>
          </div>
        </div>

        <div class="panel-body">
          <div class="mode-toggle" role="radiogroup" aria-label="Modo de cliente">
            <label class="mode-option">
              <input v-model="form.tenantMode" type="radio" value="new" />
              <span>Crear cliente nuevo</span>
            </label>
            <label class="mode-option">
              <input v-model="form.tenantMode" type="radio" value="existing" />
              <span>Unirse a cliente existente</span>
            </label>
          </div>

          <template v-if="form.tenantMode === 'new'">
            <div>
              <label for="tenantName" class="label">Nombre del cliente</label>
              <input
                id="tenantName"
                v-model="form.tenantName"
                type="text"
                required
                class="input-field"
                :class="{ 'input-error': fieldErrors.tenant_name }"
              />
              <p v-if="fieldErrors.tenant_name" class="field-error">{{ fieldErrors.tenant_name }}</p>
            </div>

            <div>
              <label for="tenantSlug" class="label">Sigla (slug)</label>
              <input
                id="tenantSlug"
                v-model="form.tenantSlug"
                type="text"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                class="input-field font-mono text-sm"
                :class="{ 'input-error': fieldErrors.tenant_slug }"
                @input="slugTouched = true"
              />
              <p class="field-hint">Solo minúsculas, números y guiones. Debe ser único.</p>
              <p v-if="fieldErrors.tenant_slug" class="field-error">{{ fieldErrors.tenant_slug }}</p>
            </div>

            <div>
              <label for="tenantDomain" class="label">Dominio</label>
              <input
                id="tenantDomain"
                v-model="form.tenantDomain"
                type="text"
                required
                placeholder="mi-empresa.localhost"
                class="input-field"
                :class="{ 'input-error': fieldErrors.tenant_domain }"
                @input="domainTouched = true"
              />
              <p class="field-hint">
                Dominio de acceso del cliente. La base de datos se crea automáticamente.
              </p>
              <p v-if="fieldErrors.tenant_domain" class="field-error">
                {{ fieldErrors.tenant_domain }}
              </p>
            </div>

            <div>
              <label class="label">Logo de la empresa (opcional)</label>
              <div class="logo-upload-row">
                <span class="logo-upload-preview">
                  <img
                    v-if="logoPreviewUrl"
                    :src="logoPreviewUrl"
                    alt="Vista previa del logo"
                    class="h-full w-full object-contain"
                  />
                  <span v-else class="logo-upload-placeholder">Logo</span>
                </span>
                <div class="min-w-0 flex-1">
                  <p class="field-hint">
                    Formatos JPG, PNG o WebP (máx. 10 MB). Se guardará al crear el cliente.
                  </p>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <button type="button" class="btn-secondary" @click="openLogoPicker">
                      {{ logoFile ? 'Cambiar logo' : 'Seleccionar logo' }}
                    </button>
                    <button
                      v-if="logoFile"
                      type="button"
                      class="btn-ghost"
                      @click="clearLogoSelection"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
              <input
                ref="logoInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="onLogoSelected"
              />
              <p v-if="fieldErrors.logo" class="field-error">{{ fieldErrors.logo }}</p>
            </div>
          </template>

          <template v-else>
            <div>
              <label for="selectedTenant" class="label">Cliente existente</label>
              <select
                id="selectedTenant"
                v-model="form.selectedTenantSlug"
                class="input-field"
                :class="{ 'input-error': fieldErrors.tenant_slug }"
                :disabled="loadingTenants || availableTenants.length === 0"
                required
              >
                <option v-if="loadingTenants" value="" disabled>Cargando clientes…</option>
                <option v-else-if="availableTenants.length === 0" value="" disabled>
                  No hay clientes disponibles
                </option>
                <option v-for="tenant in availableTenants" :key="tenant.id" :value="tenant.slug">
                  {{ tenant.name }} ({{ tenant.slug }})
                </option>
              </select>
              <p v-if="fieldErrors.tenant_slug" class="field-error">{{ fieldErrors.tenant_slug }}</p>
            </div>
          </template>
        </div>
      </section>

      <p v-if="error" class="alert-error">{{ error }}</p>

      <button type="submit" class="btn-primary" :disabled="loading">
        {{
          loading
            ? form.tenantMode === 'new'
              ? 'Creando cuenta y cliente (puede tardar 1–2 min)…'
              : 'Creando cuenta…'
            : 'Crear cuenta'
        }}
      </button>
    </form>

    <template #footer>
      ¿Ya tiene cuenta?
      <RouterLink :to="{ name: 'login' }" class="link">Iniciar sesión</RouterLink>
    </template>
  </AuthShell>
</template>

<style scoped>
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-panel {
  overflow: hidden;
  border-radius: 0.875rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  background: linear-gradient(to bottom, #f8fafc, #fff);
  padding: 0.875rem 1rem;
}

.panel-icon {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #fff;
}

.panel-icon-client {
  background: var(--color-brand-600);
}

.panel-icon-user {
  background: #475569;
}

.panel-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.panel-subtitle {
  font-size: 0.75rem;
  color: #64748b;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.client-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, var(--color-brand-50, #f0fdf4) 0%, #f8fafc 100%);
  padding: 1rem 1.25rem;
}

.client-banner-logo {
  display: flex;
  height: 4.5rem;
  width: 4.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  border: 2px solid #fff;
  background: #fff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.client-banner-initials {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-brand-700);
}

.client-banner-label {
  margin-bottom: 0.125rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-brand-700);
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
  background: #fff;
}

.input-field:focus {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-100);
}

.input-field:disabled {
  background: #f8fafc;
  color: #64748b;
}

.input-error {
  border-color: #f87171;
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

.mode-toggle {
  display: grid;
  gap: 0.5rem;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  background: #fff;
}

.mode-option:has(input:checked) {
  border-color: var(--color-brand-500);
  background: var(--color-brand-50, #f0fdf4);
}

.logo-upload-row {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}

.logo-upload-preview {
  display: flex;
  height: 4rem;
  width: 4rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.logo-upload-placeholder {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.btn-secondary {
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 0.45rem 0.75rem;
  font-size: 0.8125rem;
  color: #334155;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.btn-ghost {
  border-radius: 0.5rem;
  padding: 0.45rem 0.75rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.btn-ghost:hover {
  background: #f8fafc;
  color: #334155;
}

.btn-primary {
  width: 100%;
  border-radius: 0.5rem;
  background-color: var(--color-brand-600);
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.alert-error {
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.link {
  color: var(--color-brand-600);
  text-decoration: none;
}

.link:hover {
  color: var(--color-brand-700);
  text-decoration: underline;
}
</style>
