<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { centralMenuItems } from '@/config/centralMenu'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const menuItems = computed(() =>
  centralMenuItems.filter((item) => !item.requiresSuperuser || auth.isSuperuser),
)

function navigateTo(routeName: string): void {
  void router.push({ name: routeName })
}
</script>

<template>
  <nav class="central-nav-tabs" aria-label="Administración central">
    <button
      v-for="item in menuItems"
      :key="item.routeName"
      type="button"
      class="central-nav-tab"
      :class="route.name === item.routeName ? 'central-nav-tab-active' : 'central-nav-tab-inactive'"
      @click="navigateTo(item.routeName)"
    >
      <span class="central-nav-tab-icon">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.central-nav-tabs {
  display: flex;
  align-items: stretch;
  gap: 0.25rem;
  overflow-x: auto;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  padding: 0 1rem;
}

.central-nav-tab {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.5rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  transition: color 0.15s, border-color 0.15s, background-color 0.15s;
}

.central-nav-tab:hover {
  color: #0f172a;
  background: #f8fafc;
}

.central-nav-tab-active {
  border-bottom-color: var(--color-brand-600);
  color: var(--color-brand-700);
  font-weight: 600;
}

.central-nav-tab-inactive {
  border-bottom-color: transparent;
}

.central-nav-tab-icon {
  display: inline-flex;
  height: 1.5rem;
  width: 1.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: #f1f5f9;
  font-size: 0.6875rem;
  font-weight: 700;
}

.central-nav-tab-active .central-nav-tab-icon {
  background: var(--color-brand-100);
  color: var(--color-brand-700);
}
</style>
