<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthBrandHeader from '@/components/auth/AuthBrandHeader.vue'
import PasswordInput from '@/components/forms/PasswordInput.vue'
import { useAuthStore } from '@/stores/auth.store'
import {
  CentralLoginTraceError,
  centralAdminLoginWithTrace,
  formatTraceSteps,
} from '@/utils/centralLoginTrace'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const error = ref<string | null>(null)
const errorTrace = ref<string | null>(null)
const infoMessage = ref<string | null>(null)
const loggingIn = ref(false)

const form = reactive({
  email: '',
  password: '',
})

onMounted(() => {
  if (typeof route.query.message === 'string') {
    infoMessage.value = route.query.message
  }
})

async function handleSubmit(): Promise<void> {
  error.value = null
  errorTrace.value = null
  loggingIn.value = true

  try {
    const { data } = await centralAdminLoginWithTrace({
      email: form.email.trim(),
      password: form.password,
    })

    auth.setSessionFromCentralAdminLogin(data)
  } catch (err) {
    if (err instanceof CentralLoginTraceError) {
      error.value = err.message
      errorTrace.value = formatTraceSteps(err.steps)
    } else {
      error.value = 'Error inesperado al iniciar sesión.'
      errorTrace.value = err instanceof Error ? err.message : String(err)
    }
    return
  } finally {
    loggingIn.value = false
  }

  const redirect =
    typeof route.query.redirect === 'string' ? route.query.redirect : '/central'

  try {
    await router.push(redirect)
  } catch {
    error.value =
      'La sesión se inició, pero no se pudo abrir el panel central. Recargue la página.'
  }
}
</script>

<template>
  <div class="login-bg flex min-h-full items-center justify-center px-4 py-10">
    <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <div class="mb-8 flex flex-col items-center text-center">
        <AuthBrandHeader class="mb-3" />
        <h1 class="text-lg font-semibold text-slate-900">SoftDIN Central</h1>
        <p class="mt-1 text-sm text-slate-500">
          Acceso exclusivo para superusuarios · sin selección de cliente
        </p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label for="central-email" class="mb-1 block text-sm font-medium text-slate-700">
            Correo
          </label>
          <input
            id="central-email"
            v-model="form.email"
            type="email"
            required
            autocomplete="username"
            class="input-field"
          />
        </div>

        <div>
          <label for="central-password" class="mb-1 block text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <PasswordInput
            id="central-password"
            v-model="form.password"
            required
            autocomplete="current-password"
          />
        </div>

        <div class="flex flex-col gap-2 text-sm">
          <RouterLink :to="{ name: 'central-forgot-password' }" class="auth-link">
            ¿Olvidó su contraseña?
          </RouterLink>
          <RouterLink :to="{ name: 'login' }" class="auth-link">
            Acceso Clientes (tenants)
          </RouterLink>
        </div>

        <p v-if="infoMessage" class="info-box">{{ infoMessage }}</p>
        <div v-if="error" class="error-box">
          <p class="error-message">{{ error }}</p>
          <pre v-if="errorTrace" class="error-trace">{{ errorTrace }}</pre>
        </div>

        <button type="submit" class="btn-primary" :disabled="loggingIn || auth.loading">
          {{ loggingIn || auth.loading ? 'Ingresando…' : 'Ingresar a SoftDIN Central' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-bg {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e293b 45%,
    #334155 100%
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
}

.btn-primary:disabled {
  opacity: 0.6;
}

.error-box {
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}

.error-message {
  margin: 0;
}

.error-trace {
  margin: 0.75rem 0 0;
  padding: 0.5rem 0.625rem;
  border-radius: 0.375rem;
  background: #fff1f2;
  border: 1px solid #fecaca;
  font-size: 0.6875rem;
  line-height: 1.45;
  color: #7f1d1d;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 16rem;
  overflow: auto;
}

.info-box {
  border-radius: 0.5rem;
  background: #f0fdf4;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #166534;
}

.api-hint {
  border-radius: 0.5rem;
  background: #f8fafc;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: #64748b;
  word-break: break-all;
}

.auth-link {
  color: var(--color-brand-600);
  text-decoration: none;
}

.auth-link:hover {
  color: var(--color-brand-700);
  text-decoration: underline;
}
</style>
