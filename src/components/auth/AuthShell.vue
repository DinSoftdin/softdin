<script setup lang="ts">
import AuthBrandHeader from '@/components/auth/AuthBrandHeader.vue'

defineProps<{
  title: string
  subtitle?: string
  wide?: boolean
  extraWide?: boolean
  tenantName?: string
  tenantSlug?: string
  tenantHasLogo?: boolean
  tenantPreviewLogoUrl?: string | null
}>()
</script>

<template>
  <div class="auth-bg flex min-h-full items-center justify-center px-4 py-10">
    <div
      class="w-full rounded-2xl bg-white p-8 shadow-xl"
      :class="extraWide ? 'max-w-2xl' : wide ? 'max-w-lg' : 'max-w-md'"
    >
      <div class="mb-8 flex flex-col items-center text-center">
        <AuthBrandHeader
          class="mb-3"
          :tenant-name="tenantName"
          :tenant-slug="tenantSlug"
          :tenant-has-logo="tenantHasLogo"
          :preview-logo-url="tenantPreviewLogoUrl"
        />
        <h1 class="text-xl font-bold text-slate-900">{{ title }}</h1>
        <p v-if="subtitle" class="mt-2 text-sm text-slate-500">{{ subtitle }}</p>
      </div>

      <slot />

      <div v-if="$slots.footer" class="mt-6 border-t border-slate-100 pt-4 text-center text-sm">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-bg {
  background: linear-gradient(
    135deg,
    var(--color-brand-800) 0%,
    var(--color-brand-700) 45%,
    #052e16 100%
  );
}
</style>
