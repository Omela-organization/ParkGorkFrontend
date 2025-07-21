import router from '@/router/index.js'
import { useAuth } from '@/stores/auth.js'

router.beforeEach((to, _from, next) => {
  const { role } = useAuth()
  const allowed = to.meta.roles || []
  if (allowed.length && !allowed.includes(role)) {
    return next({ name: 'NotFound' })
  }
  next()
})
