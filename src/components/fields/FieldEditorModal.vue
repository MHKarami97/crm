<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FieldDefinition, FieldType, FieldGroup } from '@/domain/models'
import { FIELD_GROUPS } from '@/stores/useFieldStore'
import Modal from '@/components/common/Modal.vue'

const props = defineProps<{
  isOpen: boolean
  fieldToEdit?: FieldDefinition | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', fieldData: any): void
}>()

const label = ref('')
const key = ref('')
const type = ref<FieldType>('text')
const group = ref<FieldGroup>('personal')
const description = ref('')
const rawOptions = ref('')

const FIELD_TYPES: { key: FieldType; label: string }[] = [
  { key: 'text', label: 'متن تک‌خطی' },
  { key: 'textarea', label: 'متن چندخطی' },
  { key: 'number', label: 'عدد' },
  { key: 'date', label: 'تاریخ (شمسی/میلادی)' },
  { key: 'select', label: 'انتخابی (تک‌گزینه‌ای)' },
  { key: 'multiselect', label: 'چندانتخابی' },
  { key: 'boolean', label: 'بله / خیر' },
  { key: 'rating', label: 'امتیاز ستاره‌ای (۱ تا ۵)' },
  { key: 'phone', label: 'شماره تلفن' },
  { key: 'url', label: 'لینک اینترنتی' },
]

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.fieldToEdit) {
        label.value = props.fieldToEdit.label
        key.value = props.fieldToEdit.key
        type.value = props.fieldToEdit.type
        group.value = props.fieldToEdit.group
        description.value = props.fieldToEdit.description || ''
        rawOptions.value = (props.fieldToEdit.options || []).join('\n')
      } else {
        label.value = ''
        key.value = ''
        type.value = 'text'
        group.value = 'personal'
        description.value = ''
        rawOptions.value = ''
      }
    }
  },
  { immediate: true }
)

function autoGenerateKey() {
  if (!props.fieldToEdit && label.value && !key.value) {
    key.value = 'field_' + Math.random().toString(36).substring(2, 8)
  }
}

function handleSubmit() {
  if (!label.value.trim() || !key.value.trim()) return

  const options = ['select', 'multiselect'].includes(type.value)
    ? rawOptions.value
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined

  emit('save', {
    id: props.fieldToEdit ? props.fieldToEdit.id : undefined,
    label: label.value.trim(),
    key: key.value.trim(),
    type: type.value,
    group: group.value,
    section: 'people',
    description: description.value.trim(),
    options,
  })
}
</script>

<template>
  <Modal
    :is-open="isOpen"
    :title="fieldToEdit ? 'ویرایش مشخصات فیلد' : 'ایجاد فیلد سفارشی جدید'"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4 py-2">
      <!-- Label -->
      <div class="space-y-1">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">
          عنوان فیلد (نمایش به کاربر) <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="label"
          type="text"
          required
          @blur="autoGenerateKey"
          class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="مثال: دانشگاه فارغ‌التحصیلی"
        />
      </div>

      <!-- Key -->
      <div class="space-y-1">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">
          کلید سیستم (انگلیسی، یکتا) <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="key"
          type="text"
          required
          dir="ltr"
          :disabled="!!fieldToEdit"
          class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono disabled:opacity-60"
          placeholder="university"
        />
      </div>

      <!-- Type -->
      <div class="space-y-1">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">نوع داده</label>
        <select
          v-model="type"
          class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option v-for="t in FIELD_TYPES" :key="t.key" :value="t.key">
            {{ t.label }}
          </option>
        </select>
      </div>

      <!-- Options (if select or multiselect) -->
      <div v-if="['select', 'multiselect'].includes(type)" class="space-y-1">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">
          گزینه‌ها (هر گزینه در یک خط)
        </label>
        <textarea
          v-model="rawOptions"
          rows="3"
          class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="گزینه ۱&#10;گزینه ۲&#10;گزینه ۳"
        ></textarea>
      </div>

      <!-- Group Category -->
      <div class="space-y-1">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">دسته‌بندی نمایشی</label>
        <select
          v-model="group"
          class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option
            v-for="g in FIELD_GROUPS.filter((x) => x.key !== 'customer')"
            :key="g.key"
            :value="g.key"
          >
            {{ g.label }}
          </option>
        </select>
      </div>

      <!-- Description -->
      <div class="space-y-1">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">توضیح راهنما (اختیاری)</label>
        <input
          v-model="description"
          type="text"
          class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="راهنمای تکمیلی فیلد..."
        />
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
        ذخیره فیلد
      </button>
    </template>
  </Modal>
</template>
