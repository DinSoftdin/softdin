<script setup lang="ts">
import CentralFieldHelp from '@/views/central/components/CentralFieldHelp.vue'

withDefaults(
  defineProps<{
    for?: string
    help?: string
    helpTrigger?: 'hover' | 'dblclick'
    required?: boolean
    optional?: boolean
  }>(),
  {
    helpTrigger: 'hover',
    required: false,
    optional: false,
  },
)
</script>

<template>
  <label v-if="for" :for="for" class="central-form-label">
    <span class="central-form-label-text">
      <slot />
      <span v-if="required" class="required-mark" title="Campo obligatorio" aria-hidden="true">*</span>
      <span v-if="required" class="sr-only"> obligatorio</span>
      <span v-else-if="optional" class="optional-mark">(opcional)</span>
    </span>
    <CentralFieldHelp v-if="help" :text="help" :trigger="helpTrigger" />
  </label>

  <p v-else class="central-form-label">
    <span class="central-form-label-text">
      <slot />
      <span v-if="required" class="required-mark" title="Campo obligatorio" aria-hidden="true">*</span>
      <span v-if="required" class="sr-only"> obligatorio</span>
      <span v-else-if="optional" class="optional-mark">(opcional)</span>
    </span>
    <CentralFieldHelp v-if="help" :text="help" :trigger="helpTrigger" />
  </p>
</template>

<style scoped>
.central-form-label {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.central-form-label-text {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
}

.required-mark {
  color: #dc2626;
  font-weight: 700;
  line-height: 1;
}

.optional-mark {
  margin-left: 0.25rem;
  font-size: 0.75rem;
  font-weight: 400;
  color: #64748b;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
