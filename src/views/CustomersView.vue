<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCustomerStore, type EnrichedCustomerProfile } from '@/stores/useCustomerStore'
import { usePersonStore } from '@/stores/usePersonStore'
import { BUSINESS_TEMPLATES, type BusinessType } from '@/domain/businessTemplates'
import CustomerProfileSheet from '@/components/customers/CustomerProfileSheet.vue'
import QuickPreferenceModal from '@/components/customers/QuickPreferenceModal.vue'
import VisitHistoryModal from '@/components/customers/VisitHistoryModal.vue'
import CustomerRemindersModal from '@/components/customers/CustomerRemindersModal.vue'
import BusinessAnalyticsModal from '@/components/customers/BusinessAnalyticsModal.vue'
import Modal from '@/components/common/Modal.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatMaskedPrice, toPersianDigits, formatPhoneNumber } from '@/utils/format'
import {
  Scissors,
  ShoppingBag,
  Wrench,
  Store,
  Eye,
  EyeOff,
  Bell,
  BarChart3,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Sparkles,
  Award,
  Phone,
  MessageCircle,
  UserCheck,
  UserPlus,
  PlusCircle,
  FileText,
} from 'lucide-vue-next'

const customerStore = useCustomerStore()
const personStore = usePersonStore()

onMounted(async () => {
  if (personStore.people.length === 0) {
    await personStore.loadPeople()
  }
  await customerStore.loadAll()
})

// Template Icons mapping
const templateIcons: Record<BusinessType, any> = {
  haircut: Scissors,
  boutique: ShoppingBag,
  auto: Wrench,
  general: Store,
}

// Active modal controllers
const selectedPersonId = ref<string | null>(null)
const isProfileSheetOpen = ref(false)
const isPreferencesModalOpen = ref(false)
const isVisitsModalOpen = ref(false)
const isRemindersModalOpen = ref(false)
const isAnalyticsModalOpen = ref(false)
const isAddCustomerModalOpen = ref(false)

// New customer form state
const addMode = ref<'new' | 'existing'>('new')
const newCustomerName = ref('')
const newCustomerPhone = ref('')
const selectedExistingPersonId = ref('')

// Filter state
const activeTemplate = computed(() => customerStore.currentTemplate)
const filterableFields = computed(() =>
  activeTemplate.value.fields.filter((f) => f.type === 'select')
)

// Counts
const totalCount = computed(() => customerStore.enrichedProfiles.length)
const dueCount = computed(() => customerStore.dueRepeatCustomers.length)
const dormantCount = computed(() => customerStore.dormantCustomers.length)
const totalAlerts = computed(() => dueCount.value + dormantCount.value)

function openProfile(personId: string) {
  selectedPersonId.value = personId
  isProfileSheetOpen.value = true
}

function openPreferences(personId: string) {
  selectedPersonId.value = personId
  isPreferencesModalOpen.value = true
}

function openVisits(personId: string) {
  selectedPersonId.value = personId
  isVisitsModalOpen.value = true
}

// Create or attach customer
async function handleCreateCustomer() {
  let targetPersonId = ''

  if (addMode.value === 'existing') {
    if (!selectedExistingPersonId.value) return
    targetPersonId = selectedExistingPersonId.value
  } else {
    if (!newCustomerName.value.trim()) return
    targetPersonId = await personStore.addPerson({
      name: newCustomerName.value.trim(),
      phones: newCustomerPhone.value.trim() ? [newCustomerPhone.value.trim()] : [],
      emails: [],
      tags: ['مشتری'],
      notes: 'ثبت شده از بخش کسب‌وکار',
      customFields: {},
    })
  }

  // Create customer profile for active business
  await customerStore.saveProfile(targetPersonId, {})

  // Reset & close
  newCustomerName.value = ''
  newCustomerPhone.value = ''
  selectedExistingPersonId.value = ''
  isAddCustomerModalOpen.value = false

  // Open preferences modal for immediate customization
  openPreferences(targetPersonId)
}

// Loyalty badge helper
function getLoyaltyBadge(item: EnrichedCustomerProfile) {
  const total = item.profile.totalSpent || 0
  if (total >= 10000000) {
    return { label: 'VIP الماس', cls: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' }
  }
  if (total >= 5000000) {
    return { label: 'طلایی', cls: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' }
  }
  if (total >= 1500000) {
    return { label: 'نقره‌ای', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' }
  }
  return { label: 'برنزی', cls: 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300' }
}

const existingNonCustomers = computed(() => {
  const customerPersonIds = new Set(customerStore.enrichedProfiles.map((p) => p.profile.personId))
  return personStore.people.filter((p) => !customerPersonIds.has(p.id))
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 transition-colors">
    <!-- Top Header -->
    <header class="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div>
          <h1 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>مدیریت مشتریان و ترجیحات</span>
          </h1>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {{ activeTemplate.title }} · ذخیره محلی و آفلاین
          </p>
        </div>

        <!-- Top Action Icons -->
        <div class="flex items-center gap-1.5">
          <!-- Privacy Mode Mask Toggle -->
          <button
            type="button"
            @click="customerStore.togglePrivacyMask"
            :class="[
              'p-2 rounded-xl border transition flex items-center gap-1 text-xs font-semibold',
              customerStore.isPrivacyMasked
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900',
            ]"
            :title="customerStore.isPrivacyMasked ? 'غیرفعال کردن حالت حریم خصوصی (نمایش مبالغ)' : 'فعال کردن حالت حریم خصوصی (مخفی‌سازی مبالغ مالی)'"
          >
            <component :is="customerStore.isPrivacyMasked ? EyeOff : Eye" class="w-4 h-4" />
            <span class="hidden sm:inline">حریم خصوصی</span>
          </button>

          <!-- Reminders Alert Button -->
          <button
            type="button"
            @click="isRemindersModalOpen = true"
            class="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            title="یادآوری‌های پیگیری مشتریان"
          >
            <Bell class="w-4 h-4" />
            <span
              v-if="totalAlerts > 0"
              class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center font-mono shadow-sm"
            >
              {{ toPersianDigits(totalAlerts) }}
            </span>
          </button>

          <!-- Analytics Button -->
          <button
            type="button"
            @click="isAnalyticsModalOpen = true"
            class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            title="گزارش مالی و آمار مراجعات"
          >
            <BarChart3 class="w-4 h-4" />
          </button>

          <!-- Add Customer Button -->
          <button
            type="button"
            @click="isAddCustomerModalOpen = true"
            class="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition shadow-sm active:scale-95"
          >
            <Plus class="w-4 h-4" />
            <span>مشتری جدید</span>
          </button>
        </div>
      </div>

      <!-- Business Template Tabs -->
      <div class="max-w-4xl mx-auto flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
        <button
          v-for="tmpl in customerStore.allTemplates"
          :key="tmpl.id"
          type="button"
          @click="customerStore.setBusinessType(tmpl.id)"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border',
            customerStore.activeBusinessType === tmpl.id
              ? 'bg-primary-50 dark:bg-primary-950/60 border-primary-300 dark:border-primary-700 text-primary-800 dark:text-primary-300 shadow-xs'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700',
          ]"
        >
          <component :is="templateIcons[tmpl.id]" class="w-3.5 h-3.5" />
          <span>{{ tmpl.title }}</span>
        </button>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <!-- Quick Stats KPI Bar -->
      <div class="grid grid-cols-4 gap-2 text-center">
        <!-- Total Active -->
        <div class="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span class="text-[10px] text-slate-400 dark:text-slate-500 block">کل مشتریان</span>
          <span class="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
            {{ toPersianDigits(totalCount) }}
          </span>
        </div>

        <!-- Due for Repeat -->
        <div
          @click="isRemindersModalOpen = true"
          class="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-rose-300 transition"
        >
          <span class="text-[10px] text-rose-500 dark:text-rose-400 block font-semibold">موعد تکرار</span>
          <span class="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">
            {{ toPersianDigits(dueCount) }}
          </span>
        </div>

        <!-- Dormant -->
        <div
          @click="isRemindersModalOpen = true"
          class="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-amber-300 transition"
        >
          <span class="text-[10px] text-amber-500 dark:text-amber-400 block font-semibold">غیرفعال (۴۵+ روز)</span>
          <span class="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
            {{ toPersianDigits(dormantCount) }}
          </span>
        </div>

        <!-- Monthly Revenue -->
        <div
          @click="isAnalyticsModalOpen = true"
          class="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-300 transition"
        >
          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">فروش این ماه</span>
          <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block truncate">
            {{ formatMaskedPrice(customerStore.analytics.thisMonthRevenue, customerStore.isPrivacyMasked) }}
          </span>
        </div>
      </div>

      <!-- Search & Dynamic Preference Filter -->
      <div class="flex flex-col sm:flex-row gap-2">
        <!-- Search Input -->
        <div class="relative flex-1">
          <Search class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            v-model="customerStore.searchQuery"
            placeholder="جستجوی نام، تلفن یا ترجیحات (مثلاً فر، XL، 206)..."
            class="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pr-9 pl-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <!-- Dynamic Preference Filter Dropdown -->
        <div v-if="filterableFields.length > 0" class="flex gap-1.5">
          <select
            v-model="customerStore.preferenceFilterKey"
            @change="customerStore.preferenceFilterVal = ''"
            class="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-2.5 py-2"
          >
            <option value="">فیلتر ترجیح...</option>
            <option
              v-for="field in filterableFields"
              :key="field.key"
              :value="field.key"
            >
              {{ field.label }}
            </option>
          </select>

          <!-- Selected field options -->
          <select
            v-if="customerStore.preferenceFilterKey"
            v-model="customerStore.preferenceFilterVal"
            class="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 font-semibold text-primary-700 dark:text-primary-300"
          >
            <option value="">همه موارد</option>
            <option
              v-for="opt in filterableFields.find(f => f.key === customerStore.preferenceFilterKey)?.options"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </option>
          </select>
        </div>
      </div>

      <!-- Customer Cards Grid -->
      <div
        v-if="customerStore.filteredProfiles.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div
          v-for="item in customerStore.filteredProfiles"
          :key="item.profile.id"
          class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800/60 shadow-xs transition-all space-y-3"
        >
          <!-- Top Row: Avatar, Name, Loyalty & Days Ago -->
          <div class="flex items-start justify-between cursor-pointer" @click="openProfile(item.profile.personId)">
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold text-sm flex items-center justify-center shrink-0"
              >
                {{ item.person?.avatarUrl || item.person?.name.charAt(0) }}
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-primary-600 transition">
                    {{ item.person?.name }}
                  </h3>
                  <!-- Loyalty Badge -->
                  <span
                    :class="[
                      'text-[10px] font-bold px-2 py-0.5 rounded-lg border',
                      getLoyaltyBadge(item).cls,
                    ]"
                  >
                    {{ getLoyaltyBadge(item).label }}
                  </span>
                </div>
                <!-- Phone -->
                <p
                  v-if="item.person?.customFields?.phone"
                  class="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5"
                  dir="ltr"
                >
                  {{ formatPhoneNumber(String(item.person.customFields.phone)) }}
                </p>
              </div>
            </div>

            <!-- Spend & Last Visit Status -->
            <div class="text-left shrink-0">
              <span class="text-xs font-bold text-primary-700 dark:text-primary-300 block">
                {{ formatMaskedPrice(item.profile.totalSpent, customerStore.isPrivacyMasked) }}
              </span>
              <!-- Status Pill -->
              <span
                v-if="item.isDueForRepeat"
                class="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
              >
                موعد تکرار
              </span>
              <span
                v-else-if="item.isDormant"
                class="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
              >
                غیرفعال
              </span>
              <span
                v-else-if="item.lastVisitDaysAgo !== null"
                class="text-[10px] text-slate-400 dark:text-slate-500 block mt-1"
              >
                {{ item.lastVisitDaysAgo === 0 ? 'امروز' : `${toPersianDigits(item.lastVisitDaysAgo)} روز پیش` }}
              </span>
            </div>
          </div>

          <!-- Preferences Chips -->
          <div
            v-if="item.profile.preferences && Object.keys(item.profile.preferences).length > 0"
            class="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-800"
          >
            <span
              v-for="(val, key) in item.profile.preferences"
              :key="key"
              class="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-[140px]"
            >
              {{ val }}
            </span>
          </div>

          <!-- Referrer info & Bottom Quick Actions -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <!-- Referrer Tag -->
            <div class="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <UserCheck class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span v-if="item.referredByPerson">
                معرف: <strong>{{ item.referredByPerson.name }}</strong>
              </span>
              <span v-else class="text-slate-400">مراجعه مستقیم</span>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1">
              <button
                type="button"
                @click.stop="openPreferences(item.profile.personId)"
                class="px-2.5 py-1 text-[11px] font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                ترجیحات
              </button>
              <button
                type="button"
                @click.stop="openVisits(item.profile.personId)"
                class="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition"
              >
                <PlusCircle class="w-3 h-3" />
                <span>مراجعه</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else
        :icon="Store"
        title="مشتری برای این قالب یافت نشد"
        description="مشتریان جدید اضافه کنید یا یکی از مخاطبان موجود را به مشتری تبدیل نمایید."
        action-label="افزودن اولین مشتری"
        @action="isAddCustomerModalOpen = true"
      >
        <template #action-icon>
          <Plus class="w-4 h-4" />
        </template>
      </EmptyState>
    </main>

    <!-- Modal: Add New Customer (New Person or Select Existing) -->
    <Modal
      :is-open="isAddCustomerModalOpen"
      @close="isAddCustomerModalOpen = false"
      title="افزودن مشتری جدید"
      max-width="sm"
    >
      <div class="space-y-4 px-1 py-1">
        <!-- Mode switcher -->
        <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
          <button
            type="button"
            @click="addMode = 'new'"
            :class="[
              'flex-1 py-1.5 text-xs font-bold rounded-lg transition',
              addMode === 'new'
                ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-300 shadow-xs'
                : 'text-slate-500',
            ]"
          >
            ثبت فرد جدید
          </button>
          <button
            type="button"
            @click="addMode = 'existing'"
            :class="[
              'flex-1 py-1.5 text-xs font-bold rounded-lg transition',
              addMode === 'existing'
                ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-300 shadow-xs'
                : 'text-slate-500',
            ]"
          >
            انتخاب از مخاطبان موجود
          </button>
        </div>

        <!-- Mode New -->
        <div v-if="addMode === 'new'" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              نام و نام خانوادگی *
            </label>
            <input
              type="text"
              v-model="newCustomerName"
              placeholder="مثلاً نگار احمدی"
              class="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              شماره تلفن (اختیاری)
            </label>
            <input
              type="tel"
              v-model="newCustomerPhone"
              dir="ltr"
              placeholder="0912..."
              class="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
            />
          </div>
        </div>

        <!-- Mode Existing -->
        <div v-if="addMode === 'existing'" class="space-y-2">
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-200">
            انتخاب مخاطب
          </label>
          <select
            v-model="selectedExistingPersonId"
            class="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          >
            <option value="">یک مخاطب را انتخاب کنید...</option>
            <option
              v-for="p in existingNonCustomers"
              :key="p.id"
              :value="p.id"
            >
              {{ p.name }}
            </option>
          </select>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            @click="isAddCustomerModalOpen = false"
            class="px-4 py-2 text-xs text-slate-600 dark:text-slate-300"
          >
            انصراف
          </button>
          <button
            type="button"
            @click="handleCreateCustomer"
            :disabled="(addMode === 'new' && !newCustomerName) || (addMode === 'existing' && !selectedExistingPersonId)"
            class="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-50"
          >
            تأیید و ثبت ترجیحات
          </button>
        </div>
      </template>
    </Modal>

    <!-- Sub-modals -->
    <CustomerProfileSheet
      v-if="selectedPersonId"
      v-model="isProfileSheetOpen"
      :person-id="selectedPersonId"
      @open-preferences="openPreferences"
      @open-visits="openVisits"
    />

    <QuickPreferenceModal
      v-if="selectedPersonId"
      v-model="isPreferencesModalOpen"
      :person-id="selectedPersonId"
      :business-type="customerStore.activeBusinessType"
    />

    <VisitHistoryModal
      v-if="selectedPersonId"
      v-model="isVisitsModalOpen"
      :person-id="selectedPersonId"
    />

    <CustomerRemindersModal
      v-model="isRemindersModalOpen"
      @select-customer="openProfile"
    />

    <BusinessAnalyticsModal
      v-model="isAnalyticsModalOpen"
      @select-customer="openProfile"
    />
  </div>
</template>
