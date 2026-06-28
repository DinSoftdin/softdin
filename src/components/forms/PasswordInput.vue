<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: string
    required?: boolean
    autocomplete?: string
    minlength?: number | string
    readonly?: boolean
    disabled?: boolean
  }>(),
  {
    required: false,
    readonly: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const visible = ref(false)

const inputType = computed(() => (visible.value ? 'text' : 'password'))

const toggleLabel = computed(() =>
  visible.value ? 'Ocultar contraseña' : 'Mostrar contraseña',
)

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="password-input">
    <input
      :id="id"
      :type="inputType"
      :value="modelValue"
      :required="required"
      :autocomplete="autocomplete"
      :minlength="minlength"
      :readonly="readonly"
      :disabled="disabled"
      class="password-input__field"
      @input="onInput"
    />

    <button
      type="button"
      class="password-input__toggle"
      :aria-label="toggleLabel"
      :title="toggleLabel"
      :aria-pressed="visible"
      :disabled="disabled"
      @click="visible = !visible"
    >
      <svg
        v-if="visible"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
        <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 10.5 7.5a11.6 11.6 0 0 1-2.08 3.58" />
        <path d="M6.09 6.09A10.94 10.94 0 0 0 2.5 12c1.23 4.39 5.5 7.5 10.5 7.5a10.9 10.9 0 0 0 4.24-.88" />
      </svg>

      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.password-input {
  position: relative;
  width: 100%;
}

.password-input__field {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background: #fff;
}

.password-input__field:focus {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-100);
}

.password-input__field:disabled {
  background: #f1f5f9;
  color: #64748b;
}

.password-input__toggle {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  display: flex;
  height: 1.75rem;
  width: 1.75rem;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.password-input__toggle:hover:not(:disabled) {
  color: #334155;
  background: #f1f5f9;
}

.password-input__toggle:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.password-input__toggle svg {
  height: 1.125rem;
  width: 1.125rem;
}
</style>
