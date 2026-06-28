<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import AuthShell from '@/components/auth/AuthShell.vue'
import PasswordInput from '@/components/forms/PasswordInput.vue'
import { authService } from '@/services/auth.service'

const router = useRouter()
const route = useRoute()

const isActivation = computed(() => route.query.activation === '1')

const loading = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  token: typeof route.query.token === 'string' ? route.query.token : '',
  password: '',
  passwordConfirmation: '',
})

async function handleSubmit(): Promise<void> {
  if (!form.token) {
    error.value = 'El enlace de recuperación no es válido. Solicite uno nuevo.'
    return
  }

  loading.value = true
  error.value = null

  try {
    const data = await authService.resetPassword({
      email: form.email.trim(),
      token: form.token,
      password: form.password,
      password_confirmation: form.passwordConfirmation,
    })

    await router.push({
      name: 'login',
      query: { message: data.message },
    })
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string; errors?: Record<string, string[]> }
      const firstFieldError = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : undefined
      error.value = firstFieldError ?? responseData?.message ?? 'No se pudo restablecer la contraseña.'
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
    :title="isActivation ? 'Activar cuenta' : 'Nueva contraseña'"
    :subtitle="isActivation
      ? 'Defina su contraseña para ingresar por primera vez a SoftDIN.'
      : 'Defina una contraseña nueva para su usuario central.'"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="label">Correo</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          readonly
          class="input-field input-readonly"
        />
      </div>

      <div>
        <label for="password" class="label">Nueva contraseña</label>
        <PasswordInput
          id="password"
          v-model="form.password"
          required
          minlength="8"
          autocomplete="new-password"
        />
      </div>

      <div>
        <label for="passwordConfirmation" class="label">Confirmar contraseña</label>
        <PasswordInput
          id="passwordConfirmation"
          v-model="form.passwordConfirmation"
          required
          minlength="8"
          autocomplete="new-password"
        />
      </div>

      <p v-if="error" class="alert-error">{{ error }}</p>

      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Guardando…' : 'Restablecer contraseña' }}
      </button>
    </form>

    <template #footer>
      <RouterLink :to="{ name: 'forgot-password' }" class="link">Solicitar nuevo enlace</RouterLink>
      ·
      <RouterLink :to="{ name: 'login' }" class="link">Iniciar sesión</RouterLink>
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

.input-readonly {
  background: #f1f5f9;
  color: #64748b;
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
  text-decoration: underline;
}
</style>
