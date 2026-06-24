<script setup lang="ts">
import { computed } from 'vue'
import type { CentralDashboardSparklinePoint } from '@/types/central-dashboard'

const props = defineProps<{
  points: CentralDashboardSparklinePoint[]
  color?: string
  height?: number
}>()

const width = 120
const heightPx = computed(() => props.height ?? 36)

const path = computed(() => {
  const points = props.points
  if (points.length === 0) {
    return ''
  }

  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = points.length > 1 ? width / (points.length - 1) : 0
  const padY = 3
  const innerHeight = heightPx.value - padY * 2

  return points
    .map((point, index) => {
      const x = points.length > 1 ? index * stepX : width / 2
      const normalized = (point.value - min) / range
      const y = heightPx.value - padY - normalized * innerHeight
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
})

const areaPath = computed(() => {
  if (!path.value) {
    return ''
  }

  return `${path.value} L ${width} ${heightPx.value} L 0 ${heightPx.value} Z`
})
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${heightPx}`"
    class="sparkline"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      v-if="areaPath"
      :d="areaPath"
      class="sparkline-area"
      :style="{ fill: color ?? 'var(--color-brand-600)' }"
    />
    <path
      v-if="path"
      :d="path"
      class="sparkline-line"
      :style="{ stroke: color ?? 'var(--color-brand-600)' }"
    />
  </svg>
</template>

<style scoped>
.sparkline {
  width: 100%;
  height: 2.25rem;
  display: block;
}

.sparkline-area {
  opacity: 0.12;
}

.sparkline-line {
  fill: none;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}
</style>
