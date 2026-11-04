<script setup lang="ts">
import { ref } from 'vue'
import { usePersonStore } from '@/stores/usePersonStore'
import { localBackupService } from '@/services/backup/LocalBackupService'
import { vCardService } from '@/services/exchange/VCardService'
import { csvService } from '@/services/exchange/CsvService'
import { duplicateDetector, type DuplicateMatch } from '@/services/exchange/DuplicateDetector'
import Modal from '@/components/common/Modal.vue'
import { showToast } from '@/components/common/ToastContainer.vue'
import {
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-vue-next'
import { toPersianDigits } from '@/utils/format'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const personStore = usePersonStore()

const activeTab = ref<'export' | 'import'>('export')
const encryptExport = ref(false)
const exportPassword = ref('')

// Import state
const importFormat = ref<'json' | 'vcard' | 'csv'>('json')
const importPassword = ref('')
const selectedFile = ref<File | null>(null)
const isAnalyzing = ref(false)
const parsedIncoming = ref<any[]>([])
const duplicateMatches = ref<DuplicateMatch[]>([])
const previewReady = ref(false)

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function handleExportJson() {
  try {
    const password = encryptExport.value ? exportPassword.value : undefined
    if (encryptExport.value && (!password || password.length < 4)) {
      showToast('رمز عبور باید حداقل ۴ کاراکتر باشد.', 'error')
      return
    }
    const blob = await localBackupService.exportBackup(password)
    const suffix = encryptExport.value ? 'encrypted.json' : 'plain.json'
    downloadBlob(blob, `personal-crm-backup-${new Date().toISOString().slice(0, 10)}.${suffix}`)
    showToast('فایل پشتیبان JSON با موفقیت دریافت شد.', 'success')
  } catch (err: any) {
    showToast(err.message || 'خطا در خروجی گرفتن', 'error')
  }
}

function handleExportVCard() {
  try {
    const vcardText = vCardService.exportToVCard(personStore.people)
    const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8;' })
    downloadBlob(blob, `contacts-${new Date().toISOString().slice(0, 10)}.vcf`)
    showToast('فایل vCard با موفقیت دانلود شد.', 'success')
  } catch (err: any) {
    showToast(err.message, 'error')
  }
}

function handleExportCsv() {
  try {
    const blob = csvService.exportToCsv(personStore.people)
    downloadBlob(blob, `contacts-${new Date().toISOString().slice(0, 10)}.csv`)
    showToast('فایل اکسل (CSV) با موفقیت دانلود شد.', 'success')
  } catch (err: any) {
    showToast(err.message, 'error')
  }
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]
    previewReady.value = false
    parsedIncoming.value = []
    duplicateMatches.value = []
  }
}

async function handleAnalyzeImport() {
  if (!selectedFile.value) return
  isAnalyzing.value = true

  try {
    const text = await selectedFile.value.text()

    if (importFormat.value === 'json') {
      const inspection = await localBackupService.inspectBackup(text)
      if (!inspection.isValid) {
        throw new Error(inspection.errorMessage || 'فایل نامعتبر است.')
      }

      if (inspection.isEncrypted && !importPassword.value) {
        showToast('این فایل رمزشده است؛ لطفاً رمز آن را وارد کنید.', 'error')
        isAnalyzing.value = false
        return
      }

      // If plain or inspected, run restore directly or inspect
      parsedIncoming.value = inspection.payload?.people || []
      duplicateMatches.value = duplicateDetector.findDuplicates(
        parsedIncoming.value,
        personStore.people
      )
      previewReady.value = true
    } else if (importFormat.value === 'vcard') {
      const parsed = vCardService.parseVCard(text)
      parsedIncoming.value = parsed
      duplicateMatches.value = duplicateDetector.findDuplicates(parsed, personStore.people)
      previewReady.value = true
    } else if (importFormat.value === 'csv') {
      const parsed = csvService.parseCsv(text)
      parsedIncoming.value = parsed
      duplicateMatches.value = duplicateDetector.findDuplicates(parsed, personStore.people)
      previewReady.value = true
    }
  } catch (err: any) {
    showToast(err.message || 'خطا در تحلیل فایل ورودی', 'error')
  } finally {
    isAnalyzing.value = false
  }
}

async function handleConfirmImport() {
  if (!selectedFile.value) return

  try {
    const text = await selectedFile.value.text()

    if (importFormat.value === 'json') {
      await localBackupService.restoreBackup(text, importPassword.value || undefined)
      await personStore.loadPeople()
      showToast('بازیابی کامل پایگاه داده با موفقیت انجام شد.', 'success')
    } else {
      // Add parsed people
      for (const item of parsedIncoming.value) {
        await personStore.addPerson({
          name: item.name || 'مخاطب',
          phones: item.phones || [],
          emails: item.emails || [],
          tags: item.tags || [],
          notes: item.notes || '',
          customFields: item.customFields || {},
        })
      }
      showToast(`${toPersianDigits(parsedIncoming.value.length)} مخاطب با موفقیت افزوده شدند.`, 'success')
    }

    emit('close')
  } catch (err: any) {
    showToast(err.message || 'خطا در ورود داده‌ها', 'error')
  }
}
</script>

<template>
  <Modal :is-open="isOpen" title="ورود و خروج اطلاعات (Backup & Exchange)" max-width="lg" @close="emit('close')">
    <div class="space-y-4 py-1">
      <!-- Tabs -->
      <div class="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          type="button"
          @click="activeTab = 'export'"
          :class="[
            'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
            activeTab === 'export'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
          ]"
        >
          خروجی گرفتن (Export)
        </button>
        <button
          type="button"
          @click="activeTab = 'import'"
          :class="[
            'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
            activeTab === 'import'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
          ]"
        >
          ورود اطلاعات (Import)
        </button>
      </div>

      <!-- Export Panel -->
      <div v-if="activeTab === 'export'" class="space-y-4">
        <!-- JSON Full Backup -->
        <div class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">
                پشتیبان کامل JSON (مخاطبان + روابط + فیلدها)
              </h4>
              <p class="text-[11px] text-slate-400">
                شامل تمام داده‌ها و گراف، مناسب برای انتقال بین دستگاه‌ها یا نگهداری ایمن.
              </p>
            </div>
          </div>

          <div class="space-y-2 pt-1">
            <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                v-model="encryptExport"
                type="checkbox"
                class="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>رمزنگاری با الگوریتم AES-GCM (نیازمند تعیین رمز عبور)</span>
            </label>

            <input
              v-if="encryptExport"
              v-model="exportPassword"
              type="password"
              placeholder="رمز عبور برای رمزنگاری فایل..."
              class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="button"
            @click="handleExportJson"
            class="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 rounded-lg shadow-xs transition-all active:scale-95"
          >
            <Download class="w-4 h-4" />
            <span>دانلود پشتیبان کامل JSON</span>
          </button>
        </div>

        <!-- vCard & CSV -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- vCard -->
          <div class="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <div class="flex items-center gap-2 text-primary-700 dark:text-primary-400">
              <FileText class="w-4 h-4" />
              <h5 class="text-xs font-bold">فایل مخاطبان vCard (.vcf)</h5>
            </div>
            <p class="text-[11px] text-slate-400">
              قابل انتقال به دفترچه تلفن گوشی‌های اندروید و آیفون یا گوگل کانتکتس.
            </p>
            <button
              type="button"
              @click="handleExportVCard"
              class="w-full py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
            >
              خروجی vCard
            </button>
          </div>

          <!-- CSV -->
          <div class="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <div class="flex items-center gap-2 text-emerald-600">
              <FileSpreadsheet class="w-4 h-4" />
              <h5 class="text-xs font-bold">فایل اکسل (CSV با UTF-8)</h5>
            </div>
            <p class="text-[11px] text-slate-400">
              سازگار با اکسل فارسی، شامل ستون‌های مشخصات و تماس.
            </p>
            <button
              type="button"
              @click="handleExportCsv"
              class="w-full py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition-colors"
            >
              خروجی CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Import Panel -->
      <div v-if="activeTab === 'import'" class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-800 dark:text-slate-200">فرمت فایل ورودی</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="importFormat = 'json'"
              :class="[
                'py-1.5 text-xs font-semibold rounded-lg border transition-all',
                importFormat === 'json'
                  ? 'bg-primary-50 dark:bg-primary-950 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
              ]"
            >
              پشتیبان JSON
            </button>
            <button
              type="button"
              @click="importFormat = 'vcard'"
              :class="[
                'py-1.5 text-xs font-semibold rounded-lg border transition-all',
                importFormat === 'vcard'
                  ? 'bg-primary-50 dark:bg-primary-950 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
              ]"
            >
              مخاطبین vCard
            </button>
            <button
              type="button"
              @click="importFormat = 'csv'"
              :class="[
                'py-1.5 text-xs font-semibold rounded-lg border transition-all',
                importFormat === 'csv'
                  ? 'bg-primary-50 dark:bg-primary-950 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
              ]"
            >
              جدول CSV
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-800 dark:text-slate-200">انتخاب فایل از دستگاه</label>
          <input
            type="file"
            @change="handleFileChange"
            :accept="importFormat === 'json' ? '.json' : importFormat === 'vcard' ? '.vcf' : '.csv'"
            class="w-full text-xs text-slate-500 file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 dark:file:bg-primary-950 dark:file:text-primary-300 hover:file:bg-primary-100"
          />
        </div>

        <div v-if="importFormat === 'json'" class="space-y-1">
          <label class="text-xs font-bold text-slate-800 dark:text-slate-200">
            رمز عبور (فقط در صورتی که فایل رمزشده باشد)
          </label>
          <input
            v-model="importPassword"
            type="password"
            placeholder="رمز فایل پشتیبان..."
            class="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          type="button"
          :disabled="!selectedFile || isAnalyzing"
          @click="handleAnalyzeImport"
          class="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 rounded-lg shadow-xs transition-all"
        >
          <Upload class="w-4 h-4" />
          <span>{{ isAnalyzing ? 'در حال بررسی فایل...' : 'بررسی و پیش‌نمایش فایل' }}</span>
        </button>

        <!-- Preview & Duplicate Detection -->
        <div v-if="previewReady" class="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-800 dark:text-slate-200">تعداد مخاطبان شناسایی‌شده:</span>
            <span class="font-bold text-primary-700">{{ toPersianDigits(parsedIncoming.length) }} مورد</span>
          </div>

          <!-- Duplicates warning -->
          <div
            v-if="duplicateMatches.length > 0"
            class="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-1"
          >
            <div class="flex items-center gap-1.5 font-bold">
              <AlertTriangle class="w-4 h-4 text-amber-600" />
              <span>{{ toPersianDigits(duplicateMatches.length) }} مخاطب مشابه/تکراری شناسایی شد!</span>
            </div>
            <p class="text-[11px] text-amber-700 dark:text-amber-400">
              (مطابقت بر اساس شماره تلفن، ایمیل یا نام یکسان با مخاطبان موجود)
            </p>
          </div>

          <button
            type="button"
            @click="handleConfirmImport"
            class="w-full py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
          >
            تأیید و اعمال اطلاعات در سیستم
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>
