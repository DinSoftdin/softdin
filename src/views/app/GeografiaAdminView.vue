<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import GeografiaEntityModal from '@/views/app/components/GeografiaEntityModal.vue'
import GeografiaTreePanel from '@/views/app/components/GeografiaTreePanel.vue'
import { geoService } from '@/services/geo.service'
import type { Barrio, Ciudad, ContinenteEnumItem, Departamento, GeoLevel, Pais } from '@/types/geo'
import { DEFAULT_CONTINENTE_ID, GEO_LEVEL_LABELS } from '@/types/geo'
import { getContinenteById, getContinentesEnum } from '@/lib/softdin-libreria'

const loading = ref(false)
const treeLoading = ref(false)
const isBootstrapping = ref(false)
const error = ref<string | null>(null)
const search = ref('')

const continentes = ref<ContinenteEnumItem[]>([])
const selectedContinenteId = ref<number>(DEFAULT_CONTINENTE_ID)
const selectedPaisId = ref<number | null>(null)
const selectedDepartamentoId = ref<number | null>(null)
const selectedCiudadId = ref<number | null>(null)

const paisesOptions = ref<Pais[]>([])
const departamentosOptions = ref<Departamento[]>([])
const ciudadesOptions = ref<Ciudad[]>([])

const tableItems = ref<Array<Pais | Departamento | Ciudad | Barrio>>([])
const currentPage = ref(1)
const lastPage = ref(1)
const total = ref(0)

const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingRecord = ref<Pais | Departamento | Ciudad | Barrio | null>(null)
const suggestedId = ref(1)
let paisesRequestSeq = 0

const activeLevel = computed<GeoLevel>(() => {
  if (selectedCiudadId.value) {
    return 'barrio'
  }
  if (selectedDepartamentoId.value) {
    return 'ciudad'
  }
  if (selectedPaisId.value) {
    return 'departamento'
  }
  return 'pais'
})

const breadcrumb = computed(() => {
  const parts: string[] = []
  const continente = getContinenteById(selectedContinenteId.value)
  if (continente) {
    parts.push(continente.description)
  }
  const pais = paisesOptions.value.find((item) => item.id === selectedPaisId.value)
  if (pais) {
    parts.push(pais.pais)
  }
  const departamento = departamentosOptions.value.find((item) => item.id === selectedDepartamentoId.value)
  if (departamento) {
    parts.push(departamento.departamento)
  }
  const ciudad = ciudadesOptions.value.find((item) => item.id === selectedCiudadId.value)
  if (ciudad) {
    parts.push(ciudad.ciudad)
  }
  return parts.join(' › ')
})

function activoLabel(value: boolean): string {
  return value ? 'Sí' : 'No'
}

async function loadContinentes(): Promise<void> {
  try {
    const data = await geoService.listContinentes()
    continentes.value = data.length > 0 ? data : getContinentesEnum()
    const previous = selectedContinenteId.value
    if (!continentes.value.some((item) => item.id === selectedContinenteId.value)) {
      selectedContinenteId.value = continentes.value[0]?.id ?? DEFAULT_CONTINENTE_ID
    }
    if (selectedContinenteId.value !== previous) {
      await loadPaisesOptions()
    }
  } catch {
    continentes.value = getContinentesEnum()
  }
}

async function loadPaisesOptions(): Promise<void> {
  const continente = selectedContinenteId.value
  const requestSeq = ++paisesRequestSeq
  treeLoading.value = true
  try {
    const response = await geoService.listPaises({
      continente,
      per_page: 200,
      page: 1,
    })

    if (requestSeq !== paisesRequestSeq || continente !== selectedContinenteId.value) {
      return
    }

    paisesOptions.value = response.data

    if (selectedPaisId.value && !paisesOptions.value.some((item) => item.id === selectedPaisId.value)) {
      selectedPaisId.value = null
      selectedDepartamentoId.value = null
      selectedCiudadId.value = null
    }
  } catch (err) {
    if (requestSeq !== paisesRequestSeq) {
      return
    }
    paisesOptions.value = []
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudieron cargar los países del continente.'
      return
    }
    error.value = 'Error de conexión al cargar los países.'
  } finally {
    if (requestSeq === paisesRequestSeq) {
      treeLoading.value = false
    }
  }
}

async function loadDepartamentosOptions(): Promise<void> {
  if (!selectedPaisId.value) {
    departamentosOptions.value = []
    return
  }

  const response = await geoService.listDepartamentos({
    idpais: selectedPaisId.value,
    per_page: 200,
    page: 1,
  })
  departamentosOptions.value = response.data

  if (
    selectedDepartamentoId.value
    && !departamentosOptions.value.some((item) => item.id === selectedDepartamentoId.value)
  ) {
    selectedDepartamentoId.value = null
    selectedCiudadId.value = null
  }
}

async function loadCiudadesOptions(): Promise<void> {
  if (!selectedDepartamentoId.value) {
    ciudadesOptions.value = []
    return
  }

  const response = await geoService.listCiudades({
    iddepartamento: selectedDepartamentoId.value,
    per_page: 200,
    page: 1,
  })
  ciudadesOptions.value = response.data

  if (selectedCiudadId.value && !ciudadesOptions.value.some((item) => item.id === selectedCiudadId.value)) {
    selectedCiudadId.value = null
  }
}

async function loadTable(page = 1): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const q = search.value.trim() || undefined

    if (activeLevel.value === 'pais') {
      const response = await geoService.listPaises({
        continente: selectedContinenteId.value,
        q,
        page,
        per_page: 50,
      })
      tableItems.value = response.data
      currentPage.value = response.meta.current_page
      lastPage.value = response.meta.last_page
      total.value = response.meta.total
      return
    }

    if (activeLevel.value === 'departamento') {
      if (!selectedPaisId.value) {
        tableItems.value = []
        return
      }
      const response = await geoService.listDepartamentos({
        idpais: selectedPaisId.value,
        q,
        page,
        per_page: 50,
      })
      tableItems.value = response.data
      currentPage.value = response.meta.current_page
      lastPage.value = response.meta.last_page
      total.value = response.meta.total
      return
    }

    if (activeLevel.value === 'ciudad') {
      if (!selectedDepartamentoId.value) {
        tableItems.value = []
        return
      }
      const response = await geoService.listCiudades({
        iddepartamento: selectedDepartamentoId.value,
        q,
        page,
        per_page: 50,
      })
      tableItems.value = response.data
      currentPage.value = response.meta.current_page
      lastPage.value = response.meta.last_page
      total.value = response.meta.total
      return
    }

    if (!selectedCiudadId.value) {
      tableItems.value = []
      return
    }

    const response = await geoService.listBarrios({
      idciudad: selectedCiudadId.value,
      q,
      page,
      per_page: 50,
    })
    tableItems.value = response.data
    currentPage.value = response.meta.current_page
    lastPage.value = response.meta.last_page
    total.value = response.meta.total
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudo cargar la geografía.'
      return
    }
    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

async function refreshAll(): Promise<void> {
  await loadPaisesOptions()
  await loadDepartamentosOptions()
  await loadCiudadesOptions()
  await loadTable(1)
}

async function suggestIdForLevel(level: GeoLevel): Promise<number> {
  if (level === 'pais') {
    return geoService.suggestNextId((page) =>
      geoService.listPaises({ continente: selectedContinenteId.value, page, per_page: 200 }),
    )
  }
  if (level === 'departamento' && selectedPaisId.value) {
    return geoService.suggestNextId((page) =>
      geoService.listDepartamentos({ idpais: selectedPaisId.value!, page, per_page: 200 }),
    )
  }
  if (level === 'ciudad' && selectedDepartamentoId.value) {
    return geoService.suggestNextId((page) =>
      geoService.listCiudades({ iddepartamento: selectedDepartamentoId.value!, page, per_page: 200 }),
    )
  }
  if (level === 'barrio' && selectedCiudadId.value) {
    return geoService.suggestNextId((page) =>
      geoService.listBarrios({ idciudad: selectedCiudadId.value!, page, per_page: 200 }),
    )
  }
  return 1
}

async function openCreate(): Promise<void> {
  modalMode.value = 'create'
  editingRecord.value = null
  suggestedId.value = await suggestIdForLevel(activeLevel.value)
  modalOpen.value = true
}

function openEdit(record: Pais | Departamento | Ciudad | Barrio): void {
  modalMode.value = 'edit'
  editingRecord.value = record
  suggestedId.value = record.id
  modalOpen.value = true
}

async function deleteRecord(record: Pais | Departamento | Ciudad | Barrio): Promise<void> {
  const labels: Record<GeoLevel, string> = {
    pais: 'el país',
    departamento: 'el departamento',
    ciudad: 'la ciudad',
    barrio: 'el barrio',
  }
  const name =
    'pais' in record
      ? record.pais
      : 'departamento' in record
        ? record.departamento
        : 'ciudad' in record
          ? record.ciudad
          : record.barrio

  if (!window.confirm(`¿Eliminar ${labels[activeLevel.value]} «${name}»?`)) {
    return
  }

  loading.value = true
  error.value = null

  try {
    if (activeLevel.value === 'pais') {
      await geoService.deletePais(record.id)
    } else if (activeLevel.value === 'departamento') {
      await geoService.deleteDepartamento(record.id)
    } else if (activeLevel.value === 'ciudad') {
      await geoService.deleteCiudad(record.id)
    } else {
      await geoService.deleteBarrio(record.id)
    }
    await refreshAll()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudo eliminar el registro.'
      return
    }
    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

async function applyInitialDefaults(): Promise<void> {
  selectedContinenteId.value = DEFAULT_CONTINENTE_ID
  selectedPaisId.value = null
  selectedDepartamentoId.value = null
  selectedCiudadId.value = null
  await loadPaisesOptions()
}

async function onExpandPais(paisId: number): Promise<void> {
  if (selectedPaisId.value !== paisId) {
    selectedPaisId.value = paisId
    selectedDepartamentoId.value = null
    selectedCiudadId.value = null
  }
  await loadDepartamentosOptions()
}

async function onExpandDepartamento(departamentoId: number): Promise<void> {
  if (selectedDepartamentoId.value !== departamentoId) {
    selectedDepartamentoId.value = departamentoId
    selectedCiudadId.value = null
  }
  await loadCiudadesOptions()
}

function onContinenteChange(): void {
  selectedPaisId.value = null
  selectedDepartamentoId.value = null
  selectedCiudadId.value = null
}

async function handleContinenteChange(value: number): Promise<void> {
  selectedContinenteId.value = value
  onContinenteChange()
  error.value = null
  search.value = ''
  await refreshAll()
}

function onPaisChange(): void {
  selectedDepartamentoId.value = null
  selectedCiudadId.value = null
}

function onDepartamentoChange(): void {
  selectedCiudadId.value = null
}

function goToPage(page: number): void {
  if (page < 1 || page > lastPage.value || page === currentPage.value) {
    return
  }
  void loadTable(page)
}

function canCreateAtLevel(): boolean {
  if (activeLevel.value === 'pais') {
    return selectedContinenteId.value > 0
  }
  if (activeLevel.value === 'departamento') {
    return selectedPaisId.value !== null
  }
  if (activeLevel.value === 'ciudad') {
    return selectedDepartamentoId.value !== null
  }
  return selectedCiudadId.value !== null
}

onMounted(async () => {
  isBootstrapping.value = true
  try {
    await loadContinentes()
    await applyInitialDefaults()
    await loadTable(1)
  } finally {
    isBootstrapping.value = false
  }
})

watch(selectedPaisId, async () => {
  if (isBootstrapping.value) {
    return
  }
  onPaisChange()
  await loadDepartamentosOptions()
  await loadTable(1)
})

watch(selectedDepartamentoId, async () => {
  if (isBootstrapping.value) {
    return
  }
  onDepartamentoChange()
  await loadCiudadesOptions()
  await loadTable(1)
})

watch(selectedCiudadId, async () => {
  if (isBootstrapping.value) {
    return
  }
  await loadTable(1)
})

watch(search, () => {
  void loadTable(1)
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p class="text-sm font-medium text-brand-600">Registros maestros</p>
      <h1 class="mt-1 text-2xl font-bold text-slate-900">Geografía</h1>
      <p class="mt-2 text-sm text-slate-600">
        Navegue la jerarquía continente → país → departamento → ciudad → barrio del cliente activo.
      </p>
      <p v-if="breadcrumb" class="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {{ breadcrumb }}
      </p>
    </section>

    <section class="geo-workspace rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <GeografiaTreePanel
        class="geo-tree"
        :continentes="continentes"
        :selected-continente-id="selectedContinenteId"
        :paises="paisesOptions"
        :departamentos="departamentosOptions"
        :ciudades="ciudadesOptions"
        :selected-pais-id="selectedPaisId"
        :selected-departamento-id="selectedDepartamentoId"
        :selected-ciudad-id="selectedCiudadId"
        :loading="treeLoading"
        @continente-change="handleContinenteChange"
        @update:selected-pais-id="selectedPaisId = $event"
        @update:selected-departamento-id="selectedDepartamentoId = $event"
        @update:selected-ciudad-id="selectedCiudadId = $event"
        @expand-pais="onExpandPais"
        @expand-departamento="onExpandDepartamento"
      />

      <div class="geo-main">
        <div class="geo-toolbar">
          <div class="flex-1">
            <label for="geo-search" class="label">Buscar en {{ GEO_LEVEL_LABELS[activeLevel].toLowerCase() }}</label>
            <input
              id="geo-search"
              v-model="search"
              type="search"
              class="input-field"
              placeholder="Nombre…"
            />
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary" :disabled="loading" @click="refreshAll">
              {{ loading ? 'Actualizando…' : 'Actualizar' }}
            </button>
            <button
              type="button"
              class="btn-primary"
              :disabled="loading || !canCreateAtLevel()"
              @click="openCreate"
            >
              Nuevo {{ GEO_LEVEL_LABELS[activeLevel].slice(0, -1).toLowerCase() }}
            </button>
          </div>
        </div>

        <header class="geo-table-header">
          <h2 class="text-lg font-semibold text-slate-900">{{ GEO_LEVEL_LABELS[activeLevel] }}</h2>
          <span class="text-sm text-slate-500">{{ total.toLocaleString('es-CO') }} registro(s)</span>
        </header>

        <p v-if="error" class="alert-error">{{ error }}</p>
        <p v-else-if="loading && tableItems.length === 0" class="state-message">Cargando…</p>
        <p v-else-if="tableItems.length === 0" class="state-message">
          No hay registros con los filtros seleccionados.
        </p>

        <div v-else class="table-wrap">
          <table class="geo-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th v-if="activeLevel === 'pais'">Continente</th>
                <th v-if="activeLevel === 'pais'">Alfa-3</th>
                <th v-if="activeLevel === 'departamento'">DANE</th>
                <th v-if="activeLevel === 'departamento'">ISO</th>
                <th v-if="activeLevel === 'ciudad'">DANE</th>
                <th>Activo</th>
                <th class="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in tableItems" :key="item.id">
                <td>{{ item.id }}</td>
                <td>
                  {{
                    'pais' in item
                      ? item.pais
                      : 'departamento' in item
                        ? item.departamento
                        : 'ciudad' in item
                          ? item.ciudad
                          : item.barrio
                  }}
                </td>
                <td v-if="activeLevel === 'pais'">{{ (item as Pais).continente_label ?? '—' }}</td>
                <td v-if="activeLevel === 'pais'">{{ (item as Pais).codigo_alfa3 ?? '—' }}</td>
                <td v-if="activeLevel === 'departamento'">{{ (item as Departamento).codigodane }}</td>
                <td v-if="activeLevel === 'departamento'">{{ (item as Departamento).codigo_iso }}</td>
                <td v-if="activeLevel === 'ciudad'">{{ (item as Ciudad).codigodane }}</td>
                <td>{{ activoLabel(item.activo) }}</td>
                <td class="actions-col">
                  <button type="button" class="link-btn" @click="openEdit(item)">Editar</button>
                  <button type="button" class="link-btn link-danger" @click="deleteRecord(item)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer v-if="lastPage > 1" class="pagination">
          <button type="button" class="btn-secondary" :disabled="loading || currentPage <= 1" @click="goToPage(currentPage - 1)">
            Anterior
          </button>
          <span class="pagination-label">Página {{ currentPage }} de {{ lastPage }}</span>
          <button type="button" class="btn-secondary" :disabled="loading || currentPage >= lastPage" @click="goToPage(currentPage + 1)">
            Siguiente
          </button>
        </footer>
      </div>
    </section>

    <GeografiaEntityModal
      v-model:open="modalOpen"
      :level="activeLevel"
      :mode="modalMode"
      :record="editingRecord"
      :continente-id="selectedContinenteId"
      :pais-id="selectedPaisId"
      :departamento-id="selectedDepartamentoId"
      :ciudad-id="selectedCiudadId"
      :suggested-id="suggestedId"
      @saved="refreshAll"
    />
  </div>
</template>

<style scoped>
.text-brand-600 {
  color: var(--color-brand-600);
}

.cascade-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.geo-workspace {
  display: flex;
  flex-direction: column;
  min-height: 32rem;
  overflow: hidden;
}

@media (min-width: 1024px) {
  .geo-workspace {
    flex-direction: row;
  }
}

.geo-tree {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 14rem;
  max-height: 20rem;
}

@media (min-width: 1024px) {
  .geo-tree {
    width: 17rem;
    min-height: 0;
    max-height: none;
    flex-shrink: 0;
    align-self: stretch;
  }
}

.geo-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.geo-toolbar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

@media (min-width: 768px) {
  .geo-toolbar {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.geo-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.875rem 1.25rem;
}

@media (min-width: 768px) {
  .cascade-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .cascade-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.input-field {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.input-field:disabled {
  background: #f8fafc;
  color: #94a3b8;
}

.btn-primary {
  border-radius: 0.5rem;
  background: var(--color-brand-600);
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.btn-secondary {
  border-radius: 0.5rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  color: #334155;
}

.btn-secondary:disabled {
  opacity: 0.6;
}

.table-wrap {
  overflow-x: auto;
}

.geo-table {
  width: 100%;
  min-width: 40rem;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.geo-table th,
.geo-table td {
  border-bottom: 1px solid #f1f5f9;
  padding: 0.75rem 1.5rem;
  text-align: left;
}

.geo-table th {
  background: #f8fafc;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.actions-col {
  white-space: nowrap;
}

.link-btn {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-brand-700);
}

.link-btn + .link-btn {
  margin-left: 0.75rem;
}

.link-danger {
  color: #b91c1c;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  border-top: 1px solid #e2e8f0;
  padding: 1rem;
}

.pagination-label {
  font-size: 0.875rem;
  color: #64748b;
}

.state-message {
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.875rem;
  color: #64748b;
}

.alert-error {
  margin: 1rem 1.5rem 0;
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
}
</style>
