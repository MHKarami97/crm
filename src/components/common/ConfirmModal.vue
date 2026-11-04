<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import Modal from './Modal.vue'

defineProps<{
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Modal :is-open="isOpen" :title="title" max-width="sm" @close="emit('cancel')">
    <div class="flex items-start gap-3 py-2">
      <div
        :class="[
          'p-2.5 rounded-xl shrink-0',
          isDanger
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
        ]"
      >
        <AlertTriangle class="w-6 h-6" />
      </div>
      <div>
        <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {{ message }}
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="emit('cancel')"
        class="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      >
        {{ cancelText || 'انصراف' }}
      </button>
      <button
        type="button"
        @click="emit('confirm')"
        :class="[
          'px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-sm transition-all active:scale-95',
          isDanger
            ? 'bg-rose-600 hover:bg-rose-700'
            : 'bg-primary-700 hover:bg-primary-600 dark:bg-primary-600',
        ]"
      >
        {{ confirmText || 'تأیید' }}
      </button>
    </template>
  </Modal>
</template>
