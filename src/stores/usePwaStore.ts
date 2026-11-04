import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePwaStore = defineStore('pwa', () => {
  const isOnline = ref<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const needRefresh = ref<boolean>(false)
  const updateSW = ref<(() => Promise<void>) | null>(null)

  function initPwa() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        isOnline.value = true
      })
      window.addEventListener('offline', () => {
        isOnline.value = false
      })
    }
  }

  function registerUpdateHandler(fn: () => Promise<void>) {
    updateSW.value = fn
    needRefresh.value = true
  }

  async function applyUpdate() {
    if (updateSW.value) {
      await updateSW.value()
    }
  }

  return {
    isOnline,
    needRefresh,
    initPwa,
    registerUpdateHandler,
    applyUpdate,
  }
})
