<script setup lang="ts">
import type { CentralDashboardSparklinePoint } from '@/types/central-dashboard'
import CentralSparkline from '@/views/central/components/dashboard/CentralSparkline.vue'

defineProps<{
  label: string
  value: number | string
  hint?: string
  accent?: 'brand' | 'slate' | 'amber' | 'sky'
  sparkline?: CentralDashboardSparklinePoint[]
  sparklineColor?: string
}>()

const accentColors: Record<string, string> = {
  brand: 'var(--color-brand-600)',
  slate: '#475569',
  amber: '#d97706',
  sky: '#0284c7',
}
</script>

<template>
  <article class="kpi-card" :class="accent ? `kpi-card-${accent}` : 'kpi-card-brand'">
    <div class="kpi-top">
      <div>
        <p class="kpi-label">{{ label }}</p>
        <p class="kpi-value">{{ value }}</p>
      </div>
      <CentralSparkline
        v-if="sparkline && sparkline.length > 0"
        :points="sparkline"
        :color="sparklineColor ?? accentColors[accent ?? 'brand']"
      />
    </div>
    <p v-if="hint" class="kpi-hint">{{ hint }}</p>
  </article>
</template>

<style scoped>
.kpi-card {
  border-radius: 1rem;
  padding: 1rem 1.125rem;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  border: 1px solid #e2e8f0;
}

.kpi-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
}

.kpi-top > div:first-child {
  min-width: 0;
}

.kpi-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
}

.kpi-value {
  margin-top: 0.375rem;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.1;
  color: #0f172a;
}

.kpi-hint {
  margin-top: 0.625rem;
  font-size: 0.75rem;
  color: #64748b;
}

.kpi-card-brand .kpi-value {
  color: var(--color-brand-700);
}
</style>
