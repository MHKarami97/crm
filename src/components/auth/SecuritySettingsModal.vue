<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import Modal from '@/components/common/Modal.vue'
import { showToast } from '@/components/common/ToastContainer.vue'
import {
  ShieldCheck,
  Fingerprint,
  KeyRound,
  AlertTriangle,
  Clock,
  Check,
  Copy,
} from 'lucide-vue-next'
import { toPersianDigits } from '@/utils/format'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const newPasscode = ref('')
const confirmPasscode = ref('')
const generatedRecoveryKey = ref<string | null>(null)
const keyCopied = ref(false)

async function handleSetPasscode() {
  if (newPasscode.value.length < 4) {
    showToast('رمز عبور باید حداقل ۴ کاراکتر باشد.', 'error')
    return
  }
  if (newPasscode.value !== confirmPasscode.value) {
    showToast('رمز عبور و تکرار آن یکسان نیستند.', 'error')
    return
  }

  const recKey = await authStore.setPasscode(newPasscode.value)
  generatedRecoveryKey.value = recKey
  newPasscode.value = ''
  confirmPasscode.value = ''
  showToast('رمز عبور با موفقیت تنظیم و فعال شد.', 'success')
}

async function handleToggleBiometric() {
  try {
    if (authStore.biometricEnabled) {
      await authStore.disableBiometric()
      showToast('ورود بیومتریک غیرفعال شد.', 'info')
    } else {
      await authStore.enableBiometric()
      showToast('اثر انگشت / بیومتریک با موفقیت ثبت شد.', 'success')
    }
  } catch (err: any) {
    showToast(err.message || 'خطا در ثبت بیومتریک', 'error')
  }
}

function copyRecoveryKey() {
  if (!generatedRecoveryKey.value) return
  navigator.clipboard.writeText(generatedRecoveryKey.value)
  keyCopied.value = true
  setTimeout(() => (keyCopied.value = false), 2500)
  showToast('کلید بازیابی در کلیپ‌بورد کپی شد.', 'success')
}

async function handleDisableSecurity() {
  await authStore.disableSecurity()
  generatedRecoveryKey.value = null
  showToast('قفل امنیتی برنامه غیرفعال شد.', 'info')
}

async function updateAutoLock(mins: number) {
  await settingsStore.updateSetting('autoLockMinutes', mins)
  showToast(`زمان قفل خودکار روی ${toPersianDigits(mins)} دقیقه تنظیم شد.`, 'success')
}
</script>

<template>
  <Modal :is-open="isOpen" title="تنظیمات امنیت و حریم خصوصی" max-width="md" @close="emit('close')">
    <div class="space-y-5 py-2">
      <!-- Status Badge -->
      <div
        :class="[
          'flex items-center gap-3 p-3.5 rounded-2xl border',
          authStore.securityEnabled
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
        ]"
      >
        <ShieldCheck class="w-6 h-6 shrink-0" />
        <div class="text-xs">
          <p class="font-bold">
            {{ authStore.securityEnabled ? 'حفاظت امنیتی فعال است' : 'حفاظت امنیتی غیرفعال است' }}
          </p>
          <p class="text-[11px] opacity-80 mt-0.5">
            {{
              authStore.securityEnabled
                ? 'داده‌ها به صورت محلی حفاظت شده و نیاز به رمز یا اثر انگشت دارند.'
                : 'هر شخصی به این دستگاه دسترسی داشته باشد می‌تواند اطلاعات را مشاهده کند.'
            }}
          </p>
        </div>
      </div>

      <!-- Set / Change Passcode -->
      <div class="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700">
        <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <KeyRound class="w-4 h-4 text-primary-600" />
          <span>{{ authStore.hasPasscode ? 'تغییر رمز عبور' : 'تنظیم رمز عبور جدید' }}</span>
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            v-model="newPasscode"
            type="password"
            placeholder="رمز عبور جدید..."
            class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            v-model="confirmPasscode"
            type="password"
            placeholder="تکرار رمز عبور..."
            class="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          type="button"
          :disabled="!newPasscode || !confirmPasscode"
          @click="handleSetPasscode"
          class="w-full py-2 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 disabled:opacity-50 rounded-lg shadow-xs transition-all"
        >
          {{ authStore.hasPasscode ? 'ثبت و تغییر رمز' : 'فعال‌سازی رمز' }}
        </button>
      </div>

      <!-- Generated Recovery Key Warning Card -->
      <div
        v-if="generatedRecoveryKey"
        class="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2 text-right"
      >
        <div class="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
          <AlertTriangle class="w-4 h-4 text-amber-600" />
          <span>هشدار مهم: کلید بازیابی اضطراری</span>
        </div>
        <p class="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
          فراموشی رمز یعنی از دست رفتن قطعی داده‌ها. لطفاً کلید زیر را در محلی امن یادداشت کنید:
        </p>

        <div class="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 font-mono text-xs text-slate-900 dark:text-slate-100 select-all" dir="ltr">
          <span class="font-bold tracking-wider">{{ generatedRecoveryKey }}</span>
          <button
            type="button"
            @click="copyRecoveryKey"
            class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <Check v-if="keyCopied" class="w-4 h-4 text-emerald-600" />
            <Copy v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Biometric Option -->
      <div
        v-if="authStore.biometricAvailable && authStore.securityEnabled"
        class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700"
      >
        <div class="flex items-center gap-2.5">
          <Fingerprint class="w-5 h-5 text-primary-600" />
          <div>
            <span class="text-xs font-bold text-slate-900 dark:text-slate-100">
              ورود با اثر انگشت / چهره (WebAuthn)
            </span>
            <p class="text-[11px] text-slate-400">
              باز کردن سریع قفل با حسگر بیومتریک دستگاه
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="handleToggleBiometric"
          :class="[
            'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all',
            authStore.biometricEnabled
              ? 'bg-primary-50 dark:bg-primary-950 border-primary-500 text-primary-700 dark:text-primary-300 font-bold'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
          ]"
        >
          {{ authStore.biometricEnabled ? 'فعال' : 'غیرفعال' }}
        </button>
      </div>

      <!-- Auto Lock Delay -->
      <div v-if="authStore.securityEnabled" class="space-y-2">
        <label class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Clock class="w-4 h-4 text-slate-400" />
          <span>قفل خودکار بعد از بی‌فعالیتی</span>
        </label>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="mins in [1, 5, 15, 30]"
            :key="mins"
            type="button"
            @click="updateAutoLock(mins)"
            :class="[
              'py-1.5 text-xs font-semibold rounded-lg border transition-all',
              settingsStore.autoLockMinutes === mins
                ? 'bg-primary-700 border-primary-700 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
            ]"
          >
            {{ toPersianDigits(mins) }} دقیقه
          </button>
        </div>
      </div>

      <!-- Disable Security Completely -->
      <div v-if="authStore.securityEnabled" class="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          @click="handleDisableSecurity"
          class="w-full py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
        >
          غیرفعال کردن کامل قفل امنیتی
        </button>
      </div>
    </div>
  </Modal>
</template>
