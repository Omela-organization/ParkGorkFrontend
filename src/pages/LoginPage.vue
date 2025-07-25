<script setup>
import { ref } from 'vue'
import { useAuth } from '@/stores/auth'
import { useRouter } from 'vue-router'

const email = ref('admin@gmail.com')
const password = ref('admin1234')
const error = ref('')
const auth = useAuth()
const router = useRouter()

async function submit() {
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    await auth.fetchUserAndRole()
    await router.push('/')
  } catch (e) {
    error.value = `Неверный логин или пароль ${e}`
  }
}
</script>

<template>
  <div class="max-w-sm w-full bg-white shadow-md rounded-xl p-6">
    <h2 class="text-xl font-semibold mb-4 text-center">Вход</h2>

    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-sm mb-1">E‑mail</label>
        <input
          v-model="email"
          type="email"
          required
          class="border rounded border-gray-300 px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div>
        <label class="block text-sm mb-1">Пароль</label>
        <input
          v-model="password"
          type="password"
          required
          class="border rounded border-gray-300 px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <button
        class="px-3 py-2 rounded text-white bg-primary hover:bg-primary-dark transition w-full mt-2"
      >
        Войти
      </button>
    </form>
  </div>
</template>
