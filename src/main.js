import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fortawesome/fontawesome-free/css/all.css'
import './scss/theme.scss'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
