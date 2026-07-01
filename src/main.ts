import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'
import { setupApiInterceptors } from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import '@/style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

setupApiInterceptors(
  () => useAuthStore().token,
  () => {
    const auth = useAuthStore()
    if (auth.isCentralSession) {
      return null
    }

    return auth.activeTenant?.slug ?? null
  },
  () => {
    const auth = useAuthStore()
    const loginRoute = auth.isCentralSession ? 'login-central' : 'login'
    auth.clearSession()
    router.push({ name: loginRoute })
  },
  () => {
    const auth = useAuthStore()
    auth.clearSession()
    router.push({
      name: 'login',
      query: { reason: 'tenant-token-mismatch' },
    })
  },
)

app.use(router)
app.mount('#app')

const auth = useAuthStore()
if (auth.isAuthenticated) {
  void auth.bootstrapSession()
}
