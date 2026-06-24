<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { centralMenuItems } from '@/config/centralMenu'
import { useAuthStore } from '@/stores/auth.store'

const open = defineModel<boolean>('open', { default: false })
const collapsed = defineModel<boolean>('collapsed', { default: false })

const emit = defineEmits<{
  navigate: []
}>()

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const isCompact = computed(() => collapsed.value && !open.value)

const menuItems = computed(() =>
  centralMenuItems.filter((item) => !item.requiresSuperuser || auth.isSuperuser),
)

function navigateTo(routeName: string): void {
  router.push({ name: routeName })
  emit('navigate')
}
</script>

<template>
  <aside
    class="sidebar fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-white transition-all duration-200"
    :class="[
      isCompact ? 'sidebar-collapsed' : 'sidebar-expanded',
      open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
  >
    <div class="sidebar-header border-b border-white/10">
      <div class="flex items-center" :class="isCompact ? 'justify-center' : 'gap-3'">
        <span class="brand-mark" title="SoftDIN Central">SC</span>
        <div v-if="!isCompact" class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold tracking-wide">SoftDIN Central</p>
          <p class="truncate text-xs text-slate-400">Administración plataforma</p>
        </div>
      </div>
    </div>

    <nav
      class="flex-1 overflow-y-auto overflow-x-hidden py-4"
      :class="isCompact ? 'px-2' : 'px-3'"
    >
      <button
        v-for="item in menuItems"
        :key="item.routeName"
        type="button"
        class="nav-item mb-1"
        :class="[
          route.name === item.routeName ? 'nav-item-active' : 'nav-item-inactive',
          isCompact ? 'nav-item-collapsed' : '',
        ]"
        :title="item.label"
        @click="navigateTo(item.routeName)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span v-if="!isCompact" class="nav-label">{{ item.label }}</span>
      </button>
    </nav>

    <div
      class="border-t border-white/10 text-xs text-slate-500"
      :class="isCompact ? 'px-2 py-3 text-center' : 'px-4 py-3'"
    >
      <span v-if="isCompact" title="Versión 0.1">v</span>
      <span v-else>Central v0.1</span>
    </div>
  </aside>
</template>

<style scoped>
.bg-sidebar {
  background-color: #0f172a;
}

.sidebar-expanded {
  width: 16rem;
}

.sidebar-collapsed {
  width: 4.5rem;
}

.sidebar-header {
  padding: 1rem;
}

.brand-mark {
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: var(--color-brand-600);
  font-size: 0.75rem;
  font-weight: 800;
}

.nav-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.nav-item-collapsed {
  justify-content: center;
  padding: 0.5rem;
}

.nav-item-active {
  background-color: var(--color-brand-600);
  color: #fff;
}

.nav-item-inactive {
  color: #cbd5e1;
}

.nav-item-inactive:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-icon {
  display: flex;
  height: 1.75rem;
  width: 1.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  font-weight: 700;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
