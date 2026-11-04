<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Route,
  Search,
  LayoutGrid,
} from 'lucide-vue-next'

const props = defineProps<{
  activeLayout: string
}>()

const emit = defineEmits<{
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'fit'): void
  (e: 'change-layout', layout: 'cose' | 'concentric' | 'circle'): void
  (e: 'open-path-finder'): void
  (e: 'search', query: string): void
}>()

const searchInput = ref('')
const showLayoutMenu = ref(false)

watch(searchInput, (q) => {
  emit('search', q)
})
</script>

<template>
  <div class="space-y-2 pointer-events-none">
    <!-- Floating Search Bar -->
    <div class="pointer-events-auto flex items-center gap-2 max-w-sm w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-slate-200/90 dark:border-slate-800">
      <Search class="w-4 h-4 text-slate-400 shrink-0" />
      <input
        v-model="searchInput"
        type="text"
        class="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        placeholder="جستجو و هایلایت در گراف..."
      />
      <button
        v-if="searchInput"
        type="button"
        @click="searchInput = ''"
        class="text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
      >
        ×
      </button>
    </div>

    <!-- Floating Action Toolbar -->
    <div class="pointer-events-auto inline-flex items-center gap-1 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 dark:border-slate-800">
      <button
        type="button"
        @click="emit('zoom-in')"
        class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        title="بزرگنمایی"
      >
        <ZoomIn class="w-4 h-4" />
      </button>

      <button
        type="button"
        @click="emit('zoom-out')"
        class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        title="کوچک‌نمایی"
      >
        <ZoomOut class="w-4 h-4" />
      </button>

      <button
        type="button"
        @click="emit('fit')"
        class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        title="تطبیق کادر"
      >
        <Maximize2 class="w-4 h-4" />
      </button>

      <div class="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Layout Switcher -->
      <div class="relative">
        <button
          type="button"
          @click="showLayoutMenu = !showLayoutMenu"
          class="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="تغییر چیدمان"
        >
          <LayoutGrid class="w-4 h-4 text-primary-600" />
          <span class="hidden sm:inline">چیدمان</span>
        </button>

        <div
          v-if="showLayoutMenu"
          class="absolute bottom-full mb-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 min-w-[130px] flex flex-col gap-1 z-50 text-xs"
        >
          <button
            type="button"
            @click="emit('change-layout', 'cose'); showLayoutMenu = false"
            :class="[
              'px-2.5 py-1.5 text-right rounded-lg transition-colors',
              activeLayout === 'cose'
                ? 'bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
            ]"
          >
            نیروگاهی (CoSE)
          </button>
          <button
            type="button"
            @click="emit('change-layout', 'concentric'); showLayoutMenu = false"
            :class="[
              'px-2.5 py-1.5 text-right rounded-lg transition-colors',
              activeLayout === 'concentric'
                ? 'bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
            ]"
          >
            هم‌مرکز (شعاعی)
          </button>
          <button
            type="button"
            @click="emit('change-layout', 'circle'); showLayoutMenu = false"
            :class="[
              'px-2.5 py-1.5 text-right rounded-lg transition-colors',
              activeLayout === 'circle'
                ? 'bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
            ]"
          >
            دایره‌ای (حلقه‌ای)
          </button>
        </div>
      </div>

      <div class="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Shortest Path Finder -->
      <button
        type="button"
        @click="emit('open-path-finder')"
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 rounded-xl shadow-xs transition-transform active:scale-95"
      >
        <Route class="w-4 h-4" />
        <span>مسیر معرفی</span>
      </button>
    </div>
  </div>
</template>
