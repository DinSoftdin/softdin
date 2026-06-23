<script setup lang="ts">
import { computed } from 'vue'
import softdinLogo from '@/assets/softdin-logo.png'
import { tenantLogoPublicUrl } from '@/services/tenant.service'

const props = defineProps<{
  tenantName?: string
  tenantSlug?: string
  tenantHasLogo?: boolean
  previewLogoUrl?: string | null
}>()

const showTenantBrand = computed(
  () => Boolean(props.tenantName?.trim() && props.tenantSlug?.trim()),
)

const logoSrc = computed(() => {
  if (props.previewLogoUrl) {
    return props.previewLogoUrl
  }

  if (props.tenantHasLogo && props.tenantSlug) {
    return tenantLogoPublicUrl(props.tenantSlug)
  }

  return null
})

const initials = computed(() => {
  const name = props.tenantName?.trim() ?? ''
  if (!name) {
    return '?'
  }

  const parts = name.split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
})
</script>

<template>
  <div v-if="showTenantBrand" class="brand-row">
    <span class="brand-logo-wrap">
      <img
        v-if="logoSrc"
        :src="logoSrc"
        :alt="tenantName"
        class="brand-logo"
      />
      <span v-else class="brand-logo-fallback">{{ initials }}</span>
    </span>
    <div class="brand-text">
      <span class="brand-title">{{ tenantName }}</span>
      <span class="brand-subtitle">{{ tenantSlug }}</span>
    </div>
  </div>

  <div v-else class="brand-row">
    <img :src="softdinLogo" alt="SoftDIN" class="brand-logo" />
    <div class="brand-text">
      <span class="brand-title">SoftDIN</span>
      <span class="brand-subtitle">CENTRAL</span>
    </div>
  </div>
</template>

<style scoped>
.brand-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.brand-title {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-brand-800);
}

.brand-subtitle {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--color-brand-600);
  text-transform: lowercase;
}

.brand-logo-wrap {
  display: flex;
  height: 5.5rem;
  width: 5.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  border: 3px solid var(--color-brand-100);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
  background: #f8fafc;
}

.brand-logo {
  height: 100%;
  width: 100%;
  object-fit: contain;
}

.brand-logo-fallback {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-brand-700);
}

.brand-row > .brand-logo {
  width: 5.5rem;
  height: 5.5rem;
  border-radius: 9999px;
  object-fit: cover;
  object-position: center 18%;
  border: 3px solid var(--color-brand-100);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
}
</style>
