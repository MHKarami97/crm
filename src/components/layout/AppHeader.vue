<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { usePwaStore } from '@/stores/usePwaStore'
import { usePersonStore } from '@/stores/usePersonStore'
import {
  Lock,
  Sun,
  Moon,
  WifiOff,
  Cake,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'open-reminders'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const pwaStore = usePwaStore()
const personStore = usePersonStore()

const celebrationsCount = computed(() => personStore.upcomingCelebrations.length)

function toggleTheme() {
  const current = settingsStore.theme
  if (current === 'light') {
    settingsStore.setTheme('dark')
  } else {
    settingsStore.setTheme('light')
  }
}

function handleLock() {
  authStore.lock()
}
</script>

<template>
  <header
    class="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 pt-safe"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <!-- Brand Logo & Title -->
      <div class="flex items-center gap-2.5">
        <img
          src="/icons/icon-48.png"
          alt="CRM Logo"
          class="w-8 h-8 rounded-xl object-contain shadow-sm border border-slate-200 dark:border-slate-700"
        />
        <div>
          <h1 class="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
            مدیریت ارتباطات
          </h1>
          <span class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Personal CRM & Graph
          </span>
        </div>
      </div>

      <!-- Action items -->
      <div class="flex items-center gap-1.5 sm:gap-2">
        <!-- Offline Badge -->
        <span
          v-if="!pwaStore.isOnline"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
        >
          <WifiOff class="w-3 h-3" />
          <span>آفلاین</span>
        </span>

        <!-- Celebration Reminder Button -->
        <button
          v-if="celebrationsCount > 0"
          type="button"
          @click="emit('open-reminders')"
          class="relative p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/50 rounded-xl transition-colors"
          title="مناسبت‌های پیش‌رو"
        >
          <Cake class="w-5 h-5" />
          <span
            class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 text-[10px] font-bold text-white shadow-xs"
          >
            {{ celebrationsCount }}
          </span>
        </button>

        <!-- Theme Toggle -->
        <button
          type="button"
          @click="toggleTheme"
          class="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="تغییر پوسته"
        >
          <Moon v-if="settingsStore.theme === 'light'" class="w-5 h-5" />
          <Sun v-else class="w-5 h-5" />
        </button>

        <!-- Lock Button -->
        <button
          v-if="authStore.securityEnabled"
          type="button"
          @click="handleLock"
          class="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          title="قفل کردن برنامه"
        >
          <Lock class="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
</template>
