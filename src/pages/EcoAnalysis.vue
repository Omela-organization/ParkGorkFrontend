<script setup>
import { ref, onMounted, computed } from 'vue'
import EcoProblemMap from '@/components/EcoProblemMap.vue'
import { fetchEcoProblems, fetchEcoProblemById, fetchStatuses, fetchTypeIncidents } from '@/api/eco'

const loading = ref(false)
const problems = ref([])
const statuses = ref([])
const types = ref([])

const detailsCache = ref(new Map())

const viewed = ref(new Set(JSON.parse(localStorage.getItem('viewedEcoProblems') || '[]')))
function markViewed(id) {
  viewed.value.add(id)
  localStorage.setItem('viewedEcoProblems', JSON.stringify([...viewed.value]))
}

const mapRef = ref(null)

const rows = computed(() =>
  problems.value.map((p) => ({
    ...p,
    typeName: types.value.find((t) => t.id === p.type_incident_id)?.name || '—',
    statusName: statuses.value.find((s) => s.id === p.status_id)?.name || '—',
    coords: `${Number(p.latitude).toFixed(6)}, ${Number(p.longitude).toFixed(6)}`,
    isViewed: viewed.value.has(p.id),
  })),
)

async function load() {
  loading.value = true
  try {
    const [ps, ss, ts] = await Promise.all([
      fetchEcoProblems(),
      fetchStatuses(),
      fetchTypeIncidents(),
    ])
    problems.value = ps
    statuses.value = ss
    types.value = ts
  } finally {
    loading.value = false
  }
}

async function openPhotos(p) {
  if (!detailsCache.value.has(p.id)) {
    const full = await fetchEcoProblemById(p.id)
    detailsCache.value.set(p.id, full)
  }
  selectedPhotos.value =
    detailsCache.value
      .get(p.id)
      ?.files?.map((f) => f.storage?.url)
      .filter(Boolean) || []
  photosOpen.value = true
}

function focusOnMap(p) {
  mapRef.value?.focusOn(p)
}

function onRowClick(p) {
  markViewed(p.id)
  focusOnMap(p)
}

const printingProblem = ref(null)
function printReport(p) {
  printingProblem.value = p
  requestAnimationFrame(() => {
    window.print()
  })
}

const photosOpen = ref(false)
const selectedPhotos = ref([])

onMounted(load)
</script>

<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">Анализ Экопроблем</h2>
      <span v-if="loading" class="text-sm text-gray-500">Загрузка…</span>
    </header>

    <EcoProblemMap :points="problems" ref="mapRef" />

    <div class="overflow-auto rounded-xl border border-gray-200 bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 sticky top-0">
          <tr class="text-left">
            <th class="px-3 py-2">Дата</th>
            <th class="px-3 py-2">Тип нарушения</th>
            <th class="px-3 py-2">Координаты</th>
            <th class="px-3 py-2">Фотографии</th>
            <th class="px-3 py-2">Статус проверки</th>
            <th class="px-3 py-2">Карта</th>
            <th class="px-3 py-2">Просмотрено</th>
            <th class="px-3 py-2">Отчёт (PDF)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in rows"
            :key="p.id"
            class="border-t hover:bg-gray-50 cursor-pointer"
            @click="onRowClick(p)"
          >
            <td class="px-3 py-2 text-gray-700">—</td>
            <td class="px-3 py-2">{{ p.typeName }}</td>
            <td class="px-3 py-2 font-mono">{{ p.coords }}</td>
            <td class="px-3 py-2">
              <button
                @click.stop="openPhotos(p)"
                class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                Показать
              </button>
            </td>
            <td class="px-3 py-2">{{ p.statusName }}</td>
            <td class="px-3 py-2">
              <button
                @click.stop="focusOnMap(p)"
                class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                Показать
              </button>
            </td>
            <td class="px-3 py-2">
              <span :class="p.isViewed ? 'text-green-600' : 'text-gray-400'">{{
                p.isViewed ? 'Просмотрено' : '—'
              }}</span>
            </td>
            <td class="px-3 py-2">
              <button
                @click.stop="printReport(p)"
                class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                Скачать PDF-отчёт
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="photosOpen"
      class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      @click="photosOpen = false"
    >
      <div class="bg-white max-w-5xl w-full rounded-xl p-4 space-y-3" @click.stop>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Фотографии</h3>
          <button class="text-sm text-gray-500 hover:text-black" @click="photosOpen = false">
            Закрыть
          </button>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <a
            v-for="(url, i) in selectedPhotos"
            :key="i"
            :href="url"
            target="_blank"
            rel="noopener"
            class="block"
          >
            <img :src="url" class="w-full h-48 object-cover rounded-lg border" alt=""/>
          </a>
          <p v-if="selectedPhotos.length === 0" class="text-sm text-gray-500">Файлы не найдены</p>
        </div>
      </div>
    </div>

    <div class="print:block hidden">
      <article v-if="printingProblem" class="p-6">
        <h1 class="text-2xl font-bold mb-2">Отчёт по эко-проблеме #{{ printingProblem.id }}</h1>
        <p class="text-sm text-gray-600 mb-4">Координаты: {{ printingProblem.coords }}</p>
        <p class="mb-2"><strong>Тип нарушения:</strong> {{ printingProblem.typeName }}</p>
        <p class="mb-2"><strong>Статус проверки:</strong> {{ printingProblem.statusName }}</p>
        <p class="mt-6 text-xs text-gray-500">Сформировано автоматически в админ-панели</p>
      </article>
    </div>
  </section>
</template>

<style>
@media print {
  body {
    background: white;
  }
}
</style>
