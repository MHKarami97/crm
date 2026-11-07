<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '@/components/common/Modal.vue'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { usePersonStore } from '@/stores/usePersonStore'
import { BUSINESS_TEMPLATES } from '@/domain/businessTemplates'
import { formatMaskedPrice, toPersianDigits, formatPhoneNumber } from '@/utils/format'
import { daysSinceShamsiDate } from '@/utils/jalali'
import {
  Phone,
  MessageCircle,
  Calendar,
  Sparkles,
  Award,
  Clock,
  Network,
  Edit3,
  PlusCircle,
  UserCheck,
  ChevronLeft,
} from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  personId: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'openPreferences', personId: string): void
  (e: 'openVisits', personId: string): void
}>()

const router = useRouter()
const customerStore = useCustomerStore()
const personStore = usePersonStore()

const person = computed(() =>
  personStore.people.find((p) => p.id === props.personId)
)

const enriched = computed(() =>
  customerStore.enrichedProfiles.find((p) => p.profile.personId === props.personId)
)

const profile = computed(() => enriched.value?.profile)

const template = computed(() => {
  const bType = profile.value?.businessType || customerStore.activeBusinessType
  return BUSINESS_TEMPLATES[bType]
})

// Loyalty Tier calculation
const loyaltyBadge = computed(() => {
  const total = profile.value?.totalSpent || 0
  const visitsCount = customerStore.getVisitsForPerson(props.personId).length

  if (total >= 10000000 || visitsCount >= 15) {
    return { name: 'VIP الماس', color: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' }
  }
  if (total >= 5000000 || visitsCount >= 8) {
    return { name: 'مشتری طلایی', color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' }
  }
  if (total >= 1500000 || visitsCount >= 3) {
    return { name: 'مشتری نقره‌ای', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' }
  }
  return { name: 'مشتری برنزی', color: 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' }
})

const phoneNumber = computed(() => {
  return (person.value?.customFields?.phone as string) || ''
})

function viewInGraph() {
  emit('update:modelValue', false)
  router.push({ path: '/graph', query: { focus: props.personId } })
}
</script>

<template>
  <Modal
    :is-open="modelValue"
    @close="emit('update:modelValue', false)"
    :title="person?.name || 'اطلاعات مشتری'"
    max-width="md"
  >
    <div v-if="person" class="space-y-4 max-h-[72vh] overflow-y-auto px-1 py-1">
      <!-- Top Card: Avatar, Name, Loyalty & Quick Contacts -->
      <div
        class="p-4 rounded-2xl bg-gradient-to-br from-primary-50/50 to-slate-50 dark:from-slate-800/80 dark:to-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-13 h-13 rounded-2xl bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold text-lg flex items-center justify-center shadow-inner"
            >
              {{ person.avatarUrl || person.name.charAt(0) }}
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100">
                {{ person.name }}
              </h3>
              <p
                v-if="phoneNumber"
                class="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5"
                dir="ltr"
              >
                {{ formatPhoneNumber(phoneNumber) }}
              </p>
            </div>
          </div>

          <!-- Loyalty Badge -->
          <span
            :class="[
              'text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1',
              loyaltyBadge.color,
            ]"
          >
            <Award class="w-3.5 h-3.5" />
            <span>{{ loyaltyBadge.name }}</span>
          </span>
        </div>

        <!-- Call & Message Quick Buttons -->
        <div v-if="phoneNumber" class="flex gap-2 pt-1">
          <a
            :href="`tel:${phoneNumber}`"
            class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <Phone class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>تماس تلفنی</span>
          </a>
          <a
            :href="`sms:${phoneNumber}`"
            class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <MessageCircle class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>ارسال پیامک</span>
          </a>
        </div>
      </div>

      <!-- Financial & Visit Stats Grid -->
      <div class="grid grid-cols-3 gap-2">
        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
          <span class="text-[10px] text-slate-400 dark:text-slate-500 block">مجموع خرید</span>
          <span class="text-xs font-bold text-primary-700 dark:text-primary-300 mt-0.5 block">
            {{ formatMaskedPrice(profile?.totalSpent || 0, customerStore.isPrivacyMasked) }}
          </span>
        </div>
        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
          <span class="text-[10px] text-slate-400 dark:text-slate-500 block">آخرین مراجعه</span>
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
            <template v-if="profile?.lastVisitDate">
              {{ enriched?.lastVisitDaysAgo === 0 ? 'امروز' : `${toPersianDigits(enriched?.lastVisitDaysAgo)} روز پیش` }}
            </template>
            <template v-else>بدون سابقه</template>
          </span>
        </div>
        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
          <span class="text-[10px] text-slate-400 dark:text-slate-500 block">موعد تکرار</span>
          <span
            :class="[
              'text-xs font-bold mt-0.5 block',
              enriched?.isDueForRepeat
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-800 dark:text-slate-200',
            ]"
          >
            {{ profile?.nextServiceDueDate ? toPersianDigits(profile.nextServiceDueDate) : 'تعیین نشده' }}
          </span>
        </div>
      </div>

      <!-- Referral Chain Card -->
      <div
        class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
      >
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <UserCheck class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>شبکه معرف‌ها و معرفی‌ها</span>
          </span>
          <button
            type="button"
            @click="viewInGraph"
            class="inline-flex items-center gap-1 text-[11px] text-primary-600 dark:text-primary-400 font-medium hover:underline"
          >
            <Network class="w-3 h-3" />
            <span>مشاهده در گراف</span>
          </button>
        </div>

        <div class="text-[11px] text-slate-600 dark:text-slate-300">
          <div v-if="enriched?.referredByPerson">
            معرفی‌شده توسط: <strong class="text-primary-700 dark:text-primary-400">{{ enriched.referredByPerson.name }}</strong>
          </div>
          <div v-else class="text-slate-400">
            معرف مشخصی ندارد (مراجعه مستقیم).
          </div>
          <div v-if="enriched && enriched.referredCount > 0" class="mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
            این شخص {{ toPersianDigits(enriched.referredCount) }} مشتری جدید را معرفی کرده است!
          </div>
        </div>
      </div>

      <!-- Preferences Section -->
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span>ترجیحات و ویژگی‌های ثبت‌شده</span>
          </h4>
          <button
            type="button"
            @click="emit('openPreferences', personId)"
            class="text-[11px] text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-0.5"
          >
            <Edit3 class="w-3 h-3" />
            <span>ویرایش</span>
          </button>
        </div>

        <div
          v-if="profile && profile.preferences && Object.keys(profile.preferences).length > 0"
          class="grid grid-cols-2 gap-2 pt-1"
        >
          <div
            v-for="(val, key) in profile.preferences"
            :key="key"
            class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
          >
            <span class="text-[10px] text-slate-400 dark:text-slate-500 block">
              {{ template.fields.find(f => f.key === key)?.label || key }}
            </span>
            <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
              {{ val }}
            </span>
          </div>
        </div>
        <div
          v-else
          class="py-3 text-center text-xs text-slate-400 dark:text-slate-500"
        >
          ترجیحی ثبت نشده است. روی «ویرایش» بزنید.
        </div>
      </div>

      <!-- Customer Photos Gallery -->
      <div
        v-if="profile && profile.photos && profile.photos.length > 0"
        class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2"
      >
        <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">
          تصاویر و نمونه‌کارهای مشتری
        </h4>
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="(photo, idx) in profile.photos"
            :key="idx"
            class="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100"
          >
            <img :src="photo" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <button
          type="button"
          @click="emit('openVisits', personId)"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition shadow-sm active:scale-95"
        >
          <PlusCircle class="w-4 h-4" />
          <span>ثبت / سابقه مراجعات</span>
        </button>

        <button
          type="button"
          @click="emit('update:modelValue', false)"
          class="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
        >
          بستن
        </button>
      </div>
    </template>
  </Modal>
</template>
