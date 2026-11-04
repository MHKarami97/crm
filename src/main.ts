import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/style.css'
import { registerSW } from 'virtual:pwa-register'
import { usePwaStore } from './stores/usePwaStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize PWA Service Worker Registration
const updateSW = registerSW({
  onNeedRefresh() {
    const pwaStore = usePwaStore()
    pwaStore.registerUpdateHandler(async () => {
      await updateSW(true)
    })
  },
  onOfflineReady() {
    console.log('App is ready to work offline.')
  },
})

app.mount('#app')
