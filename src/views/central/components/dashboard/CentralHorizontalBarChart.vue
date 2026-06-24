<script setup lang="ts">
import { computed } from 'vue'

export interface HorizontalBarItem {
  key: string
  label: string
  sublabel?: string
  count: number
}

const props = defineProps<{
  title: string
  subtitle?: string
  items: HorizontalBarItem[]
  color?: string
}>()

const maxCount = computed(() => Math.max(...props.items.map((item) => item.count), 1))

function barWidth(count: number): string {
  const ratio = count / maxCount.value
  return `${Math.max(ratio * 100, count > 0 ? 6 : 0)}%`
}
</script>

<template>
  <article class="chart-card">
    <header class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
    </header>

    <ul v-if="items.length > 0" class="bars-list">
      <li v-for="item in items" :key="item.key" class="bar-row">
        <div class="bar-labels">
          <p class="bar-name">{{ item.label }}</p>
          <p v-if="item.sublabel" class="bar-sublabel">{{ item.sublabel }}</p>
        </div>
        <div class="bar-track-wrap">
          <div class="bar-track">
            <div
              class="bar-fill"
              :style="{
                width: barWidth(item.count),
                backgroundColor: color ?? 'var(--color-brand-600)',
              }"
            />
          </div>
          <span class="bar-count">{{ item.count }}</span>
        </div>
      </li>
    </ul>

    <p v-else class="empty">No hay clientes con usuarios asignados todavía.</p>
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

.bars-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.bar-row {
  display: grid;
  gap: 0.375rem;
}

@media (min-width: 640px) {
  .bar-row {
    grid-template-columns: minmax(8rem, 12rem) 1fr;
    align-items: center;
    gap: 1rem;
  }
}

.bar-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.bar-sublabel {
  margin-top: 0.125rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  color: #64748b;
}

.bar-track-wrap {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.bar-track {
  flex: 1;
  height: 0.625rem;
  border-radius: 9999px;
  background: #f1f5f9;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.35s ease;
}

.bar-count {
  min-width: 1.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  text-align: right;
}

.empty {
  border-radius: 0.75rem;
  background: #f8fafc;
  padding: 1rem;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
}
</style>
