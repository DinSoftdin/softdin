<script setup lang="ts">
import { computed, provide, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { tenantLogoPublicUrl, tenantService } from '@/services/tenant.service'
import type { CentralTenant, TenantProvisionProgress, TenantServiceType } from '@/types/tenant'
import { TENANT_SERVICE_TYPE_OPTIONS } from '@/types/tenant'
import { centralAuditRouteForTenant } from '@/utils/central-audit-navigation'
import { CENTRAL_TENANT_FIELD_HELP } from '@/utils/central-form-help'
import CentralFormLabel from '@/views/central/components/CentralFormLabel.vue'
import CentralFormRequiredLegend from '@/views/central/components/CentralFormRequiredLegend.vue'
import CentralProvisionProgressRing from '@/views/central/components/CentralProvisionProgressRing.vue'
import CentralTenantUsersPanel from '@/views/central/components/CentralTenantUsersPanel.vue'

type EditTenantTab = 'info' | 'services' | 'users'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  tenant: CentralTenant | null
  initialTab?: EditTenantTab
}>()

const loadedTenant = ref<CentralTenant | null>(null)
const loadingTenant = ref(false)

const tenant = computed(() => loadedTenant.value ?? props.tenant)

const emit = defineEmits<{
  saved: []
}>()

const activeHelpKey = ref<string | null>(null)
provide('centralFieldHelpGroup', activeHelpKey)

const router = useRouter()

const activeTab = ref<EditTenantTab>('info')
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
  serviceTypes: [] as TenantServiceType[],
})

const serviceTypeOptions = TENANT_SERVICE_TYPE_OPTIONS

const databaseExists = ref(false)
const databaseStatusLoading = ref(false)
const databaseActionLoading = ref(false)
const databaseSuccessMessage = ref<string | null>(null)
const databaseError = ref<string | null>(null)
const buildDatabaseConfirmOpen = ref(false)
const dropDatabaseConfirmOpen = ref(false)
const provisionProgress = ref<TenantProvisionProgress | null>(null)

const provisionPhaseLabel = computed(() => {
  const phase = provisionProgress.value?.phase
  if (phase === 'database') return 'BD'
  if (phase === 'migrations') return 'Migrando'
  if (phase === 'seed') return 'Seed'
  if (phase === 'done') return 'Listo'
  return 'Inicio'
})

const provisionStepLabel = computed(() => {
  const progress = provisionProgress.value
  if (!progress || progress.total <= 0) {
    return null
  }

  return `${progress.current} / ${progress.total}`
})

const provisionFileLabel = computed(() => provisionProgress.value?.file ?? null)

const isWidePanel = computed(() => true)

const databaseStatusLabel = computed(() => {
  if (databaseStatusLoading.value) {
    return 'Consultando…'
  }

  return databaseExists.value ? 'Creado' : 'No creado'
})

const databaseStatusClass = computed(() => (
  databaseExists.value ? 'service-type-status-created' : 'service-type-status-pending'
))

const canCreateTenant = computed(() => (
  !databaseExists.value
  && !saving.value
  && !databaseActionLoading.value
  && !databaseStatusLoading.value
))

const canDeleteTenant = computed(() => (
  databaseExists.value
  && !saving.value
  && !databaseActionLoading.value
  && !databaseStatusLoading.value
))

function serviceTypeStatusLabel(value: TenantServiceType): string {
  if (value === 'rrhh') {
    return databaseStatusLabel.value
  }

  return 'Pendiente por crear'
}

function serviceTypeStatusClass(value: TenantServiceType): string {
  if (value === 'rrhh') {
    return databaseStatusClass.value
  }

  return 'service-type-status-waiting'
}

function canCreateServiceType(value: TenantServiceType): boolean {
  return value === 'rrhh' && canCreateTenant.value
}

function canDeleteServiceType(value: TenantServiceType): boolean {
  return value === 'rrhh' && canDeleteTenant.value
}

function onCreateServiceType(value: TenantServiceType): void {
  if (!canCreateServiceType(value)) {
    return
  }

  openBuildDatabaseConfirm()
}

function onDeleteServiceType(value: TenantServiceType): void {
  if (!canDeleteServiceType(value)) {
    return
  }

  openDropDatabaseConfirm()
}

const tenantInitials = computed(() => {
  const name = form.name.trim() || tenant.value?.name || ''
  if (!name) {
    return '?'
  }

  const parts = name.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
})

const existingLogoUrl = computed(() => {
  if (!tenant.value?.has_logo || removeLogo.value) {
    return null
  }

  const version = tenant.value.updated_at
    ? new Date(tenant.value.updated_at).getTime()
    : 0

  return tenantLogoPublicUrl(tenant.value.slug, version)
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

  if (tenant.value?.has_logo) {
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

function tenantServiceTypes(tenant: CentralTenant): TenantServiceType[] {
  const values = tenant.data?.service_types ?? []
  return values.filter((value): value is TenantServiceType => value === 'rrhh')
}

function setActiveTab(tab: EditTenantTab): void {
  activeTab.value = tab

  if (tab === 'services') {
    void loadDatabaseStatus()
  }
}

async function refreshTenantDetails(): Promise<void> {
  const tenantId = props.tenant?.id
  if (!tenantId) {
    loadedTenant.value = null
    return
  }

  loadingTenant.value = true
  try {
    loadedTenant.value = await tenantService.fetchCentralById(tenantId)
  } catch {
    loadedTenant.value = props.tenant
  } finally {
    loadingTenant.value = false
  }
}

async function loadDatabaseStatus(): Promise<void> {
  if (!tenant.value) {
    return
  }

  databaseStatusLoading.value = true
  databaseError.value = null

  try {
    const status = await tenantService.fetchCentralDatabaseStatus(tenant.value.id)
    databaseExists.value = status.database_exists
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      databaseError.value = responseData?.message ?? 'No se pudo consultar el estado de la base de datos.'
      return
    }

    databaseError.value = 'Error de conexión con el servidor.'
  } finally {
    databaseStatusLoading.value = false
  }
}

function openBuildDatabaseConfirm(): void {
  databaseError.value = null
  buildDatabaseConfirmOpen.value = true
}

function closeBuildDatabaseConfirm(): void {
  if (databaseActionLoading.value) {
    return
  }

  buildDatabaseConfirmOpen.value = false
  provisionProgress.value = null
}

function openDropDatabaseConfirm(): void {
  databaseError.value = null
  dropDatabaseConfirmOpen.value = true
}

function closeDropDatabaseConfirm(): void {
  if (databaseActionLoading.value) {
    return
  }

  dropDatabaseConfirmOpen.value = false
}

async function confirmBuildDatabase(): Promise<void> {
  if (!tenant.value) {
    return
  }

  databaseActionLoading.value = true
  databaseError.value = null
  databaseSuccessMessage.value = null
  provisionProgress.value = {
    status: 'running',
    phase: 'starting',
    current: 0,
    total: 0,
    file: null,
    percent: 0,
    message: 'Iniciando provisión del tenant RRHH…',
    error: null,
  }

  try {
    const result = await tenantService.provisionCentralDatabaseWithProgress(tenant.value.id, {
      seed: true,
      onProgress: (progress) => {
        provisionProgress.value = progress
      },
    })

    if (result.progress.status === 'failed') {
      databaseError.value = result.message ?? result.progress.error ?? 'No se pudo construir la base de datos.'
      return
    }

    databaseSuccessMessage.value = result.message ?? 'Tenant RRHH creado correctamente.'
    databaseExists.value = result.database_exists ?? true
    buildDatabaseConfirmOpen.value = false
    provisionProgress.value = null
    if (result.tenant) {
      loadedTenant.value = result.tenant
    } else {
      await refreshTenantDetails()
    }
    emit('saved')
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      databaseError.value = responseData?.message ?? 'No se pudo construir la base de datos.'
      return
    }

    databaseError.value = err instanceof Error ? err.message : 'Error de conexión con el servidor.'
  } finally {
    databaseActionLoading.value = false
  }
}

async function confirmDropDatabase(): Promise<void> {
  if (!tenant.value) {
    return
  }

  databaseActionLoading.value = true
  databaseError.value = null
  databaseSuccessMessage.value = null

  try {
    const response = await tenantService.dropCentralDatabase(tenant.value.id, {
      service_type: 'rrhh',
    })
    databaseSuccessMessage.value = response.message
    databaseExists.value = response.deletion.database_exists
    dropDatabaseConfirmOpen.value = false
    loadedTenant.value = response.tenant
    resetForm()
    emit('saved')
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      databaseError.value = responseData?.message ?? 'No se pudo eliminar la base de datos.'
      return
    }

    databaseError.value = 'Error de conexión con el servidor.'
  } finally {
    databaseActionLoading.value = false
  }
}

function primaryDomainOf(tenant: CentralTenant): string {
  const domains = tenant.domains ?? []
  const primary = domains.find((item) => item.is_primary)
  return primary?.domain ?? domains[0]?.domain ?? ''
}

function resetForm(): void {
  const current = tenant.value
  if (!current) {
    return
  }

  form.name = current.name
  form.slug = current.slug
  form.status = current.status
  form.domain = primaryDomainOf(current)
  form.serviceTypes = tenantServiceTypes(current)
  error.value = null
  fieldErrors.value = {}
  databaseSuccessMessage.value = null
  databaseError.value = null
  buildDatabaseConfirmOpen.value = false
  dropDatabaseConfirmOpen.value = false
  provisionProgress.value = null
  resetLogoState()
}

function close(): void {
  open.value = false
}

function openAuditHistory(): void {
  if (!tenant.value) {
    return
  }

  close()
  void router.push(centralAuditRouteForTenant({
    id: tenant.value.id,
    name: tenant.value.name,
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
  if (!tenant.value) {
    return
  }

  saving.value = true
  error.value = null
  fieldErrors.value = {}

  try {
    const response = await tenantService.updateCentral(
      tenant.value.id,
      {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        status: form.status,
        domain: form.domain.trim(),
        service_types: [...form.serviceTypes],
      },
      {
        logo: selectedFile.value,
        removeLogo: removeLogo.value,
      },
    )

    loadedTenant.value = response.tenant
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
  () => [open.value, props.tenant?.id, props.initialTab] as const,
  async ([isOpen, , initialTab]) => {
    if (isOpen) {
      activeTab.value = initialTab ?? 'info'
      await refreshTenantDetails()
      resetForm()
      if ((initialTab ?? 'info') === 'services') {
        void loadDatabaseStatus()
      }
    } else {
      activeTab.value = 'info'
      activeHelpKey.value = null
      loadedTenant.value = null
      resetLogoState()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open && tenant" class="modal-backdrop" @click.self="close">
      <form
        class="modal-panel"
        :class="{ 'modal-panel-wide': isWidePanel }"
        @submit.prevent="handleSubmit"
      >
        <header class="modal-header">
          <div>
            <p class="modal-kicker">Editar cliente</p>
            <h2 class="modal-title">{{ tenant.name }}</h2>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar" @click="close">×</button>
        </header>

        <div class="modal-logo-section">
          <CentralFormLabel optional help-trigger="dblclick" :help="CENTRAL_TENANT_FIELD_HELP.logo">
            Logo del cliente
          </CentralFormLabel>
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

        <nav class="modal-tabs" role="tablist" aria-label="Secciones del cliente">
          <button
            type="button"
            role="tab"
            class="modal-tab"
            :class="{ 'modal-tab-active': activeTab === 'info' }"
            :aria-selected="activeTab === 'info'"
            @click="setActiveTab('info')"
          >
            Información
          </button>
          <button
            type="button"
            role="tab"
            class="modal-tab"
            :class="{ 'modal-tab-active': activeTab === 'services' }"
            :aria-selected="activeTab === 'services'"
            @click="setActiveTab('services')"
          >
            Tipos de servicios
          </button>
          <button
            type="button"
            role="tab"
            class="modal-tab"
            :class="{ 'modal-tab-active': activeTab === 'users' }"
            :aria-selected="activeTab === 'users'"
            @click="setActiveTab('users')"
          >
            Usuarios
          </button>
        </nav>

        <div v-show="activeTab === 'info'" class="modal-body space-y-4" role="tabpanel">
          <CentralFormRequiredLegend />

          <p class="form-recommendation">
            Desde la lista, doble clic en el cliente abre este formulario.
            La base de datos no se puede modificar; suspenda el cliente para bloquear su acceso.
          </p>

          <div class="form-grid">
            <div class="form-grid-row form-grid-row-3">
              <div class="field-block">
                <CentralFormLabel for="tenant-name" required help-trigger="dblclick" :help="CENTRAL_TENANT_FIELD_HELP.name">
                  Nombre
                </CentralFormLabel>
                <input id="tenant-name" v-model="form.name" type="text" required class="input-field" />
                <p v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</p>
              </div>

              <div class="field-block">
                <CentralFormLabel for="tenant-slug" required help-trigger="dblclick" :help="CENTRAL_TENANT_FIELD_HELP.slug">
                  Sigla (slug)
                </CentralFormLabel>
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

              <div class="field-block">
                <CentralFormLabel for="tenant-status" required help-trigger="dblclick" :help="CENTRAL_TENANT_FIELD_HELP.status">
                  Estado
                </CentralFormLabel>
                <select id="tenant-status" v-model="form.status" class="input-field">
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                </select>
                <p v-if="fieldErrors.status" class="field-error">{{ fieldErrors.status }}</p>
              </div>
            </div>

            <div class="form-grid-row form-grid-row-2">
              <div class="field-block">
                <CentralFormLabel for="tenant-domain" required help-trigger="dblclick" :help="CENTRAL_TENANT_FIELD_HELP.domain">
                  Dominio principal
                </CentralFormLabel>
                <input id="tenant-domain" v-model="form.domain" type="text" required class="input-field" />
                <p v-if="fieldErrors.domain" class="field-error">{{ fieldErrors.domain }}</p>
              </div>

              <div class="field-block">
                <CentralFormLabel for="tenant-database" help-trigger="dblclick" :help="CENTRAL_TENANT_FIELD_HELP.database">
                  Base de datos
                </CentralFormLabel>
                <input
                  id="tenant-database"
                  :value="tenant.database"
                  type="text"
                  disabled
                  class="input-field input-disabled font-mono text-sm"
                />
                <p class="field-hint">No se puede modificar; define la relación con la BD del tenant.</p>
              </div>
            </div>
          </div>

          <p v-if="error" class="alert-error">{{ error }}</p>
        </div>

        <div v-show="activeTab === 'services'" class="modal-body space-y-5" role="tabpanel">
          <section class="config-section">
            <CentralFormLabel help-trigger="dblclick" :help="CENTRAL_TENANT_FIELD_HELP.serviceTypes">
              Tipos de servicios
            </CentralFormLabel>

            <div class="service-types-box">
              <p class="field-hint section-hint">
                Seleccione los módulos habilitados. Por ahora solo RRHH permite crear o eliminar el tenant operacional.
              </p>

              <div class="service-type-list">
                <div
                  v-for="option in serviceTypeOptions"
                  :key="option.value"
                  class="service-type-row"
                  :class="{
                    'service-type-row-active': form.serviceTypes.includes(option.value),
                    'service-type-row-disabled': option.comingSoon,
                  }"
                >
                  <label class="service-type-option">
                    <input
                      v-model="form.serviceTypes"
                      type="checkbox"
                      class="service-type-checkbox"
                      :value="option.value"
                      :disabled="saving || option.comingSoon"
                    />
                    <span class="service-type-label">{{ option.label }}</span>
                    <span
                      class="service-type-status"
                      :class="serviceTypeStatusClass(option.value)"
                    >
                      {{ serviceTypeStatusLabel(option.value) }}
                    </span>
                  </label>

                  <div class="service-type-actions">
                    <button
                      type="button"
                      class="action-icon-btn action-icon-btn-create"
                      :class="{ 'action-icon-btn-create-active': canCreateServiceType(option.value) }"
                      data-tooltip="Crear tenant"
                      :aria-label="`Crear tenant ${option.label}`"
                      :disabled="!canCreateServiceType(option.value)"
                      @click="onCreateServiceType(option.value)"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                        <path
                          fill="currentColor"
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="action-icon-btn action-icon-btn-danger"
                      :class="{ 'action-icon-btn-danger-active': canDeleteServiceType(option.value) }"
                      data-tooltip="Eliminar tenant"
                      :aria-label="`Eliminar tenant ${option.label}`"
                      :disabled="!canDeleteServiceType(option.value)"
                      @click="onDeleteServiceType(option.value)"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" class="action-icon">
                        <path
                          fill="currentColor"
                          d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <p v-if="fieldErrors.service_types" class="field-error">{{ fieldErrors.service_types }}</p>
            </div>

            <p v-if="databaseSuccessMessage" class="alert-success">{{ databaseSuccessMessage }}</p>
            <p v-if="databaseError" class="alert-error">{{ databaseError }}</p>
          </section>

          <p v-if="error" class="alert-error">{{ error }}</p>
        </div>

        <div v-show="activeTab === 'users'" class="modal-body space-y-5" role="tabpanel">
          <section class="config-section">
            <h3 class="config-section-title">Usuarios del cliente</h3>
            <p class="field-hint section-hint">
              Asocie usuarios activos de la plataforma central a este cliente. Los cambios se aplican de inmediato.
            </p>
            <CentralTenantUsersPanel :tenant="tenant" :active="open && activeTab === 'users'" />
          </section>

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

  <Teleport to="body">
    <div
      v-if="buildDatabaseConfirmOpen && tenant"
      class="modal-backdrop modal-backdrop-confirm"
      @click.self="closeBuildDatabaseConfirm"
    >
      <div class="modal-panel modal-panel-confirm" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div>
            <p class="modal-kicker">Crear tenant</p>
            <h2 class="modal-title">¿Crear tenant RRHH?</h2>
          </div>
          <button
            type="button"
            class="modal-close"
            aria-label="Cerrar"
            :disabled="databaseActionLoading"
            @click="closeBuildDatabaseConfirm"
          >
            ×
          </button>
        </header>

        <div class="modal-body space-y-3 text-sm text-slate-700">
          <template v-if="databaseActionLoading && provisionProgress">
            <CentralProvisionProgressRing
              :percent="provisionProgress.percent"
              :label="provisionPhaseLabel"
            />
            <p class="provision-status-message">{{ provisionProgress.message }}</p>
            <p v-if="provisionStepLabel" class="provision-step-count">{{ provisionStepLabel }}</p>
            <p v-if="provisionFileLabel" class="provision-current-file" :title="provisionFileLabel">
              {{ provisionFileLabel }}
            </p>
          </template>
          <template v-else>
            <p>
              Se creará el tenant operacional <strong>RRHH</strong> del cliente
              <strong>{{ tenant.name }}</strong> en la base de datos
              <code class="mono">{{ tenant.database }}</code>
              y se aplicarán las migraciones correspondientes.
            </p>
            <p class="text-brand-700">
              Esta operación puede tardar varios minutos. No elimina el registro del cliente en SoftDIN Central.
            </p>
            <p v-if="databaseExists" class="text-amber-700">
              El tenant RRHH ya existe: se volverán a aplicar las migraciones pendientes.
            </p>
          </template>
        </div>

        <footer class="modal-footer">
          <button
            type="button"
            class="btn-secondary"
            :disabled="databaseActionLoading"
            @click="closeBuildDatabaseConfirm"
          >
            Cancelar
          </button>
          <button
            v-if="!databaseActionLoading"
            type="button"
            class="btn-primary"
            @click="confirmBuildDatabase"
          >
            Sí, crear tenant
          </button>
        </footer>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div
      v-if="dropDatabaseConfirmOpen && tenant"
      class="modal-backdrop modal-backdrop-confirm"
      @click.self="closeDropDatabaseConfirm"
    >
      <div class="modal-panel modal-panel-danger" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div>
            <p class="modal-kicker modal-kicker-danger">Eliminar tenant</p>
            <h2 class="modal-title">¿Eliminar tenant RRHH?</h2>
          </div>
          <button
            type="button"
            class="modal-close"
            aria-label="Cerrar"
            :disabled="databaseActionLoading"
            @click="closeDropDatabaseConfirm"
          >
            ×
          </button>
        </header>

        <div class="modal-body space-y-3 text-sm text-slate-700">
          <p>
            Se eliminará de forma <strong>permanente e irreversible</strong> el tenant operacional
            <strong>RRHH</strong> del cliente <strong>{{ tenant.name }}</strong>,
            incluyendo la base de datos <code class="mono">{{ tenant.database }}</code> y todos sus datos.
          </p>
          <p class="text-red-700">
            El registro del cliente, dominios y usuarios asociados en SoftDIN Central se conservarán.
          </p>
          <p class="text-red-700">
            Confirme solo si está seguro. Podrá volver a crear el tenant RRHH después, pero los datos eliminados no se recuperarán.
          </p>
        </div>

        <footer class="modal-footer">
          <button
            type="button"
            class="btn-secondary"
            :disabled="databaseActionLoading"
            @click="closeDropDatabaseConfirm"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-danger-solid"
            :disabled="databaseActionLoading"
            @click="confirmDropDatabase"
          >
            {{ databaseActionLoading ? 'Eliminando…' : 'Sí, eliminar tenant' }}
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

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid-row {
  display: grid;
  gap: 0.75rem;
}

.form-grid-row-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-grid-row-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-block {
  min-width: 0;
}

@media (max-width: 720px) {
  .form-grid-row-3,
  .form-grid-row-2 {
    grid-template-columns: 1fr;
  }
}

.modal-panel {
  width: 100%;
  max-width: 32rem;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
}

.modal-panel-wide {
  max-width: 46rem;
}

.modal-logo-section {
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
}

.modal-tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 1.25rem;
}

.modal-tab {
  margin-bottom: -1px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
}

.modal-tab:hover {
  color: #334155;
}

.modal-tab-active {
  border-bottom-color: var(--color-brand-600);
  color: var(--color-brand-700);
}

.config-section-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.config-section + .config-section {
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
}

.section-hint {
  margin-top: 0.25rem;
  margin-bottom: 0.75rem;
}

.service-types-box {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  padding: 0.875rem;
}

.service-type-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 1rem;
}

.service-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.625rem;
  background: #fff;
  padding: 0.625rem 0.75rem;
}

.service-type-row-active {
  border-color: var(--color-brand-500);
  background: var(--color-brand-50, #f0fdf4);
}

.service-type-row-disabled {
  opacity: 0.72;
}

.service-type-actions {
  display: flex;
  flex-shrink: 0;
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

.action-icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-icon-btn-create {
  color: var(--color-brand-700);
  border-color: #bbf7d0;
}

.action-icon-btn-create-active {
  background: var(--color-brand-600);
  color: #fff;
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 2px var(--color-brand-100, #dcfce7);
}

.action-icon-btn-create-active:hover:not(:disabled) {
  background: var(--color-brand-700);
  border-color: var(--color-brand-700);
}

.action-icon-btn-create:hover:not(:disabled):not(.action-icon-btn-create-active) {
  background: #f0fdf4;
}

.action-icon-btn-danger {
  color: #b91c1c;
  border-color: #fecaca;
}

.action-icon-btn-danger-active {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
  box-shadow: 0 0 0 2px #fee2e2;
}

.action-icon-btn-danger-active:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
}

.action-icon-btn-danger:hover:not(:disabled):not(.action-icon-btn-danger-active) {
  background: #fef2f2;
}

.action-icon {
  height: 1.125rem;
  width: 1.125rem;
}

.mono {
  border-radius: 0.375rem;
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  font-size: 0.8125rem;
  color: #334155;
}

.alert-success {
  margin-top: 0.75rem;
  border-radius: 0.5rem;
  background: #f0fdf4;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #166534;
}

.modal-backdrop-confirm {
  z-index: 70;
}

.modal-panel-confirm {
  max-width: 32rem;
  border: 1px solid #bbf7d0;
}

.provision-status-message {
  margin: 0;
  text-align: center;
  font-weight: 500;
  color: rgb(51 65 85);
}

.provision-step-count {
  margin: 0;
  text-align: center;
  font-size: 0.8125rem;
  color: rgb(100 116 139);
}

.provision-current-file {
  margin: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.6875rem;
  line-height: 1.4;
  color: rgb(71 85 105);
  word-break: break-all;
  text-align: center;
  max-height: 4.5rem;
  overflow: auto;
}

.modal-panel-danger {
  max-width: 32rem;
  border: 1px solid #fecaca;
}

.modal-kicker-danger {
  color: #b91c1c;
}

.text-brand-700 {
  color: var(--color-brand-700);
}

.text-amber-700 {
  color: #b45309;
}

.text-red-700 {
  color: #b91c1c;
}

.btn-danger-solid {
  border-radius: 0.5rem;
  background: #dc2626;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-danger-solid:disabled {
  opacity: 0.6;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

.service-type-option {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.service-type-checkbox {
  height: 1rem;
  width: 1rem;
  accent-color: var(--color-brand-600);
}

.service-type-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.service-type-status {
  display: inline-flex;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
}

.service-type-status-created {
  background: #dcfce7;
  color: #166534;
}

.service-type-status-pending {
  background: #fef3c7;
  color: #92400e;
}

.service-type-status-waiting {
  background: #e2e8f0;
  color: #64748b;
}

.space-y-5 > * + * {
  margin-top: 1.25rem;
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

.form-recommendation {
  margin: 0;
  border-radius: 0.5rem;
  background: #f8fafc;
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #475569;
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
