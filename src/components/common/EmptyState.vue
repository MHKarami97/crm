<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon?: Component
  title: string
  description?: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/40 my-6"
  >
    <div
      v-if="icon"
      class="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 flex items-center justify-center mb-3 shadow-inner"
    >
      <component :is="icon" class="w-7 h-7" :stroke-width="1.75" />
    </div>

    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
      {{ title }}
    </h3>

    <p
      v-if="description"
      class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4 leading-relaxed"
    >
      {{ description }}
    </p>

    <button
      v-if="actionLabel"
      type="button"
      @click="emit('action')"
      class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500 rounded-lg shadow-sm transition-all active:scale-95"
    >
      <slot name="action-icon"></slot>
      <span>{{ actionLabel }}</span>
    </button>
  </div>
</template>
