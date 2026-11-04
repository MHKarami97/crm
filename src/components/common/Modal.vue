<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title?: string
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  }>(),
  {
    maxWidth: 'md',
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
        @click.self="emit('close')"
      >
        <div
          :class="[
            'w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden my-8 transform transition-all',
            maxWidth === 'sm' && 'max-w-sm',
            maxWidth === 'md' && 'max-w-md',
            maxWidth === 'lg' && 'max-w-lg',
            maxWidth === 'xl' && 'max-w-xl',
            maxWidth === '2xl' && 'max-w-2xl',
          ]"
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header"
            class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80"
          >
            <slot name="header">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                {{ title }}
              </h3>
            </slot>
            <button
              type="button"
              @click="emit('close')"
              class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 max-h-[80vh] overflow-y-auto">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer"
            class="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2"
          >
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
