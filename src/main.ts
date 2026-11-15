import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from '@/core/router'
import { useSettingsStore } from '@/core/stores/settings.store'
import { tmdbService } from '@/modules/catalog/services/tmdb.service'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Al cambiar de ruta, lo que quedo en vuelo ya no importa: cancelarlo evita que
// una respuesta vieja pise el estado de la vista nueva.
router.afterEach(() => tmdbService.abortAll())

// Aplica tema y preferencias guardadas antes de montar (evita parpadeo).
useSettingsStore(pinia).init()

app.mount('#app')
