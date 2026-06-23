<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTenantDocumentBranding } from '@/composables/useTenantDocumentBranding'

useTenantDocumentBranding()
</script>

<template>
  <RouterView />
</template>
