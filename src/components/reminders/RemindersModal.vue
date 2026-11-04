<script setup lang="ts">
import { usePersonStore } from '@/stores/usePersonStore'
import Modal from '@/components/common/Modal.vue'
import { Cake, Phone, Calendar } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select-person', id: string): void
}>()

const personStore = usePersonStore()
</script>

<template>
  <Modal :is-open="isOpen" title="مناسبت‌ها و تولدهای پیش‌رو (۳۰ روز آینده)" @close="emit('close')">
    <div class="space-y-3 py-2">
      <div v-if="personStore.upcomingCelebrations.length > 0" class="space-y-2">
        <div
          v-for="item in personStore.upcomingCelebrations"
          :key="item.person.id"
          @click="emit('select-person', item.person.id); emit('close')"
          class="flex items-center justify-between p-3.5 bg-accent-50/60 dark:bg-accent-950/30 border border-accent-200 dark:border-accent-800 rounded-2xl cursor-pointer hover:border-accent-400 transition-all"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 flex items-center justify-center shrink-0 shadow-xs"
            >
              <Cake class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">
                {{ item.person.name }}
              </h4>
              <span class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar class="w-3 h-3" />
                <span>{{ item.dateStr }}</span>
              </span>
            </div>
          </div>

          <div class="text-left shrink-0">
            <span
              :class="[
                'px-2.5 py-1 text-xs font-bold rounded-lg',
                item.daysLeft === 0
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-accent-100 dark:bg-accent-900/60 text-accent-800 dark:text-accent-200',
              ]"
            >
              {{ item.description }}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-xs text-slate-400">
        در ۳۰ روز آینده هیچ مناسبت یا تولدی در پایگاه داده ثبت نشده است.
      </div>
    </div>
  </Modal>
</template>
