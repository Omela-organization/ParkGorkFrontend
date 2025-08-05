import { defineStore } from 'pinia'
import { fetchProfiles, fetchProfileInfo, fetchRoles } from '@/api/auth'

export const useUsers = defineStore('users', {
  state: () => ({
    items: [], // [{ id, email, role, profile }, ...]
    loaded: false,
    roles: [] // [{id, name, description}]
  }),

  actions: {
    async ensureLoaded() {
      if (this.loaded) return

      const profiles = await fetchProfiles()

      const infoArr = await Promise.all(profiles.map((p) => fetchProfileInfo(p.id)))

      this.items = infoArr.map((info) => ({
        id: info.user.id,
        email: info.user.email,
        username: info.user.username,
        role: info.user.role,
        profile: {
          id: info.id,
          first_name: info.first_name,
          last_name: info.last_name,
          phone: info.phone,
          telegram_id: info.telegram_id,
          vk_id: info.vk_id,
          bio: info.bio,
        },
      }))

      this.loaded = true
    },

    upsert(row) {
      const idx = this.items.findIndex((r) => r.id === row.id)
      if (idx === -1) this.items.push(row)
      else this.items[idx] = row
    },

    remove(id) {
      this.items = this.items.filter((r) => r.id !== id)
    },
    async loadRoles() {
      this.roles = await fetchRoles()
    }
  },
})
