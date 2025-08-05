<script setup>
import { computed, onMounted, ref } from 'vue'
import { createProfile, deleteUser, updateProfile, updateUser } from '@/api/auth'
import { useUsers } from '@/stores/users'

const profileFields = [
  { key: 'first_name', label: 'Имя' },
  { key: 'last_name', label: 'Фамилия' },
  { key: 'phone', label: 'Телефон' },
  { key: 'telegram_id', label: 'Telegram' },
  { key: 'vk_id', label: 'VK' },
  { key: 'bio', label: 'О себе' },
]

const store = useUsers()
const users = computed(() => store.items)
const loading = computed(() => !store.loaded)
const roles = computed(() => store.roles)

const editRow = ref(null)

async function saveEdit() {
  const u = editRow.value

  const payload = {
    email: u.email,
    username: u.username,
  }

  const roleChanged = u.role_id !== u.original_role_id
  if (roleChanged) {
    payload.role_id = u.role_id
  } else payload.role_id = u.original_role_id

  try {
    if (Object.keys(payload).length > 0) {
      await updateUser(u.id, payload)
    }

    if (u.profile?.id) {
      await updateProfile(u.profile.id, u.profile)
    } else {
      u.profile = await createProfile({ ...u.profile, user_id: u.id })
    }

    if (roleChanged) {
      const fullRole = roles.value.find((r) => r.id === u.role_id)
      u.role = fullRole ?? { id: u.role_id, name: '—' }
    }

    store.upsert(u)
    editRow.value = null
  } catch (err) {
    console.error(err)
    alert('Не удалось сохранить изменения')
  }
}

function startEdit(row) {
  const copy = JSON.parse(JSON.stringify(row))
  copy.role_id = row.role?.id ?? null
  copy.original_role_id = row.role?.id ?? null
  editRow.value = copy
}

async function removeUser(id) {
  if (!confirm('Удалить пользователя?')) return
  await deleteUser(id)
  store.remove(id)
}

onMounted(async () => {
  await Promise.all([store.ensureLoaded(), store.loadRoles()])
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold mb-6">Список пользователей</h1>

    <div v-if="loading" class="text-center py-10 text-gray-500">Загрузка…</div>

    <table
      v-else
      class="min-w-full bg-white shadow border border-gray-200 rounded-lg overflow-hidden table-fixed"
    >
      <thead class="bg-gray-100 text-left text-sm uppercase tracking-wider">
        <tr>
          <th class="px-4 py-3">E-mail</th>
          <th class="px-4 py-3">username</th>
          <th v-for="f in profileFields" :key="f.key" class="px-4 py-3">{{ f.label }}</th>
          <th class="px-4 py-3">Роль</th>
          <th class="px-4 py-3 w-32 text-center">Действия</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-200">
        <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
          <template v-if="editRow && editRow.id === u.id">
            <td class="px-4 py-2">
              <input
                v-model="editRow.email"
                @keydown.enter.prevent="saveEdit"
                class="px-2 py-1 border rounded w-full outline-none focus:ring-2 focus:ring-primary/50"
              />
            </td>
            <td class="px-4 py-2">
              <input
                v-model="editRow.username"
                @keydown.enter.prevent="saveEdit"
                class="px-2 py-1 border rounded w-full outline-none focus:ring-2 focus:ring-primary/50"
              />
            </td>
            <td v-for="f in profileFields" :key="f.key" class="px-4 py-2">
              <input
                v-model="editRow.profile[f.key]"
                @keydown.enter.prevent="saveEdit"
                class="px-2 py-1 border rounded w-full outline-none focus:ring-2 focus:ring-primary/50"
              />
            </td>
            <td class="px-4 py-2">
              <select
                v-model="editRow.role_id"
                class="px-2 py-1 border rounded w-full outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option disabled value="">— выберите роль —</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">
                  {{ r.name }}
                </option>
              </select>
            </td>
            <td class="px-4 py-2 flex gap-2 justify-center">
              <button
                @click="saveEdit"
                class="px-2 py-1 rounded bg-primary text-white hover:bg-primary-dark"
              >
                💾
              </button>
              <button
                @click="editRow = null"
                class="px-2 py-1 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
              >
                ✖️
              </button>
            </td>
          </template>

          <template v-else>
            <td class="px-4 py-2">{{ u.email || '—' }}</td>
            <td class="px-4 py-2">{{ u.username || '—' }}</td>
            <td v-for="f in profileFields" :key="f.key" class="px-4 py-2">
              {{ u.profile?.[f.key] || '—' }}
            </td>
            <td class="px-4 py-2">{{ u.role?.name || '—' }}</td>
            <td class="px-4 py-2 flex gap-2 justify-center text-lg">
              <button
                @click="startEdit(u)"
                class="px-2 py-1 rounded bg-emerald-400 text-white hover:bg-emerald-500"
              >
                ✏️
              </button>
              <button
                @click="removeUser(u.id)"
                class="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              >
                🗑
              </button>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>
