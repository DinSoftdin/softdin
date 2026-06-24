<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import axios from 'axios'
import { geoService } from '@/services/geo.service'
import type {
  Barrio,
  Ciudad,
  CreateBarrioPayload,
  CreateCiudadPayload,
  CreateDepartamentoPayload,
  CreatePaisPayload,
  Departamento,
  GeoLevel,
  Pais,
} from '@/types/geo'
import { getContinentesEnum } from '@/lib/softdin-libreria'
import { DEFAULT_CONTINENTE_ID } from '@/types/geo'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  level: GeoLevel
  mode: 'create' | 'edit'
  record: Pais | Departamento | Ciudad | Barrio | null
  continenteId: number | null
  paisId: number | null
  departamentoId: number | null
  ciudadId: number | null
  suggestedId: number
}>()

const emit = defineEmits<{
  saved: []
}>()

const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive({
  id: 0,
  pais: '',
  codigo_alfa2: '',
  codigo_alfa3: '',
  codigo_numerico: '',
  continente: null as number | null,
  departamento: '',
  codigodane: '',
  codigo_iso: '',
  ciudad: '',
  barrio: '',
  lat: '',
  lng: '',
  activo: true,
})

const title = computed(() => {
  const action = props.mode === 'create' ? 'Nuevo' : 'Editar'
  const labels: Record<GeoLevel, string> = {
    pais: 'país',
    departamento: 'departamento',
    ciudad: 'ciudad',
    barrio: 'barrio',
  }
  return `${action} ${labels[props.level]}`
})

const continenteOptions = computed(() => getContinentesEnum())

function resetForm(): void {
  form.id = props.mode === 'create' ? props.suggestedId : (props.record?.id ?? 0)
  form.pais = ''
  form.codigo_alfa2 = ''
  form.codigo_alfa3 = ''
  form.codigo_numerico = ''
  form.continente = props.continenteId ?? DEFAULT_CONTINENTE_ID
  form.departamento = ''
  form.codigodane = ''
  form.codigo_iso = ''
  form.ciudad = ''
  form.barrio = ''
  form.lat = ''
  form.lng = ''
  form.activo = true

  if (props.mode === 'edit' && props.record) {
    if (props.level === 'pais') {
      const row = props.record as Pais
      form.pais = row.pais
      form.codigo_alfa2 = row.codigo_alfa2 ?? ''
      form.codigo_alfa3 = row.codigo_alfa3 ?? ''
      form.codigo_numerico = row.codigo_numerico ?? ''
      form.continente = row.continente ?? props.continenteId ?? DEFAULT_CONTINENTE_ID
      form.activo = row.activo
    } else if (props.level === 'departamento') {
      const row = props.record as Departamento
      form.departamento = row.departamento
      form.codigodane = row.codigodane
      form.codigo_iso = row.codigo_iso
      form.activo = row.activo
    } else if (props.level === 'ciudad') {
      const row = props.record as Ciudad
      form.ciudad = row.ciudad
      form.codigodane = row.codigodane
      form.lat = row.lat != null ? String(row.lat) : ''
      form.lng = row.lng != null ? String(row.lng) : ''
      form.activo = row.activo
    } else if (props.level === 'barrio') {
      const row = props.record as Barrio
      form.barrio = row.barrio
      form.lat = row.lat != null ? String(row.lat) : ''
      form.lng = row.lng != null ? String(row.lng) : ''
      form.activo = row.activo
    }
  }
}

function close(): void {
  open.value = false
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

async function submit(): Promise<void> {
  saving.value = true
  error.value = null

  try {
    if (props.level === 'pais') {
      if (form.continente === null || form.continente <= 0) {
        throw new Error('Debe seleccionar el continente.')
      }
      const payload: CreatePaisPayload = {
        id: form.id,
        pais: form.pais.trim(),
        codigo_alfa2: form.codigo_alfa2.trim() || null,
        codigo_alfa3: form.codigo_alfa3.trim() || null,
        codigo_numerico: form.codigo_numerico.trim() || null,
        continente: form.continente,
        activo: form.activo,
      }
      if (props.mode === 'create') {
        await geoService.createPais(payload)
      } else {
        await geoService.updatePais(form.id, payload)
      }
    } else if (props.level === 'departamento') {
      if (!props.paisId) {
        throw new Error('Debe seleccionar un país.')
      }
      const payload: CreateDepartamentoPayload = {
        id: form.id,
        idpais: props.paisId,
        departamento: form.departamento.trim(),
        codigodane: form.codigodane.trim(),
        codigo_iso: form.codigo_iso.trim(),
        activo: form.activo,
      }
      if (props.mode === 'create') {
        await geoService.createDepartamento(payload)
      } else {
        await geoService.updateDepartamento(form.id, payload)
      }
    } else if (props.level === 'ciudad') {
      if (!props.departamentoId) {
        throw new Error('Debe seleccionar un departamento.')
      }
      const payload: CreateCiudadPayload = {
        id: form.id,
        iddepartamento: props.departamentoId,
        ciudad: form.ciudad.trim(),
        codigodane: form.codigodane.trim(),
        lat: parseOptionalNumber(form.lat),
        lng: parseOptionalNumber(form.lng),
        activo: form.activo,
      }
      if (props.mode === 'create') {
        await geoService.createCiudad(payload)
      } else {
        await geoService.updateCiudad(form.id, payload)
      }
    } else if (props.level === 'barrio') {
      if (!props.ciudadId) {
        throw new Error('Debe seleccionar una ciudad.')
      }
      const payload: CreateBarrioPayload = {
        id: form.id,
        idciudad: props.ciudadId,
        barrio: form.barrio.trim(),
        lat: parseOptionalNumber(form.lat),
        lng: parseOptionalNumber(form.lng),
        activo: form.activo,
      }
      if (props.mode === 'create') {
        await geoService.createBarrio(payload)
      } else {
        await geoService.updateBarrio(form.id, payload)
      }
    }

    emit('saved')
    close()
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
      if (data?.errors) {
        error.value = Object.values(data.errors).flat().join(' ')
      } else {
        error.value = data?.message ?? 'No se pudo guardar el registro.'
      }
      return
    }
    if (err instanceof Error) {
      error.value = err.message
      return
    }
    error.value = 'Error de conexión con el servidor.'
  } finally {
    saving.value = false
  }
}

watch(
  () => [open.value, props.level, props.mode, props.record?.id, props.suggestedId] as const,
  ([isOpen]) => {
    if (isOpen) {
      resetForm()
      error.value = null
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
          <button type="button" class="modal-close" aria-label="Cerrar" @click="close">×</button>
        </header>

        <form class="modal-body" @submit.prevent="submit">
          <p v-if="error" class="alert-error">{{ error }}</p>

          <div v-if="mode === 'create'" class="field">
            <label class="label" for="geo-id">ID</label>
            <input id="geo-id" v-model.number="form.id" type="number" class="input-field" required />
            <p class="hint">Identificador numérico único en la tabla.</p>
          </div>

          <template v-if="level === 'pais'">
            <div class="field">
              <label class="label" for="geo-pais">Nombre</label>
              <input id="geo-pais" v-model="form.pais" type="text" class="input-field" required maxlength="200" />
            </div>
            <div class="grid-2">
              <div class="field">
                <label class="label" for="geo-alfa2">Código Alfa-2</label>
                <input id="geo-alfa2" v-model="form.codigo_alfa2" type="text" class="input-field" maxlength="10" />
              </div>
              <div class="field">
                <label class="label" for="geo-alfa3">Código Alfa-3</label>
                <input id="geo-alfa3" v-model="form.codigo_alfa3" type="text" class="input-field" maxlength="10" />
              </div>
            </div>
            <div class="grid-2">
              <div class="field">
                <label class="label" for="geo-numerico">Código numérico</label>
                <input id="geo-numerico" v-model="form.codigo_numerico" type="text" class="input-field" maxlength="10" />
              </div>
              <div class="field">
                <label class="label" for="geo-continente">Continente</label>
                <select
                  id="geo-continente"
                  v-model.number="form.continente"
                  class="input-field"
                  required
                >
                  <option disabled :value="null">Seleccione…</option>
                  <option v-for="item in continenteOptions" :key="item.id" :value="item.id">
                    {{ item.description }}
                  </option>
                </select>
              </div>
            </div>
          </template>

          <template v-else-if="level === 'departamento'">
            <div class="field">
              <label class="label" for="geo-departamento">Nombre</label>
              <input id="geo-departamento" v-model="form.departamento" type="text" class="input-field" required maxlength="200" />
            </div>
            <div class="grid-2">
              <div class="field">
                <label class="label" for="geo-dane-dep">Código DANE</label>
                <input id="geo-dane-dep" v-model="form.codigodane" type="text" class="input-field" required maxlength="50" />
              </div>
              <div class="field">
                <label class="label" for="geo-iso-dep">Código ISO</label>
                <input id="geo-iso-dep" v-model="form.codigo_iso" type="text" class="input-field" required maxlength="10" />
              </div>
            </div>
          </template>

          <template v-else-if="level === 'ciudad'">
            <div class="field">
              <label class="label" for="geo-ciudad">Nombre</label>
              <input id="geo-ciudad" v-model="form.ciudad" type="text" class="input-field" required maxlength="200" />
            </div>
            <div class="field">
              <label class="label" for="geo-dane-ciudad">Código DANE</label>
              <input id="geo-dane-ciudad" v-model="form.codigodane" type="text" class="input-field" required maxlength="50" />
            </div>
            <div class="grid-2">
              <div class="field">
                <label class="label" for="geo-lat-ciudad">Latitud</label>
                <input id="geo-lat-ciudad" v-model="form.lat" type="text" class="input-field" />
              </div>
              <div class="field">
                <label class="label" for="geo-lng-ciudad">Longitud</label>
                <input id="geo-lng-ciudad" v-model="form.lng" type="text" class="input-field" />
              </div>
            </div>
          </template>

          <template v-else-if="level === 'barrio'">
            <div class="field">
              <label class="label" for="geo-barrio">Nombre</label>
              <input id="geo-barrio" v-model="form.barrio" type="text" class="input-field" required maxlength="200" />
            </div>
            <div class="grid-2">
              <div class="field">
                <label class="label" for="geo-lat-barrio">Latitud</label>
                <input id="geo-lat-barrio" v-model="form.lat" type="text" class="input-field" />
              </div>
              <div class="field">
                <label class="label" for="geo-lng-barrio">Longitud</label>
                <input id="geo-lng-barrio" v-model="form.lng" type="text" class="input-field" />
              </div>
            </div>
          </template>

          <label class="checkbox-label">
            <input v-model="form.activo" type="checkbox" />
            Activo
          </label>

          <footer class="modal-footer">
            <button type="button" class="btn-secondary" @click="close">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  padding: 1rem;
}

.modal-panel {
  width: 100%;
  max-width: 32rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  color: #64748b;
}

.modal-body {
  padding: 1rem 1.25rem 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.field {
  margin-bottom: 0.875rem;
}

.grid-2 {
  display: grid;
  gap: 0.875rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .grid-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

.hint {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #64748b;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #334155;
}

.alert-error {
  margin-bottom: 0.875rem;
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
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
</style>
