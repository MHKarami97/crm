<script setup lang="ts">
import { ref } from 'vue'
import { useFieldStore } from '@/stores/useFieldStore'
import type { FieldDefinition } from '@/domain/models'
import Modal from '@/components/common/Modal.vue'
import FieldEditorModal from './FieldEditorModal.vue'
import { Plus, Archive, RotateCcw, Edit2 } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const fieldStore = useFieldStore()

const isEditorOpen = ref(false)
const fieldToEdit = ref<FieldDefinition | null>(null)

function handleOpenNew() {
  fieldToEdit.value = null
  isEditorOpen.value = true
}

function handleOpenEdit(f: FieldDefinition) {
  fieldToEdit.value = f
  isEditorOpen.value = true
}

async function handleSaveField(data: any) {
  if (data.id) {
    await fieldStore.updateField(data)
  } else {
    await fieldStore.addField(data)
  }
  isEditorOpen.value = false
}

async function toggleArchive(f: FieldDefinition) {
  if (f.archived) {
    await fieldStore.restoreField(f.id)
  } else {
    await fieldStore.archiveField(f.id)
  }
}
</script>

<template>
  <Modal :is-open="isOpen" title="مدیریت فیلدهای سفارشی" max-width="lg" @close="emit('close')">
    <div class="space-y-4 py-2">
      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-slate-400">
          فیلدهای فعال بلافاصله در فرم ثبت و ویرایش همهٔ افراد در دسترس قرار می‌گیرند.
        </p>
        <button
          type="button"
          @click="handleOpenNew"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 rounded-lg shadow-xs"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>فیلد جدید</span>
        </button>
      </div>

      <!-- Fields List -->
      <div class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        <div
          v-for="field in fieldStore.fields"
          :key="field.id"
          class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl"
        >
          <div class="space-y-0.5 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
                {{ field.label }}
              </span>
              <span
                v-if="field.builtin"
                class="px-1.5 py-0.2 text-[9px] rounded bg-slate-100 dark:bg-slate-700 text-slate-500 font-medium"
              >
                پیش‌فرض
              </span>
              <span
                v-if="field.archived"
                class="px-1.5 py-0.2 text-[9px] rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 font-medium"
              >
                بایگانی‌شده
              </span>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-slate-400 font-mono" dir="ltr">
              <span>{{ field.key }}</span>
              <span>•</span>
              <span>{{ field.type }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              v-if="!field.builtin"
              type="button"
              @click="handleOpenEdit(field)"
              class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="ویرایش"
            >
              <Edit2 class="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              @click="toggleArchive(field)"
              :class="[
                'p-1.5 rounded-lg transition-colors',
                field.archived
                  ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40',
              ]"
              :title="field.archived ? 'بازگردانی از بایگانی' : 'بایگانی کردن'"
            >
              <RotateCcw v-if="field.archived" class="w-3.5 h-3.5" />
              <Archive v-else class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Child Modal: Field Editor -->
    <FieldEditorModal
      :is-open="isEditorOpen"
      :field-to-edit="fieldToEdit"
      @close="isEditorOpen = false"
      @save="handleSaveField"
    />
  </Modal>
</template>
