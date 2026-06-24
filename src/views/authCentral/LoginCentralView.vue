<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import AuthBrandHeader from '@/components/auth/AuthBrandHeader.vue'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const error = ref<string | null>(null)
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
  loggingIn.value = true

  try {
    await auth.loginCentral({
      email: form.email.trim(),
      password: form.password,
    })

    const redirect =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/central'
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
      error.value =
        firstFieldError ?? responseData?.message ?? 'No se pudo iniciar sesión en SoftDIN Central.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loggingIn.value = false
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
          <input
            id="central-password"
            v-model="form.password"
            type="password"
            required
            autocomplete="current-password"
            class="input-field"
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
        <p v-if="error" class="error-box">{{ error }}</p>

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
</style>
