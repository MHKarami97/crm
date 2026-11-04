<script setup lang="ts">
import { computed } from 'vue'
import type { FieldDefinition } from '@/domain/models'
import { Star } from 'lucide-vue-next'

const props = defineProps<{
  field: FieldDefinition
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function toggleMultiSelectOption(option: string) {
  const current: string[] = Array.isArray(value.value) ? [...value.value] : []
  const idx = current.indexOf(option)
  if (idx === -1) {
    current.push(option)
  } else {
    current.splice(idx, 1)
  }
  emit('update:modelValue', current)
}
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between">
      <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {{ field.label }}
      </label>
      <span v-if="field.description" class="text-[11px] text-slate-400 dark:text-slate-500">
        {{ field.description }}
      </span>
    </div>

    <!-- Text Input -->
    <input
      v-if="field.type === 'text'"
      v-model="value"
      type="text"
      class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
      :placeholder="field.label"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="field.type === 'textarea'"
      v-model="value"
      rows="3"
      class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
      :placeholder="field.label"
    ></textarea>

    <!-- Number -->
    <input
      v-else-if="field.type === 'number'"
      v-model.number="value"
      type="number"
      class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
      :placeholder="field.label"
    />

    <!-- Phone -->
    <input
      v-else-if="field.type === 'phone'"
      v-model="value"
      type="tel"
      dir="ltr"
      class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
      placeholder="09..."
    />

    <!-- URL -->
    <input
      v-else-if="field.type === 'url'"
      v-model="value"
      type="url"
      dir="ltr"
      class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
      placeholder="https://..."
    />

    <!-- Date (Shamsi or standard date input) -->
    <input
      v-else-if="field.type === 'date'"
      v-model="value"
      type="text"
      dir="ltr"
      class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
      placeholder="۱۴۰۳/۰۸/۱۵"
    />

    <!-- Select -->
    <select
      v-else-if="field.type === 'select'"
      v-model="value"
      class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
    >
      <option value="">-- انتخاب کنید --</option>
      <option v-for="opt in field.options || []" :key="opt" :value="opt">
        {{ opt }}
      </option>
    </select>

    <!-- Multi-select pills -->
    <div v-else-if="field.type === 'multiselect'" class="flex flex-wrap gap-1.5 pt-1">
      <button
        v-for="opt in field.options || []"
        :key="opt"
        type="button"
        @click="toggleMultiSelectOption(opt)"
        :class="[
          'px-2.5 py-1 text-xs rounded-full border transition-colors',
          Array.isArray(value) && value.includes(opt)
            ? 'bg-primary-50 dark:bg-primary-950/60 border-primary-500 text-primary-700 dark:text-primary-300 font-medium'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
        ]"
      >
        {{ opt }}
      </button>
    </div>

    <!-- Boolean Switch -->
    <div v-else-if="field.type === 'boolean'" class="flex items-center gap-3 pt-1">
      <button
        type="button"
        @click="value = !value"
        :class="[
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
          value ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700',
        ]"
      >
        <span
          :class="[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            value ? '-translate-x-5' : 'translate-x-0',
          ]"
        />
      </button>
      <span class="text-xs text-slate-600 dark:text-slate-400">
        {{ value ? 'بله' : 'خیر' }}
      </span>
    </div>

    <!-- Rating (1 to 5 Stars) -->
    <div v-else-if="field.type === 'rating'" class="flex items-center gap-1.5 pt-1">
      <button
        v-for="star in 5"
        :key="star"
        type="button"
        @click="value = star"
        class="p-1 text-slate-300 dark:text-slate-600 hover:text-accent-500 dark:hover:text-accent-400 transition-colors"
      >
        <Star
          :class="[
            'w-5 h-5 transition-transform active:scale-125',
            (value || 0) >= star
              ? 'fill-accent-500 text-accent-500'
              : 'text-slate-300 dark:text-slate-600',
          ]"
        />
      </button>
      <span v-if="value" class="text-xs text-slate-500 dark:text-slate-400 mr-2">
        {{ value }} از ۵
      </span>
    </div>
  </div>
</template>
