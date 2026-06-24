<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import AuthShell from '@/components/auth/AuthShell.vue'
import { authService } from '@/services/auth.service'

const route = useRoute()

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const debugResetUrl = ref<string | null>(null)
const debugMailError = ref<string | null>(null)
const debugMailHint = ref<string | null>(null)

const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
})

async function handleSubmit(): Promise<void> {
  loading.value = true
  error.value = null
  success.value = null
  debugResetUrl.value = null
  debugMailError.value = null
  debugMailHint.value = null

  try {
    const data = await authService.forgotPassword(form.email.trim())
    success.value = data.message
    debugResetUrl.value = data.debug_reset_url ?? null
    debugMailError.value = data.debug_mail_error ?? null
    debugMailHint.value = data.debug_mail_hint ?? null
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string; errors?: Record<string, string[]> }
      const firstFieldError = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : undefined
      error.value = firstFieldError ?? responseData?.message ?? 'No se pudo procesar la solicitud.'
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
    title="Recuperar contraseña"
    subtitle="Le enviaremos un correo electrónico con el enlace para restablecer su contraseña."
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="label">Correo registrado</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          autocomplete="username"
          class="input-field"
        />
      </div>

      <p v-if="success" class="alert-success">{{ success }}</p>
      <p v-if="debugMailError" class="alert-error">{{ debugMailError }}</p>
      <p v-if="debugMailHint" class="alert-debug">{{ debugMailHint }}</p>
      <p v-if="debugResetUrl" class="alert-debug">
        Enlace de desarrollo: <a :href="debugResetUrl" class="link">{{ debugResetUrl }}</a>
      </p>
      <p v-if="error" class="alert-error">{{ error }}</p>

      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Enviando correo…' : 'Enviar enlace por correo' }}
      </button>
    </form>

    <template #footer>
      <RouterLink :to="{ name: 'login' }" class="link">Volver al inicio de sesión</RouterLink>
    </template>
  </AuthShell>
</template>

<style scoped>
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

.alert-success {
  border-radius: 0.5rem;
  background: #f0fdf4;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #166534;
}

.alert-debug {
  border-radius: 0.5rem;
  background: #eff6ff;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: #1e40af;
  word-break: break-all;
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
