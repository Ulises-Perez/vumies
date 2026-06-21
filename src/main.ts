import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from '@/core/router'
import { useSettingsStore } from '@/core/stores/settings.store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Aplica tema y preferencias guardadas antes de montar (evita parpadeo).
useSettingsStore(pinia).init()

app.mount('#app')
