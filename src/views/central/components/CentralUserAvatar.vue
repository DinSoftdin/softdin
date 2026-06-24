<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { centralUserService } from '@/services/central-user.service'

const props = defineProps<{
  userId: number
  name: string
  hasAvatar?: boolean
}>()

const imageUrl = ref<string | null>(null)

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?'
})

function cleanup(): void {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = null
  }
}

async function loadAvatar(): Promise<void> {
  cleanup()

  if (!props.hasAvatar) {
    return
  }

  try {
    const blob = await centralUserService.fetchAvatar(props.userId)
    imageUrl.value = URL.createObjectURL(blob)
  } catch {
    imageUrl.value = null
  }
}

watch(
  () => [props.userId, props.hasAvatar] as const,
  () => {
    void loadAvatar()
  },
)

onMounted(() => {
  void loadAvatar()
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<template>
  <span class="user-avatar">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="name"
      class="h-full w-full object-cover"
    />
    <span v-else>{{ initials }}</span>
  </span>
</template>

<style scoped>
.user-avatar {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background: #e2e8f0;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
}
</style>
