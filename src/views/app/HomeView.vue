<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { menuModules } from '@/config/menu'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
const router = useRouter()

const modules = computed(() =>
  menuModules.filter((module) => !module.adminOnly || auth.isPlatformAdmin),
)

function goTo(route?: string): void {
  if (route) {
    router.push(route)
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p class="text-sm font-medium text-brand-600">Bienvenido</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-900">
        Hola, {{ auth.user?.name }}
      </h1>
      <p class="mt-2 text-slate-600">
        Estás conectado al cliente
        <strong>{{ auth.activeTenant?.name ?? auth.activeTenant?.slug }}</strong>.
        Desde aquí puedes ir avanzando módulo por módulo.
      </p>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="module in modules"
        :key="module.id"
        class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
      >
        <div class="mb-4 flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-700">
            {{ module.icon }}
          </span>
          <h2 class="text-lg font-semibold text-slate-900">{{ module.label }}</h2>
        </div>

        <ul class="space-y-2">
          <li
            v-for="item in module.children"
            :key="item.label"
            class="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
          >
            <span :class="item.ready ? 'text-slate-800' : 'text-slate-500'">
              {{ item.label }}
            </span>
            <button
              v-if="item.route"
              type="button"
              class="text-xs font-medium text-brand-600 hover:text-brand-700"
              @click="goTo(item.route)"
            >
              {{ item.ready ? 'Abrir' : 'Vista previa' }}
            </button>
          </li>
        </ul>
      </article>
    </section>
  </div>
</template>

<style scoped>
.text-brand-600 {
  color: var(--color-brand-600);
}
.text-brand-700,
.hover\:text-brand-700:hover {
  color: var(--color-brand-700);
}
.bg-brand-100 {
  background-color: var(--color-brand-100);
}
</style>
