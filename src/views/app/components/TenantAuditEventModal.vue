<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import axios from 'axios'
import { tenantAuditService } from '@/services/tenant-audit.service'
import type { TenantAuditEventDetailResponse } from '@/types/tenant-audit'
import {
  tenantAuditCategoryLabel,
  tenantAuditDisplayValue,
  tenantAuditFieldPathLabel,
  tenantAuditResultLabel,
} from '@/utils/tenant-audit-labels'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  eventId: string | null
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const detail = ref<TenantAuditEventDetailResponse | null>(null)
const showTechnical = ref(false)

const summaryText = computed(() => {
  if (!detail.value) {
    return ''
  }

  const event = detail.value.event
  const actor = event.actor_label ?? 'Sistema'
  const entity = event.entity_label ?? 'registro'
  const action = event.category_label ?? tenantAuditCategoryLabel(event.event_category)
  const changes = event.changes_summary

  if (changes && changes !== '—') {
    return `${actor} · ${action} · ${entity} · Cambios: ${changes}`
  }

  return `${actor} · ${action} · ${entity}`
})

function close(): void {
  open.value = false
}

function formatWhen(value?: string | null): string {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value))
}

function fieldLabel(change: { field_label?: string; field_path: string }): string {
  return change.field_label ?? tenantAuditFieldPathLabel(change.field_path)
}

function valueLabel(
  change: {
    old_value_label?: string
    old_value: string | null
    new_value_label?: string
    new_value: string | null
  },
  key: 'old' | 'new',
): string {
  if (key === 'old') {
    return change.old_value_label ?? tenantAuditDisplayValue(change.old_value)
  }

  return change.new_value_label ?? tenantAuditDisplayValue(change.new_value)
}

function formatJson(value: Record<string, unknown> | null): string {
  if (!value) {
    return '—'
  }

  return JSON.stringify(value, null, 2)
}

async function loadDetail(): Promise<void> {
  if (!props.eventId) {
    return
  }

  loading.value = true
  error.value = null
  detail.value = null

  try {
    detail.value = await tenantAuditService.fetchEvent(props.eventId)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const responseData = err.response?.data as { message?: string } | undefined
      error.value = responseData?.message ?? 'No se pudo cargar el detalle del evento.'
      return
    }

    error.value = 'Error de conexión con el servidor.'
  } finally {
    loading.value = false
  }
}

watch(
  () => [open.value, props.eventId] as const,
  ([isOpen, eventId]) => {
    if (isOpen && eventId) {
      void loadDetail()
    } else if (!isOpen) {
      detail.value = null
      error.value = null
      showTechnical.value = false
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="audit-modal-title">
        <header class="modal-header">
          <div>
            <p class="modal-kicker">Auditoría del cliente</p>
            <h2 id="audit-modal-title" class="modal-title">Detalle del evento</h2>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar" @click="close">×</button>
        </header>

        <div class="modal-body">
          <p v-if="loading" class="state-message">Cargando detalle…</p>
          <p v-else-if="error" class="alert-error">{{ error }}</p>

          <template v-else-if="detail">
            <p class="summary-box">{{ summaryText }}</p>

            <dl class="meta-grid">
              <div>
                <dt>Acción</dt>
                <dd>{{ detail.event.category_label ?? tenantAuditCategoryLabel(detail.event.event_category) }}</dd>
              </div>
              <div>
                <dt>Resultado</dt>
                <dd>{{ tenantAuditResultLabel(detail.event.result) }}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{{ formatWhen(detail.event.occurred_at) }}</dd>
              </div>
              <div>
                <dt>Actor</dt>
                <dd>{{ detail.event.actor_label ?? '—' }}</dd>
              </div>
              <div>
                <dt>Entidad</dt>
                <dd>{{ detail.event.entity_label ?? '—' }}</dd>
              </div>
              <div>
                <dt>HTTP / duración</dt>
                <dd>
                  {{ detail.event.http_status ?? '—' }}
                  <span v-if="detail.event.duration_ms !== null"> · {{ detail.event.duration_ms }} ms</span>
                </dd>
              </div>
            </dl>

            <p v-if="detail.event.error_summary" class="alert-error">
              {{ detail.event.error_summary }}
            </p>

            <section v-if="detail.field_changes.length > 0" class="section-block">
              <h3 class="section-title">Cambios registrados</h3>
              <div class="table-wrap">
                <table class="changes-table">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Valor anterior</th>
                      <th>Valor nuevo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="change in detail.field_changes" :key="change.id">
                      <td>{{ fieldLabel(change) }}</td>
                      <td>{{ valueLabel(change, 'old') }}</td>
                      <td>{{ valueLabel(change, 'new') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section class="section-block">
              <button type="button" class="toggle-technical" @click="showTechnical = !showTechnical">
                {{ showTechnical ? 'Ocultar datos técnicos' : 'Ver datos técnicos' }}
              </button>

              <div v-if="showTechnical" class="technical-block">
                <p class="technical-path mono">
                  {{ detail.event.http_method ?? '—' }}
                  {{ detail.event.request_path ?? '—' }}
                </p>

                <div class="states-grid">
                  <section class="section-block">
                    <h3 class="section-title">Estado anterior (JSON)</h3>
                    <pre class="json-block">{{ formatJson(detail.event.before_state) }}</pre>
                  </section>
                  <section class="section-block">
                    <h3 class="section-title">Estado posterior (JSON)</h3>
                    <pre class="json-block">{{ formatJson(detail.event.after_state) }}</pre>
                  </section>
                </div>
              </div>
            </section>
          </template>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn-secondary" @click="close">Cerrar</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  padding: 1rem;
}

.modal-panel {
  width: 100%;
  max-width: 56rem;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
}

.modal-kicker {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-brand-700);
}

.modal-title {
  margin-top: 0.25rem;
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e2e8f0;
  padding: 0.875rem 1.25rem;
}

.state-message {
  font-size: 0.875rem;
  color: #64748b;
}

.summary-box {
  border-radius: 0.75rem;
  background: #f8fafc;
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #0f172a;
}

.toggle-technical {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-brand-700);
  cursor: pointer;
}

.technical-block {
  margin-top: 0.75rem;
}

.technical-path {
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
  color: #64748b;
  word-break: break-all;
}

.meta-grid {
  display: grid;
  gap: 0.875rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.meta-grid dt {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.meta-grid dd {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #0f172a;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  word-break: break-all;
}

.section-block {
  margin-top: 1.25rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.table-wrap {
  margin-top: 0.625rem;
  overflow-x: auto;
}

.changes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.changes-table th,
.changes-table td {
  border-bottom: 1px solid #e2e8f0;
  padding: 0.625rem 0.5rem;
  text-align: left;
  vertical-align: top;
}

.changes-table th {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.states-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 900px) {
  .states-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.json-block {
  margin-top: 0.625rem;
  max-height: 14rem;
  overflow: auto;
  border-radius: 0.75rem;
  background: #0f172a;
  padding: 0.875rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
}

.alert-error {
  margin-top: 1rem;
  border-radius: 0.5rem;
  background: #fef2f2;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #b91c1c;
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
