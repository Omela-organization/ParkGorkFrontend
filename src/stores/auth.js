import { defineStore } from 'pinia'
import { login as apiLogin } from '@/api/auth.js'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: '',
    refreshToken: '',
  }),
  getters: {
    isAuth: (s) => !!s.accessToken,
    role: (s) => s.user?.role?.name ?? 'guest',
  },
  actions: {
    async init() {
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      if (accessToken && user) {
        this.accessToken = accessToken
        this.refreshToken = refreshToken
        this.user = user
      }
    },
    async login(email, password) {
      // eslint-disable-next-line no-useless-catch
      try {
        const { access_token, refresh_token, user } = await apiLogin(email, password)
        this.accessToken = access_token
        this.refreshToken = refresh_token
        this.user = user

        localStorage.setItem('accessToken', access_token)
        localStorage.setItem('refreshToken', refresh_token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch (e) {
        throw e
      }
    },
    logout() {
      this.accessToken = ''
      this.refreshToken = ''
      this.user = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },
  },
})
