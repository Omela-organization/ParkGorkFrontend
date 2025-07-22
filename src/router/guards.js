import router from '@/router'
import { useAuth } from '@/stores/auth'

const landing = { admin: 'AdminPanel', ecologist: 'EcoAnalysis', pr: 'Users' }

router.beforeEach((to) => {
  const auth = useAuth()
  console.log('[guard]', to.name, 'isAuth:', auth.isAuth, 'role:', auth.role, auth.user);
  // 1)  '/' => домашняя страница роли
  if (to.name === 'HomeByRole') {
    return { name: landing[auth.role] ?? 'Login' }
  }

  // 2)  гость пытается попасть куда-то кроме /login
  if (!auth.isAuth && to.name !== 'Login') {
    return { name: 'Login' }
  }

  // 3)  залогинен и пытается открыть /login
  if (auth.isAuth && to.meta.guestOnly) {
    return { name: landing[auth.role] }
  }

  // 4)  у роли нет доступа
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'Forbidden' }
  }
})
