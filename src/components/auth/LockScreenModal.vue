<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { Lock, Fingerprint, KeyRound, AlertCircle } from 'lucide-vue-next'
import { toPersianDigits } from '@/utils/format'

const authStore = useAuthStore()

const passcodeInput = ref('')
const recoveryInput = ref('')
const newPassInput = ref('')
const isRecovering = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleUnlock() {
  if (!passcodeInput.value) return
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const success = await authStore.unlockWithPasscode(passcodeInput.value)
    if (!success) {
      errorMessage.value = 'رمز عبور اشتباه است.'
      passcodeInput.value = ''
    }
  } catch (err: any) {
    errorMessage.value = err.message
  } finally {
    isSubmitting.value = false
  }
}

async function handleBiometricUnlock() {
  errorMessage.value = ''
  const ok = await authStore.unlockWithBiometric()
  if (!ok) {
    errorMessage.value = 'احراز هویت بیومتریک تأیید نشد.'
  }
}

async function handleRecover() {
  if (!recoveryInput.value || !newPassInput.value) return
  errorMessage.value = ''
  const ok = await authStore.recoverWithKey(recoveryInput.value, newPassInput.value)
  if (ok) {
    isRecovering.value = false
    recoveryInput.value = ''
    newPassInput.value = ''
  } else {
    errorMessage.value = 'کلید بازیابی نامعتبر است.'
  }
}
</script>

<template>
  <div
    v-if="authStore.isLocked"
    class="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4"
  >
    <div
      class="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5"
    >
      <!-- Lock Icon -->
      <div
        class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 mx-auto flex items-center justify-center shadow-inner"
      >
        <Lock class="w-8 h-8" :stroke-width="1.75" />
      </div>

      <div>
        <h2 class="text-base font-bold text-slate-900 dark:text-slate-100">
          سامانه قفل است
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          برای دسترسی به اطلاعات شخصی و شبکه ارتباطات، قفل را باز کنید.
        </p>
      </div>

      <!-- Cooldown warning -->
      <div
        v-if="authStore.isCooldownActive"
        class="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium"
      >
        تعداد دفعات اشتباه بیش از حد بود. لطفاً
        {{ toPersianDigits(authStore.remainingCooldownSeconds) }} ثانیه دیگر صبر کنید.
      </div>

      <!-- Error message -->
      <div
        v-if="errorMessage && !authStore.isCooldownActive"
        class="flex items-center gap-1.5 p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium text-right"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Normal Passcode Input -->
      <form
        v-if="!isRecovering"
        @submit.prevent="handleUnlock"
        class="space-y-4"
      >
        <input
          v-model="passcodeInput"
          type="password"
          autofocus
          :disabled="authStore.isCooldownActive || isSubmitting"
          placeholder="رمز عبور خود را وارد کنید..."
          class="w-full px-4 py-2.5 text-center text-sm tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        />

        <div class="flex items-center gap-2">
          <button
            type="submit"
            :disabled="authStore.isCooldownActive || isSubmitting || !passcodeInput"
            class="flex-1 py-2.5 text-xs font-bold text-white bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            ورود به برنامه
          </button>

          <!-- Biometric Button -->
          <button
            v-if="authStore.biometricEnabled"
            type="button"
            @click="handleBiometricUnlock"
            class="p-2.5 text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-100 transition-colors"
            title="ورود با اثر انگشت یا چهره"
          >
            <Fingerprint class="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          @click="isRecovering = true; errorMessage = ''"
          class="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline pt-2 block mx-auto"
        >
          رمز خود را فراموش کرده‌اید؟ (کلید بازیابی)
        </button>
      </form>

      <!-- Emergency Recovery Form -->
      <form
        v-else
        @submit.prevent="handleRecover"
        class="space-y-3 text-right"
      >
        <div class="space-y-1">
          <label class="text-[11px] font-bold text-slate-500">کلید بازیابی اضطراری (۳۲ کاراکتر)</label>
          <input
            v-model="recoveryInput"
            type="text"
            dir="ltr"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            class="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="space-y-1">
          <label class="text-[11px] font-bold text-slate-500">رمز عبور جدید</label>
          <input
            v-model="newPassInput"
            type="password"
            placeholder="حداقل ۴ کاراکتر..."
            class="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button
            type="button"
            @click="isRecovering = false"
            class="flex-1 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            انصراف
          </button>
          <button
            type="submit"
            :disabled="!recoveryInput || !newPassInput"
            class="flex-1 py-2 text-xs font-bold text-white bg-accent-600 hover:bg-accent-500 rounded-xl shadow-sm transition-all"
          >
            بازیابی و بازنشانی
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
