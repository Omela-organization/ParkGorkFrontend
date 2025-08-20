<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  fetchProfiles,
  updateUser,
  updateProfile,
  deleteUser,
  registration,
  fetchUsers,
} from '@/api/auth'
import { useUsers } from '@/stores/users'

const profileFields = [
  { key: 'first_name', label: 'Имя' },
  { key: 'last_name', label: 'Фамилия' },
  { key: 'phone', label: 'Телефон' },
  { key: 'telegram_id', label: 'Telegram' },
  { key: 'vk_id', label: 'VK' },
  { key: 'bio', label: 'О себе' },
]
const PROFILE_KEYS = ['telegram_id', 'vk_id', 'phone', 'first_name', 'last_name', 'bio']

const store = useUsers()
const users = computed(() => store.items)
const loading = computed(() => !store.loaded)
const roles = computed(() => store.roles)

const editRow = ref(null)
const isNew = ref(false)


const pickProfilePayload = (obj = {}) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => PROFILE_KEYS.includes(k)))

async function findProfileIdByUserId(userId) {
  const list = await fetchProfiles()
  const p = list.find((p) => p.user_id === userId)
  return p?.id || null
}

async function saveEdit() {
  const u = editRow.value
  try {
    if (isNew.value) {
      if (!u.email || !u.username || !u.password) {
        alert('Заполните Email, Username и Пароль')
        return
      }

      const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_+={}\[\]:;"'<>,.?/-]{8,}$/
      if (!passwordRegex.test(u.password)) {
        alert('Пароль должен содержать минимум 8 символов и состоять из латиницы (допускаются цифры и спецсимволы)')
        return
      }

      await registration({
        email: u.email,
        username: u.username,
        password: u.password,
      })
      const created = (await fetchUsers()).find((user) => user.email === u.email)
      u.id = created.id

      if (typeof u.role_id !== 'number') u.role_id = 1

      await updateUser(u.id, {
        email: u.email,
        username: u.username,
        role_id: u.role_id || 1,
      })
      const fullRole = roles.value.find((r) => r.id === (u.role_id || 1))
      u.role = fullRole ?? { id: u.role_id || 1, name: '—' }
      store.upsert(u)

      const profileId = await findProfileIdByUserId(u.id)
      const body = pickProfilePayload(u.profile)
      if (profileId && Object.keys(body).length) {
        u.profile = await updateProfile(profileId, body)
      }

      store.upsert(u)
      isNew.value = false
      editRow.value = null
      return
    }

    await updateUser(u.id, {
      email: u.email,
      username: u.username,
      role_id: u.role_id ?? u.original_role_id,
    })

    let profileId = u.profile?.id
    if (!profileId) profileId = await findProfileIdByUserId(u.id)

    const body = pickProfilePayload(u.profile)
    if (profileId && Object.keys(body).length) {
      u.profile = await updateProfile(profileId, body)
    }

    const fullRole = roles.value.find((r) => r.id === u.role_id)
    u.role = fullRole ?? { id: u.role_id, name: '—' }

    store.upsert(u)
    editRow.value = null
  } catch (err) {
    const status = err?.response?.status
    const data = err?.response?.data
    const method = err?.config?.method?.toUpperCase?.()
    const url = err?.config?.url

    let detail = data?.detail || data?.message || data?.error || ''
    // only for dev
    console.groupCollapsed(`API ${method || ''} ${url || ''} — ${status || 'no status'}`)
    console.log('status:', status)
    console.log('response data:', data)
    console.log('headers:', err?.response?.headers)
    console.log('request id:', err?.response?.headers?.['x-request-id'])
    console.log('raw error:', err)
    console.groupEnd()
    if (typeof detail !== 'string' && status === 422) {
      detail = data.detail[0].msg
    }
    alert(`Не удалось сохранить изменения\n` + `Детали ошибки: ` + (detail ? `: ${detail}` : ''))
  }
}

function startEdit(row) {
  const copy = JSON.parse(JSON.stringify(row))
  copy.role_id = row.role?.id ?? null
  copy.original_role_id = row.role?.id ?? null
  editRow.value = copy
  isNew.value = false
}

function startCreate() {
  editRow.value = {
    id: null,
    email: '',
    username: '',
    password: '',
    role_id: '',
    profile: {},
  }
  isNew.value = true
}

function cancelCreate() {
  editRow.value = null
  isNew.value = false
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
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold">Список пользователей</h1>
      <button
        @click="startCreate"
        class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
      >
        <span>➕</span> Создать пользователя
      </button>
    </div>
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
        <tr v-if="isNew && editRow" class="bg-blue-50">
          <td class="px-4 py-2">
            <input
              v-model="editRow.email"
              placeholder="email@example.com"
              @keydown.enter.prevent="saveEdit"
              class="px-2 py-1 border rounded w-full outline-none focus:ring-2 focus:ring-primary/50"
            />
          </td>
          <td class="px-4 py-2">
            <input
              v-model="editRow.username"
              placeholder="username"
              @keydown.enter.prevent="saveEdit"
              class="px-2 py-1 border rounded w-full outline-none focus:ring-2 focus:ring-primary/50"
            />
          </td>

          <td v-for="f in profileFields" :key="f.key" class="px-4 py-2">
            <input
              v-model="editRow.profile[f.key]"
              :placeholder="f.label"
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
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </td>

          <td class="px-4 py-2 flex gap-2 justify-center">
            <!-- Пароль показываем только при создании -->
            <input
              v-model="editRow.password"
              type="password"
              placeholder="Пароль"
              class="px-2 py-1 border rounded w-32 outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              @click="saveEdit"
              class="px-2 py-1 rounded bg-primary text-white hover:bg-primary-dark"
            >
              💾
            </button>
            <button
              @click="cancelCreate"
              class="px-2 py-1 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
            >
              ✖️
            </button>
          </td>
        </tr>
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
