<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title?: string
    fullHeightOnMobile?: boolean
  }>(),
  {
    fullHeightOnMobile: false,
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const sheetRef = ref<HTMLElement | null>(null)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
        @click.self="emit('close')"
      >
        <div
          ref="sheetRef"
          :class="[
            'w-full sm:max-w-xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92dvh] transform transition-transform duration-300',
            fullHeightOnMobile ? 'h-[92dvh]' : '',
          ]"
        >
          <!-- Pull Handle (Mobile) -->
          <div class="sm:hidden pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
            <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
          </div>

          <!-- Header -->
          <div
            class="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800"
          >
            <slot name="header">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                {{ title }}
              </h3>
            </slot>
            <button
              type="button"
              @click="emit('close')"
              class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 px-5 py-4 overflow-y-auto pb-safe">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer"
            class="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 pb-safe"
          >
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
