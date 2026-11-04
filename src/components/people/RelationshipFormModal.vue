<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { usePersonStore } from '@/stores/usePersonStore'
import { DEFAULT_RELATIONSHIP_TYPES } from '@/stores/useRelationshipStore'
import Modal from '@/components/common/Modal.vue'
import { Star, ArrowLeftRight } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  initialSourceId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', relData: any): void
}>()

const personStore = usePersonStore()

const sourcePersonId = ref('')
const targetPersonId = ref('')
const type = ref('دوست')
const strength = ref(3)
const notes = ref('')
const startDate = ref('')

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      sourcePersonId.value = props.initialSourceId || ''
      targetPersonId.value = ''
      type.value = 'دوست'
      strength.value = 3
      notes.value = ''
      startDate.value = ''
    }
  },
  { immediate: true }
)

const availableTargets = computed(() => {
  return personStore.people.filter((p) => p.id !== sourcePersonId.value)
})

function swapDirections() {
  const temp = sourcePersonId.value
  sourcePersonId.value = targetPersonId.value
  targetPersonId.value = temp
}

function handleSubmit() {
  if (!sourcePersonId.value || !targetPersonId.value) return

  emit('save', {
    sourcePersonId: sourcePersonId.value,
    targetPersonId: targetPersonId.value,
    type: type.value.trim(),
    strength: strength.value,
    startDate: startDate.value.trim(),
    notes: notes.value.trim(),
  })
}
</script>

<template>
  <Modal :is-open="isOpen" title="ثبت ارتباط بین دو شخص" @close="emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4 py-2">
      <!-- Person 1 & Person 2 Selector with Swap -->
      <div class="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700">
        <div class="space-y-1">
          <label class="text-[11px] font-bold text-slate-500">مبدأ ارتباط (شخص اول)</label>
          <select
            v-model="sourcePersonId"
            required
            class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- انتخاب شخص اول --</option>
            <option v-for="p in personStore.people" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>

        <div class="flex justify-center my-1">
          <button
            type="button"
            @click="swapDirections"
            class="p-1.5 text-slate-400 hover:text-primary-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="جابجایی طرفین"
          >
            <ArrowLeftRight class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-1">
          <label class="text-[11px] font-bold text-slate-500">مقصد ارتباط (شخص دوم)</label>
          <select
            v-model="targetPersonId"
            required
            class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- انتخاب شخص دوم --</option>
            <option v-for="p in availableTargets" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Relationship Type -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">نوع پیوند / نسبت</label>
        <input
          v-model="type"
          type="text"
          required
          class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="مثال: دوست، همکار، معرف..."
        />
        <div class="flex flex-wrap gap-1 pt-1">
          <button
            v-for="t in DEFAULT_RELATIONSHIP_TYPES"
            :key="t"
            type="button"
            @click="type = t"
            :class="[
              'px-2 py-0.5 text-[10px] rounded-md border transition-all',
              type === t
                ? 'bg-primary-50 dark:bg-primary-950 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
            ]"
          >
            {{ t }}
          </button>
        </div>
      </div>

      <!-- Strength -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-800 dark:text-slate-200">عمق و استحکام رابطه</label>
          <span class="text-xs text-accent-600 font-semibold">{{ strength }} از ۵</span>
        </div>
        <div class="flex items-center gap-1.5 pt-1">
          <button
            v-for="s in 5"
            :key="s"
            type="button"
            @click="strength = s"
            class="p-1 text-slate-300 hover:text-accent-500 transition-colors"
          >
            <Star
              :class="[
                'w-6 h-6 transition-transform active:scale-125',
                strength >= s ? 'fill-accent-500 text-accent-500' : 'text-slate-300 dark:text-slate-600',
              ]"
            />
          </button>
        </div>
      </div>

      <!-- Start Date -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">تاریخ شروع آشنایی / پیوند</label>
        <input
          v-model="startDate"
          type="text"
          dir="ltr"
          class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="۱۴۰۲/۰۶/۱۵"
        />
      </div>

      <!-- Notes -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">توضیحات و نحوه ارتباط</label>
        <textarea
          v-model="notes"
          rows="2"
          class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="مثلاً: در رویداد فناوری پارسال با هم آشنا شدند..."
        ></textarea>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
      >
        انصراف
      </button>
      <button
        type="button"
        @click="handleSubmit"
        class="px-4 py-1.5 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 rounded-lg shadow-sm"
      >
        ثبت پیوند
      </button>
    </template>
  </Modal>
</template>
