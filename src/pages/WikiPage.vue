<script setup>
import { ref, computed, onMounted } from 'vue'
import WikiModal from '@/components/wiki/WikiModal.vue'
import { fetchWikis, deleteWiki } from '@/api/eco.js'

const loading = ref(false)
const items = ref([])
const q = ref('')

const modalOpen = ref(false)
const editing = ref(null)

const confirmOpen = ref(false)
const toDelete = ref(null)

function shortId(id) {
  return (id || '').slice(0, 8)
}

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return items.value
  return items.value.filter(
    (w) => w.name.toLowerCase().includes(s) || (w.description || '').toLowerCase().includes(s),
  )
})

async function load() {
  loading.value = true
  try {
    items.value = await fetchWikis()
  } catch (e) {
    console.error(e)
    items.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  modalOpen.value = true
}

function openEdit(w) {
  editing.value = { ...w }
  modalOpen.value = true
}

async function onSaved(_wiki) {
  await load()
}

function confirmDelete(w) {
  toDelete.value = w
  confirmOpen.value = true
}

async function doDelete() {
  if (!toDelete.value) return
  try {
    await deleteWiki(toDelete.value.id)
    items.value = items.value.filter((x) => x.id !== toDelete.value.id)
  } catch (e) {
    console.error(e)
    alert('Не удалось удалить статью')
  } finally {
    confirmOpen.value = false
    toDelete.value = null
  }
}

onMounted(load)
</script>
<template>
  <div class="p-4 md:p-6">
    <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h1 class="text-2xl font-semibold">Wiki</h1>

      <div class="flex gap-2">
        <input
          v-model="q"
          type="search"
          placeholder="Поиск по названию/описанию…"
          class="w-full md:w-72 rounded-xl border px-3 py-2 focus:outline-none focus:ring"
        />
        <button
          class="rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          @click="openCreate()"
        >
          Новая статья
        </button>
      </div>
    </div>

    <div v-if="loading" class="py-10 text-center text-gray-500">Загрузка…</div>

    <div v-else>
      <div v-if="filtered.length === 0" class="py-10 text-center text-gray-500">Статей нет</div>

      <!-- Сетка карточек (адаптивно) -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article
          v-for="w in filtered"
          :key="w.id"
          class="rounded-2xl border bg-white p-4 shadow-sm hover:shadow"
        >
          <header class="mb-2 flex items-start justify-between gap-2">
            <h3 class="font-semibold line-clamp-2">{{ w.name }}</h3>
            <span class="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
              {{ shortId(w.id) }}
            </span>
          </header>

          <p class="mb-4 text-sm text-gray-600 line-clamp-4">
            {{ w.description }}
          </p>

          <div class="flex gap-2">
            <button
              class="flex-1 rounded-xl border px-3 py-2 hover:bg-gray-50"
              @click="openEdit(w)"
            >
              Редактировать
            </button>
            <button
              class="flex-1 rounded-xl border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50"
              @click="confirmDelete(w)"
            >
              Удалить
            </button>
          </div>
        </article>
      </div>
    </div>

    <!-- модалка создания/редактирования -->
    <WikiModal v-model="modalOpen" :initial="editing" @saved="onSaved" />

    <!-- простая confirm-модалка -->
    <div v-if="confirmOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" @click="confirmOpen = false"></div>
      <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 class="text-lg font-semibold mb-2">Удалить статью?</h3>
        <p class="text-sm text-gray-600 mb-4">Это действие нельзя отменить.</p>
        <div class="flex justify-end gap-2">
          <button class="rounded-xl border px-4 py-2 hover:bg-gray-50" @click="confirmOpen = false">
            Отмена
          </button>
          <button
            class="rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            @click="doDelete"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
