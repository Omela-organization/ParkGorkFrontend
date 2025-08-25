<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

const auth = useAuth()
const router = useRouter()
const route = useRoute()

// все маршруты, где meta.roles содержит текущую роль
const navLinks = computed(() =>
  router.getRoutes().filter((r) => r.meta?.roles?.includes(auth.role)),
)

function logout() {
  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <header class="bg-gray-800 text-white px-6 py-3 flex items-center">
      <nav v-if="navLinks.length > 1" class="flex space-x-4">
        <RouterLink
          v-for="link in navLinks"
          :key="link.name"
          :to="{ name: link.name }"
          class="nav-link"
          :class="{ 'nav-link-active': link.name === route.name }"
        >
          {{ link.meta.label }}
        </RouterLink>
      </nav>

      <h1 v-else class="text-lg font-semibold">{{ navLinks[0]?.meta.label }}</h1>

      <button @click="logout" class="ml-auto text-sm hover:underline">Выйти</button>
    </header>

    <main class="flex-1 p-6 overflow-y-auto bg-gray-50">
      <router-view />
    </main>
  </div>
</template>
