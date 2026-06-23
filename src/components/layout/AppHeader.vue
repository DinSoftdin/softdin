<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

defineEmits<{
  toggleSidebar: []
}>()

const { sidebarCollapsed = false } = defineProps<{
  sidebarCollapsed?: boolean
}>()

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const menuOpen = ref(false)
const menuRoot = ref<HTMLElement | null>(null)

const userInitials = computed(() => {
  const name = auth.user?.name?.trim() ?? ''
  if (!name) {
    return 'TU'
  }

  const parts = name.split(/\s+/).slice(0, 2)
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? '').join('')

  return initials || 'TU'
})

const isProfileRoute = computed(() => route.name === 'profile')
const isTenantBrandingRoute = computed(() => route.name === 'tenant-branding')

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value
}

function closeMenu(): void {
  menuOpen.value = false
}

function goToProfile(): void {
  closeMenu()
  void router.push({ name: 'profile' })
}

function goToTenantBranding(): void {
  closeMenu()
  void router.push({ name: 'tenant-branding' })
}

async function handleLogout(): Promise<void> {
  closeMenu()
  await auth.logout()
  void router.push({ name: 'login' })
}

function onDocumentClick(event: MouseEvent): void {
  if (!menuOpen.value || !menuRoot.value) {
    return
  }

  if (!menuRoot.value.contains(event.target as Node)) {
    closeMenu()
  }
}

watch(
  () => route.fullPath,
  () => closeMenu(),
)

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))
</script>

<template>
  <header class="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="sidebar-toggle"
        :aria-label="sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'"
        :aria-expanded="!sidebarCollapsed"
        @click="$emit('toggleSidebar')"
      >
        <span class="sidebar-toggle-icon" aria-hidden="true">☰</span>
      </button>
      <span class="hidden text-sm font-medium text-slate-700 sm:inline">
        Sistema operacional
      </span>
    </div>

    <div ref="menuRoot" class="relative">
      <button
        type="button"
        class="user-menu-trigger"
        aria-label="Abrir menú de usuario"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        @click.stop="toggleMenu"
      >
        <span class="user-info">
          <span class="user-name">{{ auth.user?.name }}</span>
          <span class="user-tenant">{{ auth.activeTenant?.name }}</span>
        </span>

        <span class="user-avatar">
          <img
            v-if="auth.avatarUrl"
            :src="auth.avatarUrl"
            :alt="auth.user?.name ?? 'Usuario'"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ userInitials }}</span>
        </span>

        <span class="menu-chevron">{{ menuOpen ? '▴' : '▾' }}</span>
      </button>

      <div
        v-if="menuOpen"
        class="user-dropdown"
        role="menu"
        aria-label="Opciones de usuario"
      >
        <div class="border-b border-slate-100 px-4 py-3">
          <div class="flex items-center gap-3">
            <span class="user-avatar user-avatar-sm">
              <img
                v-if="auth.avatarUrl"
                :src="auth.avatarUrl"
                alt=""
                class="h-full w-full object-cover"
              />
              <span v-else>{{ userInitials }}</span>
            </span>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-slate-900">{{ auth.user?.name }}</p>
              <p class="truncate text-xs text-slate-500">{{ auth.user?.email }}</p>
            </div>
          </div>
        </div>

        <div class="py-1">
          <button
            type="button"
            role="menuitem"
            class="menu-action"
            :class="{ 'menu-action-active': isProfileRoute }"
            @click="goToProfile"
          >
            Editar perfil
          </button>
          <button
            v-if="auth.canManageActiveTenantLogo"
            type="button"
            role="menuitem"
            class="menu-action"
            :class="{ 'menu-action-active': isTenantBrandingRoute }"
            @click="goToTenantBranding"
          >
            Logo del cliente
          </button>
          <button
            type="button"
            role="menuitem"
            class="menu-action menu-action-danger"
            @click="handleLogout"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.sidebar-toggle {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  color: #475569;
  transition: background-color 0.15s, color 0.15s;
}

.sidebar-toggle:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.sidebar-toggle-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  padding: 0.375rem 0.5rem;
  transition: background-color 0.15s;
}

.user-menu-trigger:hover {
  background-color: #f8fafc;
}

.user-info {
  min-width: 0;
  text-align: right;
}

.user-name {
  display: block;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
}

.user-tenant {
  display: block;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  color: #64748b;
}

@media (min-width: 640px) {
  .user-name,
  .user-tenant {
    max-width: 11rem;
  }
}

.menu-chevron {
  font-size: 0.75rem;
  color: #94a3b8;
}

.user-avatar {
  display: flex;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background-color: var(--color-brand-600);
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
}

.user-avatar-sm {
  height: 2.25rem;
  width: 2.25rem;
  font-size: 0.6875rem;
}

.user-dropdown {
  position: absolute;
  right: 0;
  z-index: 30;
  margin-top: 0.5rem;
  width: 14rem;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
}

.menu-action {
  display: block;
  width: 100%;
  padding: 0.625rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  color: #334155;
  transition: background-color 0.15s;
}

.menu-action:hover {
  background-color: #f8fafc;
}

.menu-action-active {
  background-color: var(--color-brand-50);
  color: var(--color-brand-700);
  font-weight: 500;
}

.menu-action-danger {
  color: #b91c1c;
}

.menu-action-danger:hover {
  background-color: #fef2f2;
}
</style>
