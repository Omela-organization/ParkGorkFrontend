import router from '@/router'
import { useAuth } from '@/stores/auth'

const landing = { admin: 'AdminPanel', ecologist: 'EcoAnalysis', pr: 'Users' }

let triedBootstrap = false

router.beforeEach(async (to) => {
  const auth = useAuth()

  // 0) если в сторах есть токен, но нет пользователя/роли — дотягиваем их один раз
  if (auth.accessToken && (!auth.user || !auth.userRole) && !triedBootstrap) {
    triedBootstrap = true
    try {
      await auth.fetchUserAndRole()
    } catch (e) {
      console.warn('[guard] bootstrap failed, logout', e)
      auth.logout()
    }
  }

  // 0.1) страхуемся от зависания: токен есть, роль так и "guest" → выходим в логин
  if (auth.isAuth && auth.role === 'guest' && to.name !== 'Login') {
    auth.logout()
    return { name: 'Login' }
  }

  // 1) '/' → домашняя страница роли
  if (to.name === 'HomeByRole') {
    return { name: landing[auth.role] ?? 'Login' }
  }

  // 2) гость идёт не на /login
  if (!auth.isAuth && to.name !== 'Login') {
    return { name: 'Login' }
  }

  // 3) залогинен и пытается открыть /login
  if (auth.isAuth && to.meta.guestOnly) {
    return { name: landing[auth.role] ?? 'Login' }
  }

  // 4) нет доступа по ролям
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'Forbidden' }
  }
})
