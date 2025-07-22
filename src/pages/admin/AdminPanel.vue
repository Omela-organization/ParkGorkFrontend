<script setup>
import { ref, onMounted } from 'vue'
import { fetchUsers, updateUser, deleteUser } from '@/api/auth'

const loading = ref(false)
const users = ref([])
const editRow = ref(null)

async function fetchUsers_() {
  loading.value = true
  try {
    users.value = await fetchUsers()
  } finally {
    loading.value = false
  }
}

function startEdit(u) {
  editRow.value = { ...u }
}

async function saveEdit() {
  await updateUser(editRow.value.id, editRow.value)
  const i = users.value.findIndex((u) => u.id === editRow.value.id)
  users.value[i] = { ...editRow.value }
  editRow.value = null
}

async function removeUser(id) {
  if (!confirm('Удалить пользователя?')) return
  await deleteUser(id)
  users.value = users.value.filter((u) => u.id !== id)
}

onMounted(fetchUsers_)
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold mb-6">Список пользователей</h1>

    <div v-if="loading" class="text-center py-10 text-gray-500">Загрузка…</div>

    <table
      v-else
      class="min-w-full bg-white shadow border border-gray-200 rounded-lg overflow-hidden"
    >
      <thead class="bg-gray-100 text-left text-sm uppercase tracking-wider">
        <tr>
          <th class="px-4 py-3">Имя</th>
          <th class="px-4 py-3">Фамилия</th>
          <th class="px-4 py-3">E‑mail</th>
          <th class="px-4 py-3">Роль</th>
          <th class="px-4 py-3 w-32 text-center">Действия</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
          <template v-if="editRow && editRow.id === u.id">
            <td class="px-4 py-2">
              <input v-model="editRow.first_name" class="input rounded border-gray-300" />
            </td>
            <td class="px-4 py-2">
              <input v-model="editRow.last_name" class="input rounded border-gray-300" />
            </td>
            <td class="px-4 py-2">
              <input v-model="editRow.email" class="input rounded border-gray-300" />
            </td>
            <td class="px-4 py-2">
              <input v-model="editRow.role.name" class="input rounded border-gray-300" />
            </td>
            <td class="px-4 py-2 flex gap-2 justify-center">
              <button
                class="btn rounded bg-primary text-white hover:bg-primary-dark"
                @click="saveEdit"
              >
                💾
              </button>
              <button
                class="btn rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
                @click="editRow = null"
              >
                ✖️
              </button>
            </td>
          </template>
          <template v-else>
            <td class="px-4 py-2">{{ u.first_name }}</td>
            <td class="px-4 py-2">{{ u.last_name }}</td>
            <td class="px-4 py-2">{{ u.email }}</td>
            <td class="px-4 py-2">{{ u.role?.name }}</td>
            <td class="px-4 py-2 flex gap-2 justify-center text-lg">
              <button
                class="btn rounded bg-primary text-white hover:bg-primary-dark"
                @click="startEdit(u)"
              >
                ✏️
              </button>
              <button
                class="btn rounded bg-red-500 text-white hover:bg-red-600"
                @click="removeUser(u.id)"
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
