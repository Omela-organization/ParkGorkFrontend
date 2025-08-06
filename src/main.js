import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import App from '@/App.vue'
import '@/assets/main.css'
import { useAuth } from '@/stores/auth.js'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const auth = useAuth()
  await auth.init()

  await import('@/router/guards')

  app.use(router)

  await router.isReady()
  app.mount('#app')
}

bootstrap()
