import { defineStore } from 'pinia'
import { fetchRole, fetchUser, login as apiLogin, refresh as apiRefresh } from '@/api/auth.js'
import { parseJwt } from '@/utils/helpers.js'

const STORAGE = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user',
  userRole: 'userRole',
}

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: '',
    refreshToken: '',
    userRole: null,

    _refreshPromise: null,
  }),

  getters: {
    isAuth: (s) => !!s.accessToken,
    role: (s) => s.userRole?.name ?? 'guest',

    shouldProactiveRefresh: (s) => {
      if (!s.accessToken) return false
      try {
        const payload = parseJwt(s.accessToken)
        if (!payload?.exp) return false
        const expMs = payload.exp * 1000
        return Date.now() > expMs - 30_000
      } catch {
        return false
      }
    },
  },

  actions: {
    _persist() {
      if (this.accessToken) {
        localStorage.setItem(STORAGE.accessToken, this.accessToken)
      } else {
        localStorage.removeItem(STORAGE.accessToken)
      }
      if (this.refreshToken) {
        localStorage.setItem(STORAGE.refreshToken, this.refreshToken)
      } else {
        localStorage.removeItem(STORAGE.refreshToken)
      }
      if (this.user) {
        localStorage.setItem(STORAGE.user, JSON.stringify(this.user))
      } else {
        localStorage.removeItem(STORAGE.user)
      }
      if (this.userRole) {
        localStorage.setItem(STORAGE.userRole, JSON.stringify(this.userRole))
      } else {
        localStorage.removeItem(STORAGE.userRole)
      }
    },

    setTokens({ access, refresh }) {
      if (access) this.accessToken = access
      if (refresh) this.refreshToken = refresh
      this._persist()
    },

    async init() {
      const accessToken = localStorage.getItem(STORAGE.accessToken)
      const refreshToken = localStorage.getItem(STORAGE.refreshToken)
      const userRole = JSON.parse(localStorage.getItem(STORAGE.userRole) || 'null')
      const user = JSON.parse(localStorage.getItem(STORAGE.user) || 'null')
      if (accessToken) this.accessToken = accessToken
      if (refreshToken) this.refreshToken = refreshToken
      if (user) this.user = user
      if (userRole) this.userRole = userRole

      if (this.shouldProactiveRefresh && this.refreshToken) {
        try {
          await this.refreshIfNeeded()
        } catch { /* empty */ }
      }
    },

    async login(email, password) {
      // eslint-disable-next-line no-useless-catch
      try {
        const { access_token, refresh_token } = await apiLogin(email, password)
        this.setTokens({ access: access_token, refresh: refresh_token })
        return { access_token, refresh_token }
      } catch (e) {
        throw e
      }
    },

    async refreshIfNeeded() {
      if (!this.refreshToken) throw new Error('No refresh token')

      if (this._refreshPromise) return this._refreshPromise

      if (!this.shouldProactiveRefresh) return null

      this._refreshPromise = (async () => {
        const data = await apiRefresh(this.refreshToken)
        const newAccess = data.access_token || data.access || data.token
        const newRefresh = data.refresh_token || data.refresh
        if (!newAccess) throw new Error('No access token in refresh response')
        this.setTokens({ access: newAccess, refresh: newRefresh })
        return data
      })()

      try {
        return await this._refreshPromise
      } finally {
        this._refreshPromise = null
      }
    },

    async fetchUserAndRole() {
      try {
        const payload = parseJwt(this.accessToken)
        const user = await fetchUser(payload.user_id)
        this.user = user
        localStorage.setItem(STORAGE.user, JSON.stringify(user))

        if (user?.role_id) {
          this.userRole = await fetchRole(user.role_id)
        } else {
          this.userRole = { name: payload?.role || 'guest' }
        }
        localStorage.setItem(STORAGE.userRole, JSON.stringify(this.userRole))
      } catch (e) {
        console.error('[fetchUserAndRole] failed', e)
        this.userRole = { name: 'guest' }
        localStorage.setItem(STORAGE.userRole, JSON.stringify(this.userRole))
        throw e
      }
    },

    logout() {
      this.accessToken = ''
      this.refreshToken = ''
      this.user = null
      this.userRole = null
      this._persist()
    },
  },
})
