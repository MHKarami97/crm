import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fieldDefinitionRepository } from '@/data/repositories/FieldDefinitionRepository'
import type { FieldDefinition, FieldGroup } from '@/domain/models'

export const FIELD_GROUPS: { key: FieldGroup; label: string }[] = [
  { key: 'identity', label: 'هویت' },
  { key: 'contact', label: 'اطلاعات تماس' },
  { key: 'career', label: 'شغل و حرفه' },
  { key: 'acquaintance', label: 'نحوه آشنایی' },
  { key: 'personal', label: 'اطلاعات فردی و شخصی' },
  { key: 'notes', label: 'یادداشت و درجه اهمیت' },
  { key: 'customer', label: 'مشتری و خدمات' },
]

export const useFieldStore = defineStore('fields', () => {
  const fields = ref<FieldDefinition[]>([])
  const isLoading = ref<boolean>(false)

  const peopleFields = computed(() =>
    fields.value.filter((f) => f.section === 'people' && !f.archived)
  )

  const customerFields = computed(() =>
    fields.value.filter((f) => f.section === 'customer' && !f.archived)
  )

  const archivedFields = computed(() => fields.value.filter((f) => f.archived))

  async function loadFields() {
    isLoading.value = true
    try {
      fields.value = await fieldDefinitionRepository.getAll(true)
    } finally {
      isLoading.value = false
    }
  }

  async function addField(def: Omit<FieldDefinition, 'id' | 'builtin' | 'archived' | 'order'>) {
    const id = 'f-' + Math.random().toString(36).substring(2, 9)
    const newField: FieldDefinition = {
      ...def,
      id,
      builtin: false,
      archived: false,
      order: fields.value.length + 1,
    }
    await fieldDefinitionRepository.create(newField)
    await loadFields()
    return newField
  }

  async function updateField(def: FieldDefinition) {
    await fieldDefinitionRepository.update(def)
    await loadFields()
  }

  async function archiveField(id: string) {
    await fieldDefinitionRepository.archive(id)
    await loadFields()
  }

  async function restoreField(id: string) {
    await fieldDefinitionRepository.restore(id)
    await loadFields()
  }

  return {
    fields,
    isLoading,
    peopleFields,
    customerFields,
    archivedFields,
    loadFields,
    addField,
    updateField,
    archiveField,
    restoreField,
  }
})
