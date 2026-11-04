<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Person, FieldDefinition } from '@/domain/models'
import { useFieldStore, FIELD_GROUPS } from '@/stores/useFieldStore'
import { usePersonStore } from '@/stores/usePersonStore'
import { useRelationshipStore, DEFAULT_RELATIONSHIP_TYPES } from '@/stores/useRelationshipStore'
import BottomSheet from '@/components/common/BottomSheet.vue'
import DynamicFieldInput from '@/components/common/DynamicFieldInput.vue'
import { Plus, Trash2, Tag as TagIcon, Share2, Star, UserPlus } from 'lucide-vue-next'
import { toPersianDigits } from '@/utils/format'

const props = defineProps<{
  isOpen: boolean
  personToEdit?: Person | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', personData: any): void
}>()

const fieldStore = useFieldStore()
const personStore = usePersonStore()
const relStore = useRelationshipStore()

const name = ref('')
const phones = ref<string[]>([''])
const emails = ref<string[]>([''])
const tags = ref<string[]>([])
const notes = ref('')
const customFields = ref<Record<string, any>>({})
const newTagInput = ref('')

// Relationships inside person form
interface DraftRelation {
  targetPersonId: string
  targetPersonName: string
  type: string
  strength: number
  notes?: string
}

const draftedRelations = ref<DraftRelation[]>([])
const newRelTargetId = ref('')
const newRelType = ref('دوست')
const newRelStrength = ref(3)
const newRelNotes = ref('')

const availablePeople = computed(() => {
  return personStore.people.filter((p) => !props.personToEdit || p.id !== props.personToEdit.id)
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.personToEdit) {
        name.value = props.personToEdit.name
        phones.value =
          props.personToEdit.phones && props.personToEdit.phones.length > 0
            ? [...props.personToEdit.phones]
            : ['']
        emails.value =
          props.personToEdit.emails && props.personToEdit.emails.length > 0
            ? [...props.personToEdit.emails]
            : ['']
        tags.value = [...(props.personToEdit.tags || [])]
        notes.value = props.personToEdit.notes || ''
        customFields.value = { ...(props.personToEdit.customFields || {}) }

        // Load existing relations
        const existing = relStore.getRelationshipsForPerson(props.personToEdit.id)
        draftedRelations.value = existing.map((r) => {
          const otherId =
            r.sourcePersonId === props.personToEdit!.id ? r.targetPersonId : r.sourcePersonId
          const otherPerson = personStore.people.find((p) => p.id === otherId)
          return {
            targetPersonId: otherId,
            targetPersonName: otherPerson?.name || 'مخاطب',
            type: r.type,
            strength: r.strength,
            notes: r.notes || '',
          }
        })
      } else {
        name.value = ''
        phones.value = ['']
        emails.value = ['']
        tags.value = []
        notes.value = ''
        customFields.value = {}
        draftedRelations.value = []
      }

      newRelTargetId.value = ''
      newRelType.value = 'دوست'
      newRelStrength.value = 3
      newRelNotes.value = ''
    }
  },
  { immediate: true }
)

const groupedFields = computed(() => {
  const map: Record<string, FieldDefinition[]> = {}
  for (const group of FIELD_GROUPS) {
    if (group.key === 'customer') continue
    const list = fieldStore.peopleFields.filter((f) => f.group === group.key)
    if (list.length > 0) {
      map[group.key] = list
    }
  }
  return map
})

function addPhone() {
  phones.value.push('')
}

function removePhone(index: number) {
  phones.value.splice(index, 1)
}

function addEmail() {
  emails.value.push('')
}

function removeEmail(index: number) {
  emails.value.splice(index, 1)
}

function addTag() {
  const t = newTagInput.value.trim()
  if (t && !tags.value.includes(t)) {
    tags.value.push(t)
    newTagInput.value = ''
  }
}

function removeTag(tag: string) {
  tags.value = tags.value.filter((t) => t !== tag)
}

function toggleSuggestedTag(t: string) {
  if (tags.value.includes(t)) {
    removeTag(t)
  } else {
    tags.value.push(t)
  }
}

function addDraftRelation() {
  if (!newRelTargetId.value) return
  const target = personStore.people.find((p) => p.id === newRelTargetId.value)
  if (!target) return

  // Prevent duplicate
  const alreadyAdded = draftedRelations.value.some((r) => r.targetPersonId === target.id)
  if (alreadyAdded) {
    return
  }

  draftedRelations.value.push({
    targetPersonId: target.id,
    targetPersonName: target.name,
    type: newRelType.value.trim() || 'ارتباط',
    strength: newRelStrength.value,
    notes: newRelNotes.value.trim(),
  })

  // Reset inputs
  newRelTargetId.value = ''
  newRelType.value = 'دوست'
  newRelStrength.value = 3
  newRelNotes.value = ''
}

function removeDraftRelation(index: number) {
  draftedRelations.value.splice(index, 1)
}

function handleSubmit() {
  if (!name.value.trim()) return

  const cleanPhones = phones.value.map((p) => p.trim()).filter(Boolean)
  const cleanEmails = emails.value.map((e) => e.trim()).filter(Boolean)
  const cleanTags = tags.value.map((t) => t.trim()).filter(Boolean)
  const cleanCustomFields: Record<string, any> = JSON.parse(JSON.stringify(customFields.value || {}))

  emit('save', {
    id: props.personToEdit ? props.personToEdit.id : undefined,
    name: name.value.trim(),
    phones: cleanPhones,
    emails: cleanEmails,
    tags: cleanTags,
    notes: notes.value.trim(),
    customFields: cleanCustomFields,
    pendingRelationships: JSON.parse(JSON.stringify(draftedRelations.value)),
  })
}
</script>

<template>
  <BottomSheet
    :is-open="isOpen"
    :title="personToEdit ? 'ویرایش مشخصات فرد' : 'ثبت شخص جدید'"
    :full-height-on-mobile="true"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Full Name -->
      <div class="space-y-1.5">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">
          نام و نام‌خانوادگی <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="name"
          type="text"
          required
          autofocus
          class="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
          placeholder="مثال: علی رضایی"
        />
      </div>

      <!-- Phone Numbers -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-800 dark:text-slate-200">شماره‌های تماس</label>
          <button
            type="button"
            @click="addPhone"
            class="text-[11px] text-primary-700 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>افزودن شماره</span>
          </button>
        </div>
        <div v-for="(phone, index) in phones" :key="index" class="flex items-center gap-2">
          <input
            v-model="phones[index]"
            type="tel"
            dir="ltr"
            class="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0912..."
          />
          <button
            v-if="phones.length > 1"
            type="button"
            @click="removePhone(index)"
            class="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Emails -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-800 dark:text-slate-200">ایمیل‌ها</label>
          <button
            type="button"
            @click="addEmail"
            class="text-[11px] text-primary-700 dark:text-primary-400 font-semibold hover:underline flex items-center gap-1"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>افزودن ایمیل</span>
          </button>
        </div>
        <div v-for="(email, index) in emails" :key="index" class="flex items-center gap-2">
          <input
            v-model="emails[index]"
            type="email"
            dir="ltr"
            class="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="email@example.com"
          />
          <button
            v-if="emails.length > 1"
            type="button"
            @click="removeEmail(index)"
            class="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Tags -->
      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">برچسب‌ها</label>
        <div class="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80">
          <span
            v-for="tag in tags"
            :key="tag"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-primary-100 dark:bg-primary-950/80 text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-800"
          >
            <TagIcon class="w-3 h-3" />
            <span>{{ tag }}</span>
            <button
              type="button"
              @click="removeTag(tag)"
              class="text-primary-600 hover:text-rose-600 font-bold ml-0.5"
            >
              ×
            </button>
          </span>
          <span v-if="tags.length === 0" class="text-xs text-slate-400 self-center">
            برچسبی انتخاب نشده
          </span>
        </div>

        <!-- Tag input & Suggestions -->
        <div class="flex items-center gap-2">
          <input
            v-model="newTagInput"
            type="text"
            @keydown.enter.prevent="addTag"
            class="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="برچسب جدید... (Enter برای افزودن)"
          />
          <button
            type="button"
            @click="addTag"
            class="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
          >
            افزودن
          </button>
        </div>

        <!-- Quick tag suggestions from repository -->
        <div v-if="personStore.tags.length > 0" class="flex flex-wrap gap-1 pt-1">
          <span class="text-[11px] text-slate-400 self-center ml-1">پیشنهادی:</span>
          <button
            v-for="st in personStore.tags"
            :key="st.id"
            type="button"
            @click="toggleSuggestedTag(st.name)"
            :class="[
              'px-2 py-0.5 text-[11px] rounded-md border transition-all',
              tags.includes(st.name)
                ? 'bg-primary-600 border-primary-600 text-white font-medium'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300',
            ]"
          >
            {{ st.name }}
          </button>
        </div>
      </div>

      <!-- Dynamic Custom Fields Accordion / Groups -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">
          فیلدهای تکمیلی و اطلاعات سفارشی
        </h4>

        <div
          v-for="group in FIELD_GROUPS.filter((g) => g.key !== 'customer' && groupedFields[g.key])"
          :key="group.key"
          class="p-3.5 bg-slate-50/70 dark:bg-slate-850 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-3"
        >
          <h5 class="text-xs font-bold text-primary-800 dark:text-primary-400">
            {{ group.label }}
          </h5>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DynamicFieldInput
              v-for="field in groupedFields[group.key]"
              :key="field.id"
              :field="field"
              v-model="customFields[field.key]"
            />
          </div>
        </div>
      </div>

      <!-- Relationships in Network -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Share2 class="w-4 h-4 text-primary-600" />
            <span>روابط و پیوندها در شبکه ارتباطات (اختیاری)</span>
          </h4>
          <span v-if="draftedRelations.length > 0" class="text-[11px] font-bold text-primary-700 dark:text-primary-400">
            {{ toPersianDigits(draftedRelations.length) }} پیوند
          </span>
        </div>

        <!-- If other people exist to connect with -->
        <div v-if="availablePeople.length > 0" class="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <!-- Target Contact -->
            <div class="space-y-1">
              <label class="text-[11px] font-semibold text-slate-600 dark:text-slate-400">انتخاب مخاطب مقصد</label>
              <select
                v-model="newRelTargetId"
                class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- انتخاب شخص مقابل --</option>
                <option v-for="p in availablePeople" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </div>

            <!-- Relation Type -->
            <div class="space-y-1">
              <label class="text-[11px] font-semibold text-slate-600 dark:text-slate-400">نوع نسبت / پیوند</label>
              <input
                v-model="newRelType"
                type="text"
                placeholder="دوست، همکار، معرف..."
                class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <!-- Quick Relationship Type Suggestions -->
          <div class="flex flex-wrap gap-1">
            <button
              v-for="t in DEFAULT_RELATIONSHIP_TYPES"
              :key="t"
              type="button"
              @click="newRelType = t"
              :class="[
                'px-2 py-0.5 text-[10px] rounded-md border transition-all',
                newRelType === t
                  ? 'bg-primary-50 dark:bg-primary-950 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
              ]"
            >
              {{ t }}
            </button>
          </div>

          <!-- Strength and Add Button -->
          <div class="flex items-center justify-between pt-1">
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] font-semibold text-slate-500">عمق ارتباط:</span>
              <div class="flex items-center gap-0.5">
                <button
                  v-for="s in 5"
                  :key="s"
                  type="button"
                  @click="newRelStrength = s"
                  class="p-0.5 text-slate-300 hover:text-accent-500"
                >
                  <Star
                    :class="[
                      'w-4 h-4',
                      newRelStrength >= s ? 'fill-accent-500 text-accent-500' : 'text-slate-300 dark:text-slate-600',
                    ]"
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              :disabled="!newRelTargetId"
              @click="addDraftRelation"
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all"
            >
              <UserPlus class="w-3.5 h-3.5" />
              <span>افزودن پیوند</span>
            </button>
          </div>
        </div>

        <p v-else class="text-[11px] text-slate-400 py-1">
          برای اتصال این شخص به دیگران، ابتدا باید حداقل یک مخاطب دیگر در سیستم ثبت شده باشد.
        </p>

        <!-- Drafted Relationships List -->
        <div v-if="draftedRelations.length > 0" class="space-y-1.5 pt-1">
          <div
            v-for="(rel, idx) in draftedRelations"
            :key="idx"
            class="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold shrink-0">
                {{ rel.targetPersonName.charAt(0) }}
              </div>
              <div class="truncate">
                <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {{ rel.targetPersonName }}
                </span>
                <span class="text-[11px] text-slate-400 mr-1.5">
                  ({{ rel.type }})
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <div class="flex items-center gap-0.5 text-accent-500">
                <Star
                  v-for="s in rel.strength"
                  :key="s"
                  class="w-3 h-3 fill-accent-500 text-accent-500"
                />
              </div>
              <button
                type="button"
                @click="removeDraftRelation(idx)"
                class="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="حذف پیوند"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="space-y-1.5 pt-2">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200">
          یادداشت‌های آزاد
        </label>
        <textarea
          v-model="notes"
          rows="3"
          class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="نکات مهم و یادداشت‌های مربوط به این شخص..."
        ></textarea>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        @click="emit('close')"
        class="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        انصراف
      </button>
      <button
        type="button"
        @click="handleSubmit"
        class="px-5 py-2 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500 rounded-xl shadow-sm transition-all active:scale-95"
      >
        {{ personToEdit ? 'ذخیره تغییرات' : 'ثبت شخص' }}
      </button>
    </template>
  </BottomSheet>
</template>
