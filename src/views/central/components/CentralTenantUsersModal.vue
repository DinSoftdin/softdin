<script setup lang="ts">
import CentralTenantUsersPanel from '@/views/central/components/CentralTenantUsersPanel.vue'
import type { CentralTenant } from '@/types/tenant'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  tenant: CentralTenant | null
}>()

function close(): void {
  open.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open && props.tenant" class="modal-backdrop" @click.self="close">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div>
            <p class="modal-kicker">Usuarios asociados</p>
            <h2 class="modal-title">{{ props.tenant.name }}</h2>
            <p class="modal-subtitle">{{ props.tenant.slug }}</p>
          </div>
          <button type="button" class="modal-close" aria-label="Cerrar" @click="close">×</button>
        </header>

        <div class="modal-body">
          <CentralTenantUsersPanel :tenant="props.tenant" :active="open" />
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
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  padding: 1rem;
}

.modal-panel {
  width: 100%;
  max-width: 46rem;
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

.modal-subtitle {
  font-size: 0.875rem;
  color: #64748b;
}

.modal-close {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  color: #64748b;
}

.modal-body {
  padding: 1rem 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid #e2e8f0;
  padding: 0.875rem 1.25rem;
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
