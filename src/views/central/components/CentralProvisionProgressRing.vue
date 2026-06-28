<script setup lang="ts">
defineProps<{
  percent: number
  label?: string
}>()
</script>

<template>
  <div class="provision-ring" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
    <svg class="provision-ring-svg" viewBox="0 0 120 120" aria-hidden="true">
      <circle class="provision-ring-track" cx="60" cy="60" r="52" />
      <circle
        class="provision-ring-progress"
        cx="60"
        cy="60"
        r="52"
        :style="{ strokeDashoffset: `${326.73 - (326.73 * percent) / 100}` }"
      />
    </svg>
    <div class="provision-ring-center">
      <span class="provision-ring-percent">{{ percent }}%</span>
      <span v-if="label" class="provision-ring-label">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.provision-ring {
  position: relative;
  width: 9rem;
  height: 9rem;
  margin: 0 auto;
}

.provision-ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.provision-ring-track,
.provision-ring-progress {
  fill: none;
  stroke-width: 8;
}

.provision-ring-track {
  stroke: rgb(226 232 240);
}

.provision-ring-progress {
  stroke: rgb(22 163 74);
  stroke-linecap: round;
  stroke-dasharray: 326.73;
  transition: stroke-dashoffset 0.35s ease;
}

.provision-ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  text-align: center;
  padding: 0.75rem;
}

.provision-ring-percent {
  font-size: 1.35rem;
  font-weight: 700;
  color: rgb(15 23 42);
  line-height: 1;
}

.provision-ring-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(100 116 139);
}
</style>
