<script setup lang="ts">
import { computed } from 'vue'
import type { ChartSegment } from '@/types/central-dashboard'

const props = defineProps<{
  title: string
  subtitle?: string
  segments: ChartSegment[]
  centerLabel?: string
}>()

const total = computed(() => props.segments.reduce((sum, item) => sum + item.count, 0))

const arcs = computed(() => {
  const sum = total.value
  if (sum === 0) {
    return [{
      key: 'empty',
      label: 'Sin datos',
      count: 0,
      color: '#e2e8f0',
      dashArray: '1 999',
      dashOffset: 0,
    }]
  }

  const circumference = 2 * Math.PI * 42
  let offset = 0

  return props.segments
    .filter((segment) => segment.count > 0)
    .map((segment) => {
      const ratio = segment.count / sum
      const length = ratio * circumference
      const dashArray = `${length} ${circumference - length}`
      const dashOffset = -offset
      offset += length

      return {
        ...segment,
        dashArray,
        dashOffset,
      }
    })
})
</script>

<template>
  <article class="chart-card">
    <header class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
    </header>

    <div class="chart-body">
      <div class="donut-wrap">
        <svg viewBox="0 0 100 100" class="donut-svg" aria-hidden="true">
          <circle cx="50" cy="50" r="42" class="donut-track" />
          <circle
            v-for="arc in arcs"
            :key="arc.key"
            cx="50"
            cy="50"
            r="42"
            class="donut-segment"
            :stroke="arc.color"
            :stroke-dasharray="arc.dashArray"
            :stroke-dashoffset="arc.dashOffset"
          />
        </svg>
        <div class="donut-center">
          <p class="donut-center-value">{{ total }}</p>
          <p class="donut-center-label">{{ centerLabel ?? 'Total' }}</p>
        </div>
      </div>

      <ul class="legend">
        <li v-for="segment in segments" :key="segment.key" class="legend-item">
          <span class="legend-dot" :style="{ backgroundColor: segment.color }" />
          <span class="legend-label">{{ segment.label }}</span>
          <span class="legend-value">{{ segment.count }}</span>
        </li>
      </ul>
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

.chart-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: center;
}

@media (min-width: 480px) {
  .chart-body {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.donut-wrap {
  position: relative;
  width: 9rem;
  height: 9rem;
  flex-shrink: 0;
}

.donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-track {
  fill: none;
  stroke: #f1f5f9;
  stroke-width: 12;
}

.donut-segment {
  fill: none;
  stroke-width: 12;
  stroke-linecap: butt;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-center-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}

.donut-center-label {
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.legend {
  width: 100%;
  list-style: none;
  margin: 0;
  padding: 0;
}

.legend-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.375rem 0;
  font-size: 0.875rem;
}

.legend-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 9999px;
}

.legend-label {
  color: #475569;
}

.legend-value {
  font-weight: 600;
  color: #0f172a;
}
</style>
