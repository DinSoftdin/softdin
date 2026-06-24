<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { registrosMaestrosMenu } from '@/config/menu'

const open = defineModel<boolean>('open', { default: false })
const collapsed = defineModel<boolean>('collapsed', { default: false })

const emit = defineEmits<{
  navigate: []
}>()

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const switchingTenant = ref(false)
const tenantError = ref<string | null>(null)
const registrosMaestrosExpanded = ref(true)

const isCompact = computed(() => collapsed.value && !open.value)

const registrosMaestrosItems = computed(() =>
  registrosMaestrosMenu.children.filter((item) => item.ready && item.routeName),
)

const selectedTenantSlug = computed({
  get: () => auth.activeTenant?.slug ?? '',
  set: () => undefined,
})

const canSwitchTenant = computed(() => auth.tenants.length > 1)

const tenantInitials = computed(() => {
  const name = auth.activeTenant?.name?.trim() ?? 'SoftDIN'
  const parts = name.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'SD'
})

function isRegistrosMaestrosActive(): boolean {
  return route.path.startsWith('/maestros/')
}

function isRegistrosMaestrosRoute(routeName?: string): boolean {
  return Boolean(routeName && route.name === routeName)
}

function toggleRegistrosMaestros(): void {
  if (isCompact.value) {
    const first = registrosMaestrosItems.value[0]
    if (first?.routeName) {
      navigateTo(first.routeName)
    }
    return
  }

  registrosMaestrosExpanded.value = !registrosMaestrosExpanded.value
}

function navigateTo(routeName: string): void {
  router.push({ name: routeName })
  emit('navigate')
}

function tenantLabel(slug: string): string {
  const tenant = auth.tenants.find((item) => item.slug === slug)
  if (!tenant) {
    return slug
  }

  return tenant.name === tenant.slug ? tenant.name : `${tenant.name} (${tenant.slug})`
}

async function handleTenantChange(event: Event): Promise<void> {
  const select = event.target as HTMLSelectElement
  const slug = select.value

  if (!slug || slug === auth.activeTenant?.slug) {
    return
  }

  tenantError.value = null
  switchingTenant.value = true

  try {
    await auth.switchTenant(slug)
    await router.replace({ name: 'home' })
  } catch {
    tenantError.value = 'No se pudo cambiar de cliente. Debe iniciar sesión de nuevo.'
    select.value = auth.activeTenant?.slug ?? ''
  } finally {
    switchingTenant.value = false
  }
}

watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/maestros/')) {
      registrosMaestrosExpanded.value = true
    }
  },
  { immediate: true },
)
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
        <span class="tenant-logo-wrap" :title="auth.activeTenant?.name ?? 'SoftDIN'">
          <img
            v-if="auth.tenantLogoUrl"
            :src="auth.tenantLogoUrl"
            :alt="auth.activeTenant?.name ?? 'Logo del cliente'"
            class="h-full w-full object-contain"
          />
          <span v-else class="tenant-logo-fallback">{{ tenantInitials }}</span>
        </span>

        <div v-if="!isCompact" class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold tracking-wide">
            {{ auth.activeTenant?.name ?? 'SoftDIN' }}
          </p>
          <p v-if="auth.activeTenant" class="truncate text-xs text-slate-400">
            {{ auth.activeTenant.slug }}
          </p>
        </div>
      </div>

      <div v-if="auth.activeTenant && !isCompact" class="mt-3">
        <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Cliente activo
        </p>

        <select
          v-if="canSwitchTenant"
          :value="selectedTenantSlug"
          class="tenant-select mt-1 w-full"
          :disabled="switchingTenant"
          @change="handleTenantChange"
        >
          <option
            v-for="tenant in auth.tenants"
            :key="tenant.id"
            :value="tenant.slug"
          >
            {{ tenantLabel(tenant.slug) }}
          </option>
        </select>

        <p v-else-if="auth.activeTenant" class="mt-1 truncate text-sm text-slate-300">
          {{ auth.activeTenant.name }}
        </p>

        <p v-if="switchingTenant" class="mt-1 text-xs text-brand-100">
          Cambiando cliente…
        </p>
        <p v-if="tenantError" class="mt-1 text-xs text-red-300">
          {{ tenantError }}
        </p>
      </div>
    </div>

    <nav
      class="flex-1 overflow-y-auto overflow-x-hidden py-4"
      :class="isCompact ? 'px-2' : 'px-3'"
    >
      <button
        type="button"
        class="nav-item"
        :class="[
          route.name === 'home' ? 'nav-item-active' : 'nav-item-inactive',
          isCompact ? 'nav-item-collapsed' : '',
        ]"
        title="Inicio"
        @click="navigateTo('home')"
      >
        <span class="nav-icon">⌂</span>
        <span v-if="!isCompact" class="nav-label">Inicio</span>
      </button>

      <div class="nav-group mt-1">
        <button
          type="button"
          class="nav-item nav-item-parent"
          :class="[
            isRegistrosMaestrosActive() ? 'nav-item-active' : 'nav-item-inactive',
            isCompact ? 'nav-item-collapsed' : '',
          ]"
          :title="registrosMaestrosMenu.label"
          :aria-expanded="registrosMaestrosExpanded"
          @click="toggleRegistrosMaestros"
        >
          <span class="nav-icon">{{ registrosMaestrosMenu.icon }}</span>
          <span v-if="!isCompact" class="nav-label">{{ registrosMaestrosMenu.label }}</span>
          <span v-if="!isCompact" class="nav-chevron" aria-hidden="true">
            {{ registrosMaestrosExpanded ? '▾' : '▸' }}
          </span>
        </button>

        <div
          v-if="!isCompact && registrosMaestrosExpanded"
          class="nav-subitems"
        >
          <button
            v-for="item in registrosMaestrosItems"
            :key="item.routeName"
            type="button"
            class="nav-subitem"
            :class="isRegistrosMaestrosRoute(item.routeName) ? 'nav-subitem-active' : 'nav-subitem-inactive'"
            @click="navigateTo(item.routeName!)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <button
        v-if="auth.canViewTenantAudit"
        type="button"
        class="nav-item mt-1"
        :class="[
          route.name === 'tenant-audit' ? 'nav-item-active' : 'nav-item-inactive',
          isCompact ? 'nav-item-collapsed' : '',
        ]"
        title="Auditoría"
        @click="navigateTo('tenant-audit')"
      >
        <span class="nav-icon">A</span>
        <span v-if="!isCompact" class="nav-label">Auditoría</span>
      </button>
    </nav>

    <div
      class="border-t border-white/10 text-xs text-slate-500"
      :class="isCompact ? 'px-2 py-3 text-center' : 'px-4 py-3'"
    >
      <span v-if="isCompact" title="Versión 0.1">v</span>
      <span v-else>v0.1</span>
    </div>
  </aside>
</template>

<style scoped>
.bg-sidebar {
  background-color: var(--color-sidebar);
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

.sidebar-collapsed .sidebar-header {
  padding: 0.875rem 0.5rem;
}

.tenant-logo-wrap {
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.tenant-logo-fallback {
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}

.tenant-select {
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  padding: 0.45rem 0.6rem;
  font-size: 0.8125rem;
  color: #fff;
  outline: none;
}

.tenant-select:focus {
  border-color: var(--color-brand-500);
}

.tenant-select option {
  color: #0f172a;
}

.nav-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  transition: background-color 0.15s, color 0.15s;
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

.nav-item-parent {
  justify-content: flex-start;
}

.nav-chevron {
  margin-left: auto;
  font-size: 0.75rem;
  opacity: 0.85;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.nav-subitems {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding-left: 0.5rem;
  margin-left: 1.375rem;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
}

.nav-subitem {
  width: 100%;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  padding: 0.4rem 0.625rem;
  text-align: left;
  font-size: 0.8125rem;
  transition: background-color 0.15s, color 0.15s;
}

.nav-subitem-active {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-weight: 600;
}

.nav-subitem-inactive {
  color: #94a3b8;
}

.nav-subitem-inactive:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.text-brand-100 {
  color: var(--color-brand-100);
}
</style>
