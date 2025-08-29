import router from '@/router'
import { useAuth } from '@/stores/auth'

const landing = { admin: 'AdminPanel', ecologist: 'EcoAnalysis', pr: 'Users' }

let triedBootstrap = false

router.beforeEach(async (to) => {
  const auth = useAuth()

  if (auth.accessToken && (!auth.user || !auth.userRole) && !triedBootstrap) {
    triedBootstrap = true
    try {
      await auth.fetchUserAndRole()
    } catch (e) {
      console.warn('[guard] bootstrap failed, logout', e)
      auth.logout()
    }
  }

  if (auth.isAuth && auth.role === 'guest' && to.name !== 'Login') {
    auth.logout()
    return { name: 'Login' }
  }

  if (to.name === 'HomeByRole') {
    return { name: landing[auth.role] ?? 'Login' }
  }

  if (!auth.isAuth && to.name !== 'Login') {
    return { name: 'Login' }
  }

  if (auth.isAuth && to.meta.guestOnly) {
    return { name: landing[auth.role] ?? 'Login' }
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'Forbidden' }
  }
})
