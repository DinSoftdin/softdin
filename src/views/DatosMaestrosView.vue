<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { menuModules } from '@/config/menu'

const router = useRouter()

const maestrosModule = computed(() => menuModules.find((module) => module.id === 'maestros'))

function goTo(route?: string): void {
  if (route) {
    router.push(route)
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p class="text-sm font-medium text-brand-600">Datos Maestros</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-900">Catálogos operacionales</h1>
      <p class="mt-2 text-slate-600">
        Seleccione un maestro para consultar o administrar la información del cliente activo.
      </p>
    </section>

    <section v-if="maestrosModule" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="item in maestrosModule.children"
        :key="item.label"
        class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
      >
        <h2 class="text-lg font-semibold text-slate-900">{{ item.label }}</h2>
        <p class="mt-2 text-sm text-slate-500">
          {{ item.ready ? 'Disponible' : 'En construcción' }}
        </p>
        <button
          v-if="item.route"
          type="button"
          class="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
          @click="goTo(item.route)"
        >
          {{ item.ready ? 'Abrir' : 'Vista previa' }}
        </button>
      </article>
    </section>
  </div>
</template>

<style scoped>
.text-brand-600 {
  color: var(--color-brand-600);
}

.hover\:text-brand-700:hover {
  color: var(--color-brand-700);
}
</style>
