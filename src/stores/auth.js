import { defineStore } from 'pinia'
import { fetchRole, fetchUser, login as apiLogin } from '@/api/auth.js'
import { parseJwt } from '@/utils/helpers.js'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: '',
    refreshToken: '',
    userRole: null,
  }),
  getters: {
    isAuth: (s) => !!s.accessToken,
    role: (s) => s.userRole?.name ?? 'guest',
  },
  actions: {
    async init() {
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')
      const userRole = JSON.parse(localStorage.getItem('userRole') || 'null')
      const user = JSON.parse(localStorage.getItem('user') || 'null')
      if (accessToken && user) {
        this.accessToken = accessToken
        this.refreshToken = refreshToken
        this.user = user
        this.userRole = userRole
      }
    },
    async login(email, password) {
      // eslint-disable-next-line no-useless-catch
      try {
        const { access_token, refresh_token } = await apiLogin(email, password)
        this.accessToken = access_token
        this.refreshToken = refresh_token

        localStorage.setItem('accessToken', access_token)
        localStorage.setItem('refreshToken', refresh_token)
      } catch (e) {
        throw e
      }
    },
    async fetchUserAndRole() {
      // eslint-disable-next-line no-useless-catch
      try {
        const payload = parseJwt(this.accessToken)
        const user = await fetchUser(payload.user_id)
        this.userRole = await fetchRole(user.role_id)
        this.user = user
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('userRole', JSON.stringify(this.userRole))
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
