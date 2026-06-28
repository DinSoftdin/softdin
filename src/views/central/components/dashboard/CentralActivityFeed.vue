<script setup lang="ts">
import type { CentralDashboardActivityItem } from '@/types/central-dashboard'

defineProps<{
  items: CentralDashboardActivityItem[]
}>()

const emit = defineEmits<{
  select: [eventId: string]
}>()

function formatWhen(value: string): string {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function resultClass(result: string): string {
  if (result === 'success') {
    return 'result-success'
  }

  if (result === 'failure') {
    return 'result-failure'
  }

  return 'result-pending'
}

function resultLabel(result: string): string {
  if (result === 'success') {
    return 'Éxito'
  }

  if (result === 'failure') {
    return 'Fallo'
  }

  return 'Pendiente'
}
</script>

<template>
  <article class="feed-card">
    <header class="feed-header">
      <h3 class="feed-title">Actividad reciente</h3>
      <p class="feed-subtitle">Últimos eventos registrados en auditoría central. Doble clic en un evento para ver el detalle.</p>
    </header>

    <ul v-if="items.length > 0" class="feed-list">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="feed-item"
          title="Doble clic para ver el detalle"
          @dblclick="emit('select', item.id)"
          @keydown.enter="emit('select', item.id)"
        >
          <div class="feed-item-main">
            <p class="feed-category">{{ item.category_label }}</p>
            <p class="feed-meta">
              <span v-if="item.actor_label">{{ item.actor_label }}</span>
              <span v-if="item.actor_label && item.request_path"> · </span>
              <span v-if="item.request_path" class="feed-path">{{ item.http_method }} {{ item.request_path }}</span>
            </p>
          </div>
          <div class="feed-item-side">
            <span class="result-badge" :class="resultClass(item.result)">{{ resultLabel(item.result) }}</span>
            <time class="feed-time" :datetime="item.occurred_at">{{ formatWhen(item.occurred_at) }}</time>
          </div>
        </button>
      </li>
    </ul>

    <p v-else class="feed-empty">
      Aún no hay eventos de auditoría. Las acciones en clientes y usuarios aparecerán aquí.
    </p>
  </article>
</template>

<style scoped>
.feed-card {
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.feed-header {
  margin-bottom: 1rem;
}

.feed-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.feed-subtitle {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.feed-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.feed-item {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.875rem 0;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.feed-item:hover {
  background: #f8fafc;
}

.feed-list li:last-child .feed-item {
  border-bottom: none;
  padding-bottom: 0;
}

@media (min-width: 640px) {
  .feed-item {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    padding-inline: 0.5rem;
  }
}

.feed-category {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.feed-meta {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.feed-path {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
}

.feed-item-side {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.375rem;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .feed-item-side {
    align-items: flex-end;
    text-align: right;
  }
}

.result-badge {
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.result-success {
  background: #dcfce7;
  color: #166534;
}

.result-failure {
  background: #fee2e2;
  color: #991b1b;
}

.result-pending {
  background: #fef3c7;
  color: #92400e;
}

.feed-time {
  font-size: 0.75rem;
  color: #94a3b8;
}

.feed-empty {
  border-radius: 0.75rem;
  background: #f8fafc;
  padding: 1rem;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
}
</style>
