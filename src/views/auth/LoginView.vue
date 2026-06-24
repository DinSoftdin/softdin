<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import AuthBrandHeader from '@/components/auth/AuthBrandHeader.vue'
import { authService } from '@/services/auth.service'
import { tenantLogoPublicUrl } from '@/services/tenant.service'
import { useAuthStore } from '@/stores/auth.store'
import type { Tenant, User } from '@/types/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const step = ref<1 | 2>(1)
const error = ref<string | null>(null)
const infoMessage = ref<string | null>(null)
const loadingCentral = ref(false)
const loggingIn = ref(false)
const centralUser = ref<User | null>(null)
const availableTenants = ref<Tenant[]>([])

const form = reactive({
  email: '',
  password: '',
  tenant: '',
})

onMounted(() => {
  if (typeof route.query.message === 'string') {
    infoMessage.value = route.query.message
  }
})

async function completeLogin(tenantSlug: string): Promise<void> {
  error.value = null
  loggingIn.value = true

  try {
    await auth.login({
      email: form.email.trim(),
      password: form.password,
      tenant: tenantSlug,
    })

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as {
        message?: string
        errors?: Record<string, string[]>
      }
      const firstFieldError = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : undefined
      error.value = firstFieldError ?? responseData?.message ?? 'No se pudo iniciar sesión.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loggingIn.value = false
  }
}

async function continueToTenant(): Promise<void> {
  error.value = null
  loadingCentral.value = true

  try {
    const data = await authService.centralLogin(form.email.trim(), form.password)
    centralUser.value = data.user
    availableTenants.value = data.tenants

    if (data.tenants.length === 1) {
      form.tenant = data.tenants[0].slug
      await completeLogin(data.tenants[0].slug)
      return
    }

    form.tenant = ''
    step.value = 2
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as {
        message?: string
        errors?: Record<string, string[]>
      }
      const firstFieldError = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : undefined
      error.value = firstFieldError ?? responseData?.message ?? 'No se pudo validar el acceso central.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loadingCentral.value = false
  }
}

function backToCentral(): void {
  error.value = null
  step.value = 1
  centralUser.value = null
  availableTenants.value = []
  form.tenant = ''
}

async function handleSubmit(): Promise<void> {
  if (!form.tenant) {
    error.value = 'Seleccione un cliente operacional.'
    return
  }

  await completeLogin(form.tenant)
}

function tenantLabel(tenant: Tenant): string {
  return tenant.name === tenant.slug ? tenant.name : `${tenant.name} (${tenant.slug})`
}

const selectedTenant = computed(() =>
  availableTenants.value.find((tenant) => tenant.slug === form.tenant) ?? null,
)

const selectedTenantLogoUrl = computed(() => {
  if (!selectedTenant.value?.has_logo) {
    return null
  }

  return tenantLogoPublicUrl(selectedTenant.value.slug)
})
</script>

<template>
  <div class="login-bg flex min-h-full items-center justify-center px-4 py-10">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <div class="mb-8 flex flex-col items-center text-center">
        <RouterLink
          v-if="step === 1"
          :to="{ name: 'login-central' }"
          class="brand-link mb-3"
          title="Ir a SoftDIN Central"
        >
          <AuthBrandHeader />
        </RouterLink>
        <AuthBrandHeader
          v-else
          class="mb-3"
          :tenant-name="selectedTenant?.name"
          :tenant-slug="selectedTenant?.slug"
          :tenant-has-logo="selectedTenant?.has_logo"
        />
        <p v-if="step === 1" class="text-sm text-slate-500">
          Acceso Clientes (tenants)
        </p>
        <p v-else-if="selectedTenant" class="text-sm text-slate-500">
          Ingresar a {{ selectedTenant.name }}
        </p>
        <p v-else class="text-sm text-slate-500">
          Seleccione el cliente con el que desea ingresar
        </p>
      </div>

      <form v-if="step === 1" class="space-y-4" @submit.prevent="continueToTenant">
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-slate-700">
            Correo
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            autocomplete="username"
            class="input-field"
          />
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            autocomplete="current-password"
            class="input-field"
          />
        </div>

        <div class="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <RouterLink :to="{ name: 'forgot-password' }" class="auth-link">
            ¿Olvidó su contraseña?
          </RouterLink>
          <RouterLink :to="{ name: 'register' }" class="auth-link">
            Crear usuario nuevo
          </RouterLink>
        </div>

        <p v-if="infoMessage" class="info-box">{{ infoMessage }}</p>
        <p v-if="error" class="error-box">{{ error }}</p>

        <button type="submit" class="btn-primary" :disabled="loadingCentral || loggingIn">
          {{
            loggingIn
              ? 'Ingresando…'
              : loadingCentral
                ? 'Validando…'
                : 'Continuar'
          }}
        </button>
      </form>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div class="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          <p>
            Usuario:
            <strong>{{ centralUser?.name ?? form.email }}</strong>
          </p>
          <p class="mt-1 text-xs text-brand-700">
            {{ availableTenants.length }} cliente(s) asignado(s) a su usuario
          </p>
        </div>

        <div>
          <label for="tenant" class="mb-1 block text-sm font-medium text-slate-700">
            Cliente
          </label>

          <div v-if="selectedTenant" class="tenant-preview mb-3">
            <span class="tenant-preview-logo">
              <img
                v-if="selectedTenantLogoUrl"
                :src="selectedTenantLogoUrl"
                :alt="selectedTenant.name"
                class="h-full w-full object-contain"
              />
              <span v-else class="tenant-preview-initials">
                {{ selectedTenant.name.slice(0, 2).toUpperCase() }}
              </span>
            </span>
            <div class="min-w-0 text-left">
              <p class="truncate text-sm font-semibold text-slate-900">
                {{ selectedTenant.name }}
              </p>
              <p class="truncate text-xs text-slate-500">{{ selectedTenant.slug }}</p>
            </div>
          </div>

          <select
            id="tenant"
            v-model="form.tenant"
            required
            class="input-field"
          >
            <option value="" disabled>
              Seleccione un cliente…
            </option>
            <option
              v-for="tenant in availableTenants"
              :key="tenant.id"
              :value="tenant.slug"
            >
              {{ tenantLabel(tenant) }}
            </option>
          </select>
        </div>

        <p v-if="error" class="error-box">{{ error }}</p>

        <div class="flex gap-3">
          <button type="button" class="btn-secondary flex-1" @click="backToCentral">
            Volver
          </button>
          <button type="submit" class="btn-primary flex-1" :disabled="loggingIn || auth.loading || !form.tenant">
            {{ loggingIn || auth.loading ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-bg {
  background: linear-gradient(
    135deg,
    var(--color-brand-800) 0%,
    var(--color-brand-700) 45%,
    #052e16 100%
  );
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

.btn-primary {
  width: 100%;
  border-radius: 0.5rem;
  background-color: var(--color-brand-600);
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  transition: background-color 0.15s;
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
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: #334155;
  transition: background-color 0.15s;
}

.btn-secondary:hover {
  background: #f8fafc;
}

.error-box {
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.info-box {
  border-radius: 0.5rem;
  background: #f0fdf4;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #166534;
}

.auth-link {
  color: var(--color-brand-600);
  text-decoration: none;
}

.auth-link:hover {
  color: var(--color-brand-700);
  text-decoration: underline;
}

.brand-link {
  display: inline-flex;
  border-radius: 0.75rem;
  color: inherit;
  text-decoration: none;
  transition: background-color 0.15s, transform 0.15s;
}

.brand-link:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.brand-link:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 4px;
}

.bg-brand-50 {
  background-color: var(--color-brand-50);
}

.text-brand-800 {
  color: var(--color-brand-800);
}

.tenant-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.75rem;
}

.tenant-preview-logo {
  display: flex;
  height: 3rem;
  width: 3rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.tenant-preview-initials {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-brand-700);
}
</style>
