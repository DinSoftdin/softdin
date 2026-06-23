<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => (route.meta.title as string) ?? 'Módulo')
const moduleName = computed(() => (route.meta.module as string) ?? '')
</script>

<template>
  <div class="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
    <p class="text-sm font-medium text-brand-600">{{ moduleName }}</p>
    <h1 class="mt-1 text-2xl font-bold text-slate-900">{{ title }}</h1>
    <p class="mt-4 text-slate-600">
      Esta pantalla está reservada para el módulo <strong>{{ title }}</strong>.
      La estructura de rutas y menú ya está lista; aquí irá el CRUD o la funcionalidad correspondiente.
    </p>

    <div class="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
      Próximo paso: conectar con la API operacional y construir la interfaz de este módulo.
    </div>
  </div>
</template>

<style scoped>
.text-brand-600 {
  color: var(--color-brand-600);
}
</style>
