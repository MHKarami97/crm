<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCloudSyncStore } from '@/stores/useCloudSyncStore'
import { usePersonStore } from '@/stores/usePersonStore'
import Modal from '@/components/common/Modal.vue'
import { showToast } from '@/components/common/ToastContainer.vue'
import {
  Cloud,
  CloudUpload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-vue-next'
import { toPersianDigits, formatShamsiDate } from '@/utils/jalali'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const cloudSyncStore = useCloudSyncStore()
const personStore = usePersonStore()

const backupPassphrase = ref('')
const restorePassphrase = ref('')
const selectedRemoteId = ref<string | null>(null)

onMounted(async () => {
  await cloudSyncStore.checkAuth()
  if (cloudSyncStore.isAuthorized) {
    await cloudSyncStore.listBackups()
  }
})

async function handleConnect() {
  const ok = await cloudSyncStore.connectGoogle('interactive')
  if (ok) {
    showToast('اتصال به حساب گوگل با موفقیت برقرار شد.', 'success')
  } else if (cloudSyncStore.errorMessage) {
    showToast(cloudSyncStore.errorMessage, 'error')
  }
}

async function handleDisconnect() {
  await cloudSyncStore.disconnectGoogle()
  showToast('اتصال گوگل درایو قطع شد.', 'info')
}

async function handleUpload() {
  const ok = await cloudSyncStore.uploadBackup(backupPassphrase.value || undefined)
  if (ok) {
    showToast('نسخه پشتیبان در فضای امن Google Drive ذخیره شد.', 'success')
    backupPassphrase.value = ''
  } else if (cloudSyncStore.errorMessage) {
    showToast(cloudSyncStore.errorMessage, 'error')
  }
}

async function handleRestore(fileId: string) {
  selectedRemoteId.value = fileId
  const ok = await cloudSyncStore.restoreFromRemote(fileId, restorePassphrase.value || undefined)
  if (ok) {
    await personStore.loadPeople()
    showToast('اطلاعات با موفقیت از گوگل درایو بازیابی شد.', 'success')
    emit('close')
  } else if (cloudSyncStore.errorMessage) {
    showToast(cloudSyncStore.errorMessage, 'error')
  }
}
</script>

<template>
  <Modal :is-open="isOpen" title="پشتیبان‌گیری ابری Google Drive" max-width="md" @close="emit('close')">
    <div class="space-y-4 py-2">
      <!-- Status Card -->
      <div
        class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700"
      >
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
            <Cloud class="w-6 h-6" />
          </div>
          <div>
            <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
              {{ cloudSyncStore.isAuthorized ? 'متصل به حساب گوگل' : 'عدم اتصال به گوگل درایو' }}
            </span>
            <p class="text-[11px] text-slate-400 mt-0.5">
              ذخیره‌سازی در دایرکتوری ایزوله AppData (بدون دسترسی به سایر فایل‌ها)
            </p>
          </div>
        </div>

        <button
          v-if="!cloudSyncStore.isAuthorized"
          type="button"
          :disabled="cloudSyncStore.isSyncing"
          @click="handleConnect"
          class="px-3.5 py-1.5 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 rounded-lg shadow-xs transition-all"
        >
          {{ cloudSyncStore.isSyncing ? 'در حال اتصال...' : 'اتصال به گوگل' }}
        </button>

        <button
          v-else
          type="button"
          @click="handleDisconnect"
          class="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium"
        >
          قطع اتصال
        </button>
      </div>

      <!-- Upload New Backup Section -->
      <div v-if="cloudSyncStore.isAuthorized" class="space-y-3 p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
        <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <CloudUpload class="w-4 h-4 text-primary-600" />
          <span>تهیه و ارسال نسخه پشتیبان جدید</span>
        </h4>

        <div class="space-y-1">
          <label class="text-[11px] font-bold text-slate-500">رمز عبور رمزنگاری ابری (اختیاری)</label>
          <input
            v-model="backupPassphrase"
            type="password"
            placeholder="برای امنیت مضاعف، رمز عبور وارد کنید..."
            class="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          type="button"
          :disabled="cloudSyncStore.isSyncing"
          @click="handleUpload"
          class="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 rounded-lg shadow-xs transition-all"
        >
          <CloudUpload class="w-4 h-4" />
          <span>{{ cloudSyncStore.isSyncing ? 'در حال ارسال...' : 'ارسال پشتیبان به Google Drive' }}</span>
        </button>
      </div>

      <!-- Remote Backups List -->
      <div v-if="cloudSyncStore.isAuthorized" class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">
            نسخه‌های موجود در درایو (۳ نسخه اخیر)
          </h4>
          <button
            type="button"
            @click="cloudSyncStore.listBackups"
            class="text-[11px] text-primary-700 hover:underline"
          >
            بروزرسانی لیست
          </button>
        </div>

        <div v-if="cloudSyncStore.remoteBackups.length > 0" class="space-y-2">
          <div
            v-for="bkp in cloudSyncStore.remoteBackups"
            :key="bkp.id"
            class="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="space-y-0.5">
              <span class="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                {{ formatShamsiDate(bkp.modifiedTime) }}
              </span>
              <span class="text-[10px] text-slate-400 font-mono">
                {{ bkp.name }}
              </span>
            </div>

            <button
              type="button"
              :disabled="cloudSyncStore.isSyncing"
              @click="handleRestore(bkp.id)"
              class="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/80 hover:bg-primary-100 rounded-lg border border-primary-200 dark:border-primary-800 transition-colors"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>بازیابی</span>
            </button>
          </div>
        </div>
        <p v-else class="text-xs text-slate-400 py-3 text-center">
          هنوز نسخه‌ای در گوگل درایو بارگذاری نشده است.
        </p>
      </div>
    </div>
  </Modal>
</template>
