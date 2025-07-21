import { defineStore } from 'pinia'

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: '',
    refreshToken: ''
  }),
  getters: {
    role: (s) => s.user?.role?.name ?? 'guest'
  },
  actions: { async login() {}}
})
