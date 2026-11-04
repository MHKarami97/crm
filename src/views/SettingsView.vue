<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePersonStore } from '@/stores/usePersonStore'
import { useRelationshipStore } from '@/stores/useRelationshipStore'
import { db } from '@/data/AppDatabase'
import SecuritySettingsModal from '@/components/auth/SecuritySettingsModal.vue'
import FieldManagerModal from '@/components/fields/FieldManagerModal.vue'
import ImportExportModal from '@/components/exchange/ImportExportModal.vue'
import DriveSyncModal from '@/components/backup/DriveSyncModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { showToast } from '@/components/common/ToastContainer.vue'
import {
  Shield,
  Palette,
  Sliders,
  Database,
  Cloud,
  HardDrive,
  Cpu,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-vue-next'
import { toPersianDigits, formatShamsiDate } from '@/utils/jalali'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const personStore = usePersonStore()
const relStore = useRelationshipStore()

// Modals
const isSecurityOpen = ref(false)
const isFieldsOpen = ref(false)
const isExchangeOpen = ref(false)
const isDriveOpen = ref(false)
const isResetConfirmOpen = ref(false)
const isGeneratingBenchmark = ref(false)

async function handleRequestStorage() {
  const ok = await settingsStore.requestStoragePersistence()
  if (ok) {
    showToast('فضای ذخیره‌سازی دائمی با موفقیت فعال شد.', 'success')
  } else {
    showToast('مرورگر اجازه فعال‌سازی دائمی را نداد یا قبلاً فعال شده است.', 'info')
  }
}

async function handleGenerateBenchmark() {
  isGeneratingBenchmark.value = true
  showToast('در حال تولید ۵٬۰۰۰ فرد و ۱۰٬۰۰۰ رابطه آزمایشی...', 'info', 6000)

  try {
    const peopleCount = 5000
    const relCount = 10000

    const newPeople: any[] = []
    const firstNames = ['علی', 'محمد', 'رضا', 'حسین', 'مهدی', 'سارا', 'مریم', 'زهرا', 'فاطمه', 'نیما', 'امیر', 'پویا', 'کیان', 'آیدا', 'الناز']
    const lastNames = ['رضایی', 'محمدی', 'احمدی', 'حسینی', 'کریمی', 'مرادی', 'صادقی', 'طاهری', 'جعفری', 'کاظمی', 'موسوی', 'نجفی']
    const tagOptions = ['دوست', 'کاری', 'خانواده', 'مشتری']
    const relTypes = ['دوست', 'همکار', 'معرف', 'مشتری', 'شریک تجاری']

    const now = new Date().toISOString()

    for (let i = 1; i <= peopleCount; i++) {
      const fn = firstNames[i % firstNames.length]
      const ln = lastNames[Math.floor(i / firstNames.length) % lastNames.length]
      const tag = tagOptions[i % tagOptions.length]
      newPeople.push({
        id: `bench-p-${i}`,
        name: `${fn} ${ln} ${i}`,
        phones: [`0912${String(i).padStart(7, '0')}`],
        emails: [`user${i}@example.com`],
        tags: [tag],
        notes: `مخاطب تستی بنچمارک شماره ${i}`,
        customFields: {
          organization: `شرکت ${tag}`,
          jobTitle: `کارشناس ${i % 10}`,
        },
        createdAt: now,
        updatedAt: now,
        archived: false,
      })
    }

    const newRels: any[] = []
    for (let j = 1; j <= relCount; j++) {
      const sourceIdx = (j * 7) % peopleCount + 1
      let targetIdx = (j * 13) % peopleCount + 1
      if (sourceIdx === targetIdx) targetIdx = (targetIdx % peopleCount) + 1

      newRels.push({
        id: `bench-r-${j}`,
        sourcePersonId: `bench-p-${sourceIdx}`,
        targetPersonId: `bench-p-${targetIdx}`,
        type: relTypes[j % relTypes.length],
        strength: (j % 5) + 1,
        startDate: '۱۴۰۲/۰۱/۰۱',
        notes: 'پیوند تولیدشده بنچمارک',
        createdAt: now,
        updatedAt: now,
      })
    }

    // Bulk add in transactions
    await db.people.bulkPut(newPeople)
    await db.relationships.bulkPut(newRels)

    await personStore.loadPeople()
    await relStore.loadRelationships()

    showToast('بنچمارک موفق: ۵٬۰۰۰ فرد و ۱۰٬۰۰۰ رابطه با موفقیت ایجاد شدند.', 'success')
  } catch (err: any) {
    showToast(err.message || 'خطا در تولید داده بنچمارک', 'error')
  } finally {
    isGeneratingBenchmark.value = false
  }
}

async function handleClearAllData() {
  await db.transaction('rw', [db.people, db.relationships, db.interactions, db.customerProfiles], async () => {
    await db.people.clear()
    await db.relationships.clear()
    await db.interactions.clear()
    await db.customerProfiles.clear()
  })

  await personStore.loadPeople()
  await relStore.loadRelationships()
  isResetConfirmOpen.value = false
  showToast('تمامی اطلاعات مخاطبان و روابط با موفقیت پاک‌سازی شد.', 'info')
}
</script>

<template>
  <div class="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-base font-bold text-slate-900 dark:text-slate-100">
        تنظیمات و ابزارهای سیستم
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        مدیریت حریم خصوصی، پشتیبان‌گیری محلی و ابری، شخصی‌سازی فیلدها و پوسته
      </p>
    </div>

    <!-- Appearance Section -->
    <div class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
          <Palette class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100">پوسته و ظاهر برنامه</h3>
          <p class="text-[11px] text-slate-400">تغییر تم روشن و تیره با استفاده از توکن‌های طراحی</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 pt-1">
        <button
          type="button"
          @click="settingsStore.setTheme('system')"
          :class="[
            'py-2 text-xs font-semibold rounded-xl border transition-all',
            settingsStore.theme === 'system'
              ? 'bg-primary-50 dark:bg-primary-950/80 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
          ]"
        >
          هماهنگ با سیستم
        </button>
        <button
          type="button"
          @click="settingsStore.setTheme('light')"
          :class="[
            'py-2 text-xs font-semibold rounded-xl border transition-all',
            settingsStore.theme === 'light'
              ? 'bg-primary-50 dark:bg-primary-950/80 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
          ]"
        >
          روشن (Light)
        </button>
        <button
          type="button"
          @click="settingsStore.setTheme('dark')"
          :class="[
            'py-2 text-xs font-semibold rounded-xl border transition-all',
            settingsStore.theme === 'dark'
              ? 'bg-primary-50 dark:bg-primary-950/80 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
          ]"
        >
          تیره (Dark)
        </button>
      </div>
    </div>

    <!-- Security & Privacy Card -->
    <div
      @click="isSecurityOpen = true"
      class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary-500 transition-all"
    >
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
          <Shield class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100">
            امنیت، رمز و اثر انگشت
          </h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            {{ authStore.securityEnabled ? 'رمز عبور و قفل خودکار فعال است' : 'حفاظت رمزی غیرفعال است' }}
          </p>
        </div>
      </div>
      <ChevronLeft class="w-5 h-5 text-slate-400" />
    </div>

    <!-- Custom Fields Card -->
    <div
      @click="isFieldsOpen = true"
      class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary-500 transition-all"
    >
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
          <Sliders class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100">
            مدیریت فیلدهای سفارشی
          </h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            تعریف فیلدهای دلخواه متنی، عددی، انتخابی یا تاریخ برای همهٔ افراد
          </p>
        </div>
      </div>
      <ChevronLeft class="w-5 h-5 text-slate-400" />
    </div>

    <!-- Backup & Exchange (Export / Import) -->
    <div
      @click="isExchangeOpen = true"
      class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary-500 transition-all"
    >
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300">
          <Database class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100">
            پشتیبان‌گیری محلی و تبادل فایل
          </h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            خروجی و ورود اطلاعات با فرمت‌های JSON رمزشده، vCard و اکسل (CSV)
          </p>
        </div>
      </div>
      <ChevronLeft class="w-5 h-5 text-slate-400" />
    </div>

    <!-- Google Drive Sync Card -->
    <div
      @click="isDriveOpen = true"
      class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between cursor-pointer hover:border-primary-500 transition-all"
    >
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
          <Cloud class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100">
            همگام‌سازی ابری Google Drive
          </h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            ذخیره خودکار در فولدر امن و ایزوله AppData گوگل بدون نیاز به سرور
          </p>
        </div>
      </div>
      <ChevronLeft class="w-5 h-5 text-slate-400" />
    </div>

    <!-- Storage Persistence Status -->
    <div class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
            <HardDrive class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-900 dark:text-slate-100">وضعیت ذخیره‌سازی محلی IndexedDB</h3>
            <p class="text-[11px] text-slate-400">
              {{
                settingsStore.storageStatus?.isPersisted
                  ? 'ذخیره‌سازی دائمی فعال است (مرورگر داده‌ها را پاک نخواهد کرد)'
                  : 'ذخیره‌سازی به صورت پیش‌فرض مرورگر است'
              }}
            </p>
          </div>
        </div>

        <button
          v-if="!settingsStore.storageStatus?.isPersisted"
          type="button"
          @click="handleRequestStorage"
          class="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 dark:bg-primary-950 hover:bg-primary-100 rounded-lg border border-primary-200 dark:border-primary-800 transition-colors"
        >
          درخواست مجوز دائمی
        </button>

        <span
          v-else
          class="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>تأیید شده</span>
        </span>
      </div>
    </div>

    <!-- Modals -->
    <SecuritySettingsModal
      :is-open="isSecurityOpen"
      @close="isSecurityOpen = false"
    />

    <FieldManagerModal
      :is-open="isFieldsOpen"
      @close="isFieldsOpen = false"
    />

    <ImportExportModal
      :is-open="isExchangeOpen"
      @close="isExchangeOpen = false"
    />

    <DriveSyncModal
      :is-open="isDriveOpen"
      @close="isDriveOpen = false"
    />

    <ConfirmModal
      :is-open="isResetConfirmOpen"
      title="پاک‌سازی کامل اطلاعات"
      message="آیا مطمئن هستید؟ تمامی مخاطبان، روابط و یادداشت‌ها از پایگاه داده دستگاه پاک خواهند شد."
      confirm-text="پاک‌سازی کامل"
      :is-danger="true"
      @cancel="isResetConfirmOpen = false"
      @confirm="handleClearAllData"
    />
  </div>
</template>
