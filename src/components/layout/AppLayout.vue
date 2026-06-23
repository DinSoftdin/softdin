<script setup lang="ts">

import { computed, onMounted, ref, watch } from 'vue'

import { RouterView } from 'vue-router'

import AppHeader from '@/components/layout/AppHeader.vue'

import AppSidebar from '@/components/layout/AppSidebar.vue'



const STORAGE_KEY = 'softdin_sidebar_collapsed'



const sidebarOpen = ref(false)

const sidebarCollapsed = ref(false)



const mainOffsetClass = computed(() =>

  sidebarCollapsed.value ? 'lg:ml-[4.5rem]' : 'lg:ml-64',

)



function readCollapsedPreference(): boolean {

  try {

    return localStorage.getItem(STORAGE_KEY) === 'true'

  } catch {

    return false

  }

}



function persistCollapsedPreference(value: boolean): void {

  try {

    localStorage.setItem(STORAGE_KEY, String(value))

  } catch {

    // Ignorar si localStorage no está disponible.

  }

}



function isDesktopViewport(): boolean {

  return window.matchMedia('(min-width: 1024px)').matches

}



function toggleSidebar(): void {

  if (isDesktopViewport()) {

    sidebarCollapsed.value = !sidebarCollapsed.value

    return

  }



  sidebarOpen.value = !sidebarOpen.value

}



function closeMobileSidebar(): void {

  sidebarOpen.value = false

}



onMounted(() => {

  sidebarCollapsed.value = readCollapsedPreference()

})



watch(sidebarCollapsed, (value) => {

  persistCollapsedPreference(value)

})

</script>



<template>

  <div class="flex min-h-full bg-slate-50">

    <AppSidebar

      v-model:open="sidebarOpen"

      v-model:collapsed="sidebarCollapsed"

      @navigate="closeMobileSidebar"

    />



    <div

      class="flex min-h-full flex-1 flex-col transition-[margin] duration-200"

      :class="mainOffsetClass"

    >

      <AppHeader

        :sidebar-collapsed="sidebarCollapsed"

        @toggle-sidebar="toggleSidebar"

      />



      <main class="flex-1 p-4 md:p-6">

        <RouterView />

      </main>

    </div>



    <div

      v-if="sidebarOpen"

      class="fixed inset-0 z-30 bg-black/40 lg:hidden"

      @click="closeMobileSidebar"

    />

  </div>

</template>


