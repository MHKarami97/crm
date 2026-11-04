<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useFieldStore } from '@/stores/useFieldStore'
import { usePersonStore } from '@/stores/usePersonStore'
import { useRelationshipStore } from '@/stores/useRelationshipStore'
import { usePwaStore } from '@/stores/usePwaStore'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import LockScreenModal from '@/components/auth/LockScreenModal.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import RemindersModal from '@/components/reminders/RemindersModal.vue'
import PersonDetailSheet from '@/components/people/PersonDetailSheet.vue'
import type { Person } from '@/domain/models'

const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const fieldStore = useFieldStore()
const personStore = usePersonStore()
const relStore = useRelationshipStore()
const pwaStore = usePwaStore()

const isRemindersOpen = ref(false)
const selectedCelebrationPerson = ref<Person | null>(null)
const isCelebrationDetailOpen = ref(false)

onMounted(async () => {
  pwaStore.initPwa()
  await settingsStore.loadSettings()
  await authStore.initAuth()
  await fieldStore.loadFields()
  await personStore.loadPeople()
  await relStore.loadRelationships()

  // First user interaction triggers storage persistence
  const handleFirstInteraction = async () => {
    window.removeEventListener('click', handleFirstInteraction)
    window.removeEventListener('keydown', handleFirstInteraction)
    await settingsStore.requestStoragePersistence()
  }

  window.addEventListener('click', handleFirstInteraction, { once: true })
  window.addEventListener('keydown', handleFirstInteraction, { once: true })
})

function handleSelectCelebrationPerson(personId: string) {
  const p = personStore.people.find((x) => x.id === personId)
  if (p) {
    selectedCelebrationPerson.value = p
    isCelebrationDetailOpen.value = true
  }
}
</script>

<template>
  <div class="min-h-screen-dvh flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
    <!-- Header -->
    <AppHeader @open-reminders="isRemindersOpen = true" />

    <!-- Main View with Router Transition -->
    <main class="flex-1 flex flex-col w-full">
      <router-view v-slot="{ Component }">
        <transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Bottom Navigation for mobile & desktop -->
    <BottomNav />

    <!-- PWA Update Notification Banner -->
    <div
      v-if="pwaStore.needRefresh"
      class="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-8 z-50 p-3 bg-primary-800 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs"
    >
      <span>نسخه جدیدی از برنامه در دسترس است.</span>
      <button
        type="button"
        @click="pwaStore.applyUpdate"
        class="px-3 py-1 font-bold bg-white text-primary-900 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
      >
        بروزرسانی
      </button>
    </div>

    <!-- Lock Screen Modal when protected -->
    <LockScreenModal />

    <!-- Global Toast Container -->
    <ToastContainer />

    <!-- Reminders Modal -->
    <RemindersModal
      :is-open="isRemindersOpen"
      @close="isRemindersOpen = false"
      @select-person="handleSelectCelebrationPerson"
    />

    <!-- Quick Person Detail when opened from reminders -->
    <PersonDetailSheet
      :is-open="isCelebrationDetailOpen"
      :person="selectedCelebrationPerson"
      @close="isCelebrationDetailOpen = false"
      @edit="isCelebrationDetailOpen = false; router.push('/people')"
      @archive="isCelebrationDetailOpen = false"
      @delete="isCelebrationDetailOpen = false"
      @add-relation="isCelebrationDetailOpen = false"
      @select-person="(id) => {
        const p = personStore.people.find(x => x.id === id)
        if (p) selectedCelebrationPerson = p
      }"
    />
  </div>
</template>
