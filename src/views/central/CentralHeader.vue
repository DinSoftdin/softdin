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
    return 'SU'
  }

  const parts = name.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'SU'
})

function toggleMenu(): void {
  menuOpen.value = !menuOpen.value
}

function closeMenu(): void {
  menuOpen.value = false
}

function goToProfile(): void {
  closeMenu()
  void router.push({ name: 'central-profile' })
}

async function handleLogout(): Promise<void> {
  closeMenu()
  await auth.logout()
  void router.push({ name: 'login-central' })
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
        @click="$emit('toggleSidebar')"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <span class="hidden text-sm font-medium text-slate-700 sm:inline">
        SoftDIN Central
      </span>
    </div>

    <div ref="menuRoot" class="relative">
      <button type="button" class="user-menu-trigger" @click.stop="toggleMenu">
        <span class="user-info">
          <span class="user-name">{{ auth.user?.name }}</span>
          <span v-if="auth.platformRoleLabel" class="user-role">{{ auth.platformRoleLabel }}</span>
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
      </button>

      <div v-if="menuOpen" class="user-dropdown">
        <div class="border-b border-slate-100 px-4 py-3">
          <p class="truncate text-sm font-semibold text-slate-900">{{ auth.user?.name }}</p>
          <p class="truncate text-xs text-slate-500">{{ auth.user?.email }}</p>
          <p v-if="auth.platformRoleLabel" class="mt-1 text-xs font-medium text-brand-700">
            {{ auth.platformRoleLabel }}
          </p>
        </div>
        <div class="py-1">
          <button type="button" class="menu-action" @click="goToProfile">
            Editar perfil
          </button>
          <button type="button" class="menu-action menu-action-danger" @click="handleLogout">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.sidebar-toggle {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 0.25rem 0.5rem 0.25rem 0.75rem;
}

.user-info {
  display: none;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

@media (min-width: 640px) {
  .user-info {
    display: flex;
  }
}

.user-name {
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0f172a;
}

.user-role {
  font-size: 0.6875rem;
  color: var(--color-brand-700);
}

.user-avatar {
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background: #e2e8f0;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #475569;
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 50;
  min-width: 14rem;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}

.menu-action {
  display: block;
  width: 100%;
  padding: 0.625rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  color: #334155;
}

.menu-action:hover {
  background: #f8fafc;
}

.menu-action-danger {
  color: #b91c1c;
}

.text-brand-700 {
  color: var(--color-brand-700);
}
</style>
