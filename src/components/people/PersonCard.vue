<script setup lang="ts">
import { computed } from 'vue'
import type { Person } from '@/domain/models'
import { Phone, Building2, Cake } from 'lucide-vue-next'
import { toPersianDigits } from '@/utils/format'
import { daysUntilBirthday } from '@/utils/jalali'

const props = defineProps<{
  person: Person
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', person: Person): void
}>()

const initial = computed(() => {
  if (!props.person.name) return '؟'
  return props.person.name.trim().charAt(0)
})

const primaryPhone = computed(() => {
  return props.person.phones && props.person.phones.length > 0 ? props.person.phones[0] : null
})

const job = computed(() => {
  const parts: string[] = []
  if (props.person.customFields?.jobTitle) parts.push(props.person.customFields.jobTitle)
  if (props.person.customFields?.organization) parts.push(props.person.customFields.organization)
  return parts.join(' در ')
})

const birthdayInfo = computed(() => {
  if (!props.person.customFields?.birthdate) return null
  const days = daysUntilBirthday(String(props.person.customFields.birthdate))
  if (days !== null && days >= 0 && days <= 14) {
    if (days === 0) return 'امروز تولد است!'
    if (days === 1) return 'فردا تولد'
    return `${toPersianDigits(days)} روز تا تولد`
  }
  return null
})
</script>

<template>
  <div
    @click="emit('select', person)"
    :class="[
      'group relative flex items-center gap-3.5 p-3.5 bg-white dark:bg-slate-800/80 border rounded-2xl cursor-pointer transition-all active:scale-[0.99] hover:shadow-md',
      selected
        ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-sm'
        : 'border-slate-200/90 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600',
    ]"
  >
    <!-- Avatar / Initial -->
    <div
      class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-700 to-primary-800 dark:from-primary-600 dark:to-primary-700 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm"
    >
      {{ initial }}
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2 mb-1">
        <h4
          class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors"
        >
          {{ person.name }}
        </h4>
        <span
          v-if="person.customFields?.nickname"
          class="text-[11px] text-slate-400 dark:text-slate-500 shrink-0"
        >
          ({{ person.customFields.nickname }})
        </span>

        <span
          v-if="birthdayInfo"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300 border border-accent-300 dark:border-accent-800 shrink-0"
        >
          <Cake class="w-3 h-3 text-accent-600" />
          <span>{{ birthdayInfo }}</span>
        </span>
      </div>

      <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span v-if="primaryPhone" class="flex items-center gap-1 font-mono truncate" dir="ltr">
          <Phone class="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>{{ toPersianDigits(primaryPhone) }}</span>
        </span>
        <span v-if="job" class="flex items-center gap-1 truncate text-slate-600 dark:text-slate-300">
          <Building2 class="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span class="truncate">{{ job }}</span>
        </span>
      </div>

      <!-- Tags list -->
      <div v-if="person.tags && person.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
        <span
          v-for="tag in person.tags.slice(0, 3)"
          :key="tag"
          class="px-2 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          {{ tag }}
        </span>
        <span
          v-if="person.tags.length > 3"
          class="text-[10px] text-slate-400 self-center"
        >
          +{{ toPersianDigits(person.tags.length - 3) }}
        </span>
      </div>
    </div>
  </div>
</template>
