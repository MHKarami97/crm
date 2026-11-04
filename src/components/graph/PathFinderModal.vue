<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePersonStore } from '@/stores/usePersonStore'
import { useGraphStore } from '@/stores/useGraphStore'
import Modal from '@/components/common/Modal.vue'
import { Route, ArrowDown, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import { toPersianDigits } from '@/utils/format'

const props = defineProps<{
  isOpen: boolean
  initialStartId?: string
  initialTargetId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'highlight-path', nodeIds: string[]): void
}>()

const personStore = usePersonStore()
const graphStore = useGraphStore()

const startId = ref('')
const targetId = ref('')

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.initialStartId) startId.value = props.initialStartId
      if (props.initialTargetId) targetId.value = props.initialTargetId
      if (startId.value && targetId.value && startId.value !== targetId.value) {
        handleCalculate()
      }
    }
  }
)

function handleCalculate() {
  if (!startId.value || !targetId.value) return
  graphStore.pathStartId = startId.value
  graphStore.pathTargetId = targetId.value
  graphStore.computeShortestPath()

  if (graphStore.pathResult && graphStore.pathResult.found) {
    const nodeIds = graphStore.pathResult.path.map((p) => p.personId)
    emit('highlight-path', nodeIds)
  }
}

function handleReset() {
  graphStore.clearPath()
  startId.value = ''
  targetId.value = ''
}
</script>

<template>
  <Modal :is-open="isOpen" title="کوتاه‌ترین مسیر معرفی بین دو شخص" @close="emit('close')">
    <div class="space-y-4 py-2">
      <!-- Select Person A and B -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700">
        <div class="space-y-1">
          <label class="text-[11px] font-bold text-slate-500">شخص مبدأ</label>
          <select
            v-model="startId"
            class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- انتخاب شخص مبدأ --</option>
            <option v-for="p in personStore.people" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="text-[11px] font-bold text-slate-500">شخص مقصد (هدف)</label>
          <select
            v-model="targetId"
            class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- انتخاب شخص مقصد --</option>
            <option v-for="p in personStore.people" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="!startId || !targetId || startId === targetId"
          @click="handleCalculate"
          class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs"
        >
          <Route class="w-4 h-4" />
          <span>محاسبه و هایلایت مسیر</span>
        </button>

        <button
          type="button"
          @click="handleReset"
          class="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          پاک‌سازی
        </button>
      </div>

      <!-- Result Card -->
      <div v-if="graphStore.pathResult" class="pt-2">
        <!-- Found Path -->
        <div
          v-if="graphStore.pathResult.found"
          class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3"
        >
          <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
            <span>
              مسیر پیدا شد! (درجه جدایی: {{ toPersianDigits(graphStore.pathResult.degreesOfSeparation) }} پیوند)
            </span>
          </div>

          <!-- Steps Flow -->
          <div class="space-y-2 pt-1">
            <div
              v-for="(step, idx) in graphStore.pathResult.path"
              :key="step.personId"
              class="relative"
            >
              <div class="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-800 rounded-lg border border-emerald-100 dark:border-emerald-900/60 shadow-xs">
                <span
                  class="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center justify-center text-[10px] font-bold"
                >
                  {{ toPersianDigits(idx + 1) }}
                </span>
                <span class="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {{ step.personName }}
                </span>
                <span
                  v-if="step.relationship"
                  class="mr-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                >
                  {{ step.relationship.type }} (قدرت: {{ toPersianDigits(step.relationship.strength) }})
                </span>
              </div>

              <!-- Connecting arrow -->
              <div
                v-if="idx < graphStore.pathResult.path.length - 1"
                class="flex justify-center my-0.5"
              >
                <ArrowDown class="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        <!-- No Path Found -->
        <div
          v-else
          class="flex items-center gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs"
        >
          <AlertCircle class="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            هیچ مسیر مستقیمی یا با واسطه بین این دو شخص در دیتابیس فعلی یافت نشد.
          </span>
        </div>
      </div>
    </div>
  </Modal>
</template>
