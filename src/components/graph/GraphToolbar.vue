<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Route,
  Search,
  LayoutGrid,
  Info,
  Filter,
  Check,
  Share2,
} from 'lucide-vue-next'
import { toPersianDigits } from '@/utils/format'

const props = defineProps<{
  activeLayout: string
  totalNodes?: number
  totalEdges?: number
}>()

const emit = defineEmits<{
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'fit'): void
  (e: 'change-layout', layout: 'cose' | 'concentric' | 'circle'): void
  (e: 'open-path-finder'): void
  (e: 'search', query: string): void
  (e: 'filter-tag', tag: string | null): void
}>()

const searchInput = ref('')
const showLayoutMenu = ref(false)
const showLegend = ref(false)
const selectedTag = ref<string>('all')

const quickTags = [
  { id: 'all', label: 'همه' },
  { id: 'دوست', label: 'دوستان', dot: 'bg-teal-500' },
  { id: 'کاری', label: 'کاری', dot: 'bg-blue-500' },
  { id: 'خانواده', label: 'خانواده', dot: 'bg-rose-500' },
  { id: 'مشتری', label: 'مشتریان', dot: 'bg-amber-500' },
]

watch(searchInput, (q) => {
  emit('search', q)
})

function handleTagSelect(tagId: string) {
  selectedTag.value = tagId
  emit('filter-tag', tagId === 'all' ? null : tagId)
}

const layouts = [
  { id: 'cose', title: 'ارگانیک / فیزیکی', desc: 'تجمع طبیعی بر اساس ارتباطات' },
  { id: 'concentric', title: 'متحدالمرکز (کانونی)', desc: 'افراد کلیدی و پرپیوند در مرکز' },
  { id: 'circle', title: 'دایره‌ای هندسی', desc: 'چیدمان یکدست دور دایره' },
]
</script>

<template>
  <div class="space-y-2 pointer-events-none">
    <!-- Top Row: Search Bar & Network Counter -->
    <div class="pointer-events-auto flex items-center justify-between gap-2 max-w-xl w-full">
      <!-- Floating Glass Search -->
      <div
        class="flex-1 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200/90 dark:border-slate-800 transition-all focus-within:ring-2 focus-within:ring-primary-500"
      >
        <Search class="w-4 h-4 text-slate-400 shrink-0" />
        <input
          v-model="searchInput"
          type="text"
          class="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
          placeholder="جستجوی نام یا تخصص در گراف..."
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

      <!-- Network Counter Pill (Desktop & Tablet) -->
      <div
        v-if="totalNodes !== undefined"
        class="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-lg text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono"
      >
        <Share2 class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
        <span>{{ toPersianDigits(totalNodes) }} گره · {{ toPersianDigits(totalEdges || 0) }} پیوند</span>
      </div>
    </div>

    <!-- Filter Tag Chips -->
    <div class="pointer-events-auto flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none max-w-xl">
      <button
        v-for="tag in quickTags"
        :key="tag.id"
        type="button"
        @click="handleTagSelect(tag.id)"
        :class="[
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition border whitespace-nowrap shadow-xs',
          selectedTag === tag.id
            ? 'bg-primary-600 text-white border-primary-600 shadow-primary-500/20'
            : 'bg-white/85 dark:bg-slate-900/85 backdrop-blur-md text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50',
        ]"
      >
        <span
          v-if="tag.dot"
          :class="['w-2 h-2 rounded-full', tag.dot]"
        ></span>
        <span>{{ tag.label }}</span>
      </button>
    </div>

    <!-- Floating Action Toolbar -->
    <div class="pointer-events-auto inline-flex items-center gap-1 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800">
      <!-- Zoom In -->
      <button
        type="button"
        @click="emit('zoom-in')"
        class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
        title="بزرگ‌نمایی"
      >
        <ZoomIn class="w-4 h-4" />
      </button>

      <!-- Zoom Out -->
      <button
        type="button"
        @click="emit('zoom-out')"
        class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
        title="کوچک‌نمایی"
      >
        <ZoomOut class="w-4 h-4" />
      </button>

      <!-- Fit Window -->
      <button
        type="button"
        @click="emit('fit')"
        class="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
        title="تنظیم خودکار کادر (Fit)"
      >
        <Maximize2 class="w-4 h-4" />
      </button>

      <div class="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Layout Menu -->
      <div class="relative">
        <button
          type="button"
          @click="showLayoutMenu = !showLayoutMenu"
          class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="تغییر نحوه چیدمان گراف"
        >
          <LayoutGrid class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span class="hidden sm:inline">چیدمان</span>
        </button>

        <div
          v-if="showLayoutMenu"
          class="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 min-w-[200px] flex flex-col gap-1 z-50 text-xs"
        >
          <div class="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            الگوریتم چیدمان
          </div>
          <button
            v-for="l in layouts"
            :key="l.id"
            type="button"
            @click="emit('change-layout', l.id as any); showLayoutMenu = false"
            :class="[
              'flex items-start gap-2 p-2 rounded-xl text-right transition-colors',
              activeLayout === l.id
                ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
            ]"
          >
            <Check v-if="activeLayout === l.id" class="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
            <div :class="activeLayout !== l.id ? 'pr-5' : ''">
              <span class="block text-xs font-bold">{{ l.title }}</span>
              <span class="block text-[10px] text-slate-400 font-normal mt-0.5">{{ l.desc }}</span>
            </div>
          </button>
        </div>
      </div>

      <div class="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Path Finder Action -->
      <button
        type="button"
        @click="emit('open-path-finder')"
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/60 rounded-xl transition-all"
        title="یافتن کوتاه‌ترین مسیر معرفی بین ۲ نفر"
      >
        <Route class="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <span>مسیر معرفی</span>
      </button>

      <!-- Legend Toggle -->
      <button
        type="button"
        @click="showLegend = !showLegend"
        :class="[
          'p-2 rounded-xl transition-all',
          showLegend
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
        ]"
        title="راهنمای رنگ‌ها و پیوندها"
      >
        <Info class="w-4 h-4" />
      </button>
    </div>

    <!-- Floating Legend Box -->
    <div
      v-if="showLegend"
      class="pointer-events-auto p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-xs space-y-2 text-xs"
    >
      <div class="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <span class="font-bold text-slate-800 dark:text-slate-200">راهنمای رنگ‌های شبکه</span>
        <button
          type="button"
          @click="showLegend = false"
          class="text-slate-400 hover:text-slate-600 text-sm font-bold"
        >
          ×
        </button>
      </div>
      <div class="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
          <span>دوست و رفیق</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>ارتباط کاری / همکار</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>خانواده و فامیل</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>مشتری کسب‌وکار</span>
        </div>
        <div class="flex items-center gap-1.5 col-span-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span class="w-5 h-0 border-t-2 border-dashed border-emerald-600"></span>
          <span>خط‌چین سبز: معرف مستقیم مشتری</span>
        </div>
      </div>
    </div>
  </div>
</template>
