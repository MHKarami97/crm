<script lang="ts">
import { ref } from 'vue'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

const toasts = ref<ToastItem[]>([])

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3500) {
  const id = Math.random().toString(36).substring(2, 9)
  toasts.value.push({ id, message, type, duration })

  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, duration)
}
</script>

<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info } from 'lucide-vue-next'
</script>

<template>
  <div
    class="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md',
          toast.type === 'success' &&
            'bg-emerald-900/90 text-emerald-100 border-emerald-700/60 shadow-emerald-950/20',
          toast.type === 'error' &&
            'bg-rose-900/90 text-rose-100 border-rose-700/60 shadow-rose-950/20',
          toast.type === 'info' &&
            'bg-slate-900/90 text-slate-100 border-slate-700/60 shadow-slate-950/20',
        ]"
      >
        <CheckCircle2 v-if="toast.type === 'success'" class="w-4 h-4 text-emerald-400 shrink-0" />
        <AlertCircle v-else-if="toast.type === 'error'" class="w-4 h-4 text-rose-400 shrink-0" />
        <Info v-else class="w-4 h-4 text-sky-400 shrink-0" />
        <span>{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>
