<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Ciudad, ContinenteEnumItem, Departamento, Pais } from '@/types/geo'

const props = defineProps<{
  continentes: ContinenteEnumItem[]
  selectedContinenteId: number
  paises: Pais[]
  departamentos: Departamento[]
  ciudades: Ciudad[]
  selectedPaisId: number | null
  selectedDepartamentoId: number | null
  selectedCiudadId: number | null
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:selectedContinenteId': [value: number]
  'continente-change': [value: number]
  'update:selectedPaisId': [value: number | null]
  'update:selectedDepartamentoId': [value: number | null]
  'update:selectedCiudadId': [value: number | null]
  'expand-pais': [id: number]
  'expand-departamento': [id: number]
}>()

const expandedPaises = ref<Set<number>>(new Set())
const expandedDepartamentos = ref<Set<number>>(new Set())

function isPaisExpanded(id: number): boolean {
  return expandedPaises.value.has(id)
}

function isDepartamentoExpanded(id: number): boolean {
  return expandedDepartamentos.value.has(id)
}

function togglePaisExpand(id: number): void {
  const next = new Set(expandedPaises.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
    emit('expand-pais', id)
  }
  expandedPaises.value = next
}

function toggleDepartamentoExpand(id: number): void {
  const next = new Set(expandedDepartamentos.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
    emit('expand-departamento', id)
  }
  expandedDepartamentos.value = next
}

function selectContinente(value: string): void {
  const id = Number(value)
  if (!Number.isFinite(id)) {
    return
  }
  expandedPaises.value = new Set()
  expandedDepartamentos.value = new Set()
  emit('update:selectedContinenteId', id)
  emit('continente-change', id)
}

function selectPais(id: number): void {
  emit('update:selectedPaisId', id)
  emit('update:selectedDepartamentoId', null)
  emit('update:selectedCiudadId', null)
  const next = new Set(expandedPaises.value)
  next.add(id)
  expandedPaises.value = next
  emit('expand-pais', id)
}

function selectDepartamento(id: number): void {
  emit('update:selectedDepartamentoId', id)
  emit('update:selectedCiudadId', null)
  const next = new Set(expandedDepartamentos.value)
  next.add(id)
  expandedDepartamentos.value = next
  emit('expand-departamento', id)
}

function selectCiudad(id: number): void {
  emit('update:selectedCiudadId', id)
}

watch(
  () => props.selectedPaisId,
  (id) => {
    if (id !== null) {
      expandedPaises.value = new Set([...expandedPaises.value, id])
    }
  },
)

watch(
  () => props.selectedDepartamentoId,
  (id) => {
    if (id !== null) {
      expandedDepartamentos.value = new Set([...expandedDepartamentos.value, id])
    }
  },
)
</script>

<template>
  <aside class="tree-panel">
    <div class="tree-panel-header">
      <label for="tree-continente" class="tree-label">Continente</label>
      <select
        id="tree-continente"
        class="tree-select"
        :value="selectedContinenteId"
        @change="selectContinente(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="item in continentes" :key="item.id" :value="item.id">
          {{ item.description }}
        </option>
      </select>
    </div>

    <p v-if="!loading && paises.length > 0" class="tree-summary">
      {{ paises.length }} {{ paises.length === 1 ? 'país' : 'países' }}
    </p>

    <p v-if="loading" class="tree-state">Cargando…</p>
    <p v-else-if="paises.length === 0" class="tree-state">Sin países en este continente.</p>

    <ul v-else class="tree-root">
      <li v-for="pais in paises" :key="pais.id" class="tree-node">
        <div class="tree-row" :class="{ 'tree-row-active': selectedPaisId === pais.id && !selectedDepartamentoId }">
          <button
            type="button"
            class="tree-toggle"
            :aria-label="isPaisExpanded(pais.id) ? 'Contraer' : 'Expandir'"
            @click.stop="togglePaisExpand(pais.id)"
          >
            {{ isPaisExpanded(pais.id) ? '▾' : '▸' }}
          </button>
          <button type="button" class="tree-label-btn" @click="selectPais(pais.id)">
            {{ pais.pais }}
          </button>
        </div>

        <ul v-if="isPaisExpanded(pais.id) && selectedPaisId === pais.id" class="tree-children">
          <li v-for="dep in departamentos" :key="dep.id" class="tree-node">
            <div
              class="tree-row tree-row-nested"
              :class="{ 'tree-row-active': selectedDepartamentoId === dep.id && !selectedCiudadId }"
            >
              <button
                type="button"
                class="tree-toggle"
                :aria-label="isDepartamentoExpanded(dep.id) ? 'Contraer' : 'Expandir'"
                @click.stop="toggleDepartamentoExpand(dep.id)"
              >
                {{ isDepartamentoExpanded(dep.id) ? '▾' : '▸' }}
              </button>
              <button type="button" class="tree-label-btn" @click="selectDepartamento(dep.id)">
                {{ dep.departamento }}
              </button>
            </div>

            <ul
              v-if="isDepartamentoExpanded(dep.id) && selectedDepartamentoId === dep.id"
              class="tree-children"
            >
              <li v-for="ciu in ciudades" :key="ciu.id" class="tree-node">
                <div
                  class="tree-row tree-row-nested tree-row-leaf"
                  :class="{ 'tree-row-active': selectedCiudadId === ciu.id }"
                >
                  <span class="tree-toggle-spacer" aria-hidden="true" />
                  <button type="button" class="tree-label-btn" @click="selectCiudad(ciu.id)">
                    {{ ciu.ciudad }}
                  </button>
                </div>
              </li>
              <li v-if="ciudades.length === 0" class="tree-empty">Sin ciudades</li>
            </ul>
          </li>
          <li v-if="departamentos.length === 0" class="tree-empty">Sin departamentos</li>
        </ul>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.tree-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
}

.tree-panel-header {
  flex-shrink: 0;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
}

.tree-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.tree-select {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  padding: 0.45rem 0.65rem;
  font-size: 0.875rem;
  background: #fff;
}

.tree-root {
  flex: 1;
  min-height: 8rem;
  overflow-y: auto;
  margin: 0;
  padding: 0.5rem 0;
  list-style: none;
}

.tree-summary {
  flex-shrink: 0;
  margin: 0;
  padding: 0.35rem 1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
}

.tree-children {
  margin: 0;
  padding: 0;
  list-style: none;
}

.tree-node {
  margin: 0;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  min-height: 2rem;
  padding-right: 0.5rem;
}

.tree-row-nested {
  padding-left: 1rem;
}

.tree-row-leaf {
  padding-left: 1rem;
}

.tree-row-active {
  background: var(--color-brand-50, #eff6ff);
}

.tree-row-active .tree-label-btn {
  color: var(--color-brand-700);
  font-weight: 600;
}

.tree-toggle,
.tree-toggle-spacer {
  flex-shrink: 0;
  width: 1.5rem;
  text-align: center;
}

.tree-toggle {
  border: none;
  background: transparent;
  padding: 0.25rem;
  font-size: 0.6875rem;
  color: #64748b;
  cursor: pointer;
}

.tree-label-btn {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0.35rem 0.25rem;
  text-align: left;
  font-size: 0.8125rem;
  color: #334155;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-label-btn:hover {
  color: var(--color-brand-700);
}

.tree-empty,
.tree-state {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: #94a3b8;
  list-style: none;
}
</style>
