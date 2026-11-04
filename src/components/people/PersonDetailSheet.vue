<script setup lang="ts">
import { computed } from 'vue'
import type { Person, Relationship } from '@/domain/models'
import { useFieldStore, FIELD_GROUPS } from '@/stores/useFieldStore'
import { useRelationshipStore } from '@/stores/useRelationshipStore'
import { usePersonStore } from '@/stores/usePersonStore'
import BottomSheet from '@/components/common/BottomSheet.vue'
import {
  Phone,
  Mail,
  Edit3,
  Archive,
  UserPlus,
  Share2,
  Trash2,
  Star,
  ExternalLink,
  Route,
} from 'lucide-vue-next'
import { toPersianDigits, formatShortShamsi } from '@/utils/jalali'

const props = defineProps<{
  isOpen: boolean
  person: Person | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', person: Person): void
  (e: 'archive', id: string): void
  (e: 'delete', id: string): void
  (e: 'add-relation', personId: string): void
  (e: 'select-person', personId: string): void
  (e: 'find-path', personId: string): void
  (e: 'delete-relation', relationId: string): void
}>()

const fieldStore = useFieldStore()
const relStore = useRelationshipStore()
const personStore = usePersonStore()

const relationships = computed<Relationship[]>(() => {
  if (!props.person) return []
  return relStore.getRelationshipsForPerson(props.person.id)
})

function getRelatedPerson(rel: Relationship): Person | undefined {
  if (!props.person) return undefined
  const otherId =
    rel.sourcePersonId === props.person.id ? rel.targetPersonId : rel.sourcePersonId
  return personStore.people.find((p) => p.id === otherId)
}

function getRelationDirectionText(rel: Relationship): string {
  if (!props.person) return ''
  if (rel.sourcePersonId === props.person.id) {
    return `${rel.type}ِ`
  } else {
    return `مخاطبِ ${rel.type}`
  }
}
</script>

<template>
  <BottomSheet
    :is-open="isOpen && !!person"
    :title="person?.name"
    @close="emit('close')"
  >
    <div v-if="person" class="space-y-6">
      <!-- Person Header Card -->
      <div class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div
          class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-700 to-primary-800 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0"
        >
          {{ person.name.charAt(0) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {{ person.name }}
            </h3>
            <span
              v-if="person.customFields?.nickname"
              class="text-xs text-slate-500 dark:text-slate-400"
            >
              ({{ person.customFields.nickname }})
            </span>
          </div>
          <p
            v-if="person.customFields?.jobTitle || person.customFields?.organization"
            class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate"
          >
            {{ person.customFields.jobTitle }}
            <span v-if="person.customFields.jobTitle && person.customFields.organization"> در </span>
            {{ person.customFields.organization }}
          </p>

          <!-- Tags -->
          <div v-if="person.tags && person.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="tag in person.tags"
              :key="tag"
              class="px-2 py-0.5 text-[10px] font-medium rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="grid grid-cols-4 gap-2">
        <a
          v-if="person.phones && person.phones.length > 0"
          :href="`tel:${person.phones[0]}`"
          class="flex flex-col items-center justify-center p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 transition-colors"
        >
          <Phone class="w-4 h-4 mb-1" />
          <span class="text-[10px] font-semibold">تماس</span>
        </a>
        <a
          v-if="person.phones && person.phones.length > 0"
          :href="`sms:${person.phones[0]}`"
          class="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
        >
          <Mail class="w-4 h-4 mb-1" />
          <span class="text-[10px] font-semibold">پیامک</span>
        </a>
        <button
          type="button"
          @click="emit('add-relation', person.id)"
          class="flex flex-col items-center justify-center p-2 rounded-xl bg-accent-50 dark:bg-accent-950/60 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800 hover:bg-accent-100 transition-colors"
        >
          <UserPlus class="w-4 h-4 mb-1" />
          <span class="text-[10px] font-semibold">پیوند جدید</span>
        </button>
        <button
          type="button"
          @click="emit('find-path', person.id)"
          class="flex flex-col items-center justify-center p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
        >
          <Route class="w-4 h-4 mb-1" />
          <span class="text-[10px] font-semibold">مسیر معرفی</span>
        </button>
      </div>

      <!-- Phone Numbers & Emails -->
      <div class="space-y-3">
        <div v-if="person.phones && person.phones.length > 0" class="space-y-1">
          <label class="text-[11px] font-bold text-slate-400">شماره‌های تماس</label>
          <div
            v-for="phone in person.phones"
            :key="phone"
            class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700"
          >
            <span class="font-mono text-xs text-slate-800 dark:text-slate-200" dir="ltr">
              {{ toPersianDigits(phone) }}
            </span>
            <a
              :href="`tel:${phone}`"
              class="text-xs text-primary-700 dark:text-primary-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>تماس</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div v-if="person.emails && person.emails.length > 0" class="space-y-1">
          <label class="text-[11px] font-bold text-slate-400">آدرس‌های ایمیل</label>
          <div
            v-for="email in person.emails"
            :key="email"
            class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700"
          >
            <span class="font-mono text-xs text-slate-800 dark:text-slate-200" dir="ltr">
              {{ email }}
            </span>
            <a
              :href="`mailto:${email}`"
              class="text-xs text-primary-700 dark:text-primary-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>ارسال</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <!-- Connected Relationships in Graph -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Share2 class="w-4 h-4 text-primary-600" />
            <span>روابط و پیوندها در شبکه ({{ toPersianDigits(relationships.length) }})</span>
          </h4>
          <button
            type="button"
            @click="emit('add-relation', person.id)"
            class="text-[11px] font-semibold text-primary-700 dark:text-primary-400 hover:underline"
          >
            + پیوند جدید
          </button>
        </div>

        <div v-if="relationships.length > 0" class="space-y-2">
          <div
            v-for="rel in relationships"
            :key="rel.id"
            @click="getRelatedPerson(rel) && emit('select-person', getRelatedPerson(rel)!.id)"
            class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-400 transition-colors"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs shrink-0"
              >
                {{ getRelatedPerson(rel)?.name?.charAt(0) || '؟' }}
              </div>
              <div class="truncate">
                <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {{ getRelatedPerson(rel)?.name || 'مخاطب' }}
                </span>
                <span class="text-[11px] text-slate-400 mr-1.5">
                  ({{ getRelationDirectionText(rel) }})
                </span>
              </div>
            </div>

            <!-- Strength Stars & Delete -->
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
                @click.stop="emit('delete-relation', rel.id)"
                class="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="حذف پیوند"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-slate-400 py-2">
          هنوز پیوندی بین این شخص و سایر افراد ثبت نشده است.
        </p>
      </div>

      <!-- Custom Fields Info -->
      <div v-if="person.customFields && Object.keys(person.customFields).length > 0" class="space-y-2">
        <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">
          مشخصات و فیلدهای ثبت‌شده
        </h4>
        <div class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
          <div
            v-for="field in fieldStore.peopleFields"
            :key="field.id"
            class="flex items-start justify-between py-1 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
          >
            <span class="text-slate-500 dark:text-slate-400">{{ field.label }}:</span>
            <span class="font-medium text-slate-800 dark:text-slate-200 text-left" dir="auto">
              {{ person.customFields[field.key] ?? '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="person.notes" class="space-y-1">
        <label class="text-[11px] font-bold text-slate-400">یادداشت</label>
        <p class="p-3 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {{ person.notes }}
        </p>
      </div>
    </div>

    <template #footer>
      <div v-if="person" class="flex items-center justify-between w-full">
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            @click="emit('archive', person.id)"
            class="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="بایگانی شخص"
          >
            <Archive class="w-4 h-4" />
          </button>
          <button
            type="button"
            @click="emit('delete', person.id)"
            class="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            title="حذف کامل"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          @click="emit('edit', person)"
          class="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500 rounded-xl shadow-sm transition-all"
        >
          <Edit3 class="w-4 h-4" />
          <span>ویرایش مشخصات</span>
        </button>
      </div>
    </template>
  </BottomSheet>
</template>
