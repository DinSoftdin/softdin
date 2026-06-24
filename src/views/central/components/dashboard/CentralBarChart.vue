<script setup lang="ts">
import { computed } from 'vue'

export interface BarChartItem {
  key: string
  label: string
  count: number
}

const props = defineProps<{
  title: string
  subtitle?: string
  items: BarChartItem[]
  color?: string
}>()

const maxCount = computed(() => Math.max(...props.items.map((item) => item.count), 1))

function barHeight(count: number): string {
  const ratio = count / maxCount.value
  return `${Math.max(ratio * 100, count > 0 ? 8 : 0)}%`
}
</script>

<template>
  <article class="chart-card">
    <header class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
    </header>

    <div class="bars-wrap">
      <div v-for="item in items" :key="item.key" class="bar-column">
        <p class="bar-value">{{ item.count }}</p>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{
              height: barHeight(item.count),
              backgroundColor: color ?? 'var(--color-brand-600)',
            }"
          />
        </div>
        <p class="bar-label">{{ item.label }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.chart-card {
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.chart-header {
  margin-bottom: 1rem;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.chart-subtitle {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.bars-wrap {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3.5rem, 1fr));
  gap: 0.75rem;
  align-items: end;
  min-height: 12rem;
  padding-top: 0.5rem;
}

.bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.bar-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
}

.bar-track {
  display: flex;
  align-items: flex-end;
  width: 100%;
  max-width: 2.75rem;
  height: 8.5rem;
  border-radius: 0.5rem 0.5rem 0 0;
  background: #f8fafc;
}

.bar-fill {
  width: 100%;
  border-radius: 0.5rem 0.5rem 0 0;
  transition: height 0.35s ease;
}

.bar-label {
  font-size: 0.6875rem;
  text-align: center;
  color: #64748b;
  line-height: 1.2;
  word-break: break-word;
}
</style>
