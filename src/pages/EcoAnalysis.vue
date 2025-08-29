<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import EcoProblemMap from '@/components/EcoProblemMap.vue'
import {
  fetchEcoProblems,
  fetchEcoProblemById,
  fetchStatuses,
  fetchTypeIncidents,
} from '@/api/eco'
import { YANDEX_MAPS_API_KEY } from '@/utils/settings.js'

const loading = ref(false)
const problems = ref([])
const statuses = ref([])
const types = ref([])

const detailsCache = ref(new Map())
const photosOpen = ref(false)
const selectedPhotos = ref([])

const mapRef = ref(null)

const viewed = ref(new Set(JSON.parse(localStorage.getItem('viewedEcoProblems') || '[]')))
function markViewed(id) {
  if (!viewed.value.has(id)) {
    viewed.value.add(id)
    localStorage.setItem('viewedEcoProblems', JSON.stringify([...viewed.value]))
  }
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const typeNameById = computed(() =>
  Object.fromEntries(types.value.map((t) => [t.id, t.text])),
)
const statusNameById = computed(() =>
  Object.fromEntries(statuses.value.map((s) => [s.id, s.text])),
)

function coordsPair(p) {
  const lat = Number(p.longitude)
  const lon = Number(p.latitude)
  return [lat, lon]
}
function coordsString(p) {
  const [lat, lon] = coordsPair(p)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '—'
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`
}

function buildYandexLink(lat, lon, zoom = 17) {
  const ll = `${lon.toFixed(6)},${lat.toFixed(6)}`
  const pt = `${lon.toFixed(6)},${lat.toFixed(6)},pm2rdl`
  const url = new URL('https://yandex.ru/maps/')
  url.searchParams.set('ll', ll)
  url.searchParams.set('z', String(zoom))
  url.searchParams.set('pt', pt)
  url.searchParams.set('l', 'map')
  return url.toString()
}

const toast = ref({ show: false, text: '' })
let toastTimer
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}
async function copyCoordsLink(p) {
  const [lat, lon] = coordsPair(p)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
  const link = buildYandexLink(lat, lon)
  const ok = await copyText(link)
  showToast(ok ? 'Ссылка на карту скопирована' : 'Не удалось скопировать')
}
function showToast(text) {
  toast.value = { show: true, text }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 1600)
}

const sortedProblems = computed(() =>
  [...problems.value].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  ),
)

const rows = computed(() =>
  sortedProblems.value.map((p) => ({
    ...p,
    createdAt: formatDate(p.created_at),
    typeName: typeNameById.value[p.type_incident_id] ?? '—',
    statusName: statusNameById.value[p.status_id] ?? '—',
    coords: coordsString(p),
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
    problems.value = ps ?? []
    statuses.value = ss ?? []
    types.value = ts ?? []
  } catch (e) {
    console.error('Failed to load eco-analysis data', e)
  } finally {
    loading.value = false
  }
}

async function openPhotos(p) {
  try {
    if (!detailsCache.value.has(p.id)) {
      const full = await fetchEcoProblemById(p.id)
      detailsCache.value.set(p.id, full)
    }
    selectedPhotos.value =
      detailsCache.value.get(p.id)?.files
        ?.map((f) => f.storage?.url)
        .filter(Boolean) || []
  } catch (e) {
    console.error('Failed to load photos', e)
    selectedPhotos.value = []
  } finally {
    photosOpen.value = true
  }
}

function focusOnMap(p) {
  mapRef.value?.focusOn(p)
}

function onRowClick(p) {
  markViewed(p.id)
  focusOnMap(p)
}

const printingProblem = ref(null)

function buildStaticMapUrl({ lat, lon, zoom = 17, size = '720,420' }) {
  const params = new URLSearchParams({
    lang: 'ru_RU',
    l: 'map',
    z: String(zoom),
    size,
    ll: `${lon},${lat}`,
    pt: `${lon},${lat},pm2rdl`,
  })
  if (YANDEX_MAPS_API_KEY) params.set('apikey', YANDEX_MAPS_API_KEY)
  return `https://static-maps.yandex.ru/1.x/?${params.toString()}`
}

const printMapUrl = computed(() => {
  const p = printingProblem.value
  if (!p) return ''
  const [lat, lon] = coordsPair(p)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return ''
  return buildStaticMapUrl({ lat, lon })
})

async function printReport(p) {
  printingProblem.value = p
  await nextTick()
  const img = document.getElementById('printMapImg')
  if (img && !img.complete) {
    await new Promise((res) => {
      img.onload = res
      img.onerror = res
    })
  }
  window.print()
}

onMounted(load)
</script>

<template>
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">Анализ Экопроблем</h2>
      <span v-if="loading" class="text-sm text-gray-500">Загрузка…</span>
    </header>

    <!-- интерактивная карта -->
    <EcoProblemMap :points="problems" ref="mapRef" class="interactive-map" />

    <div class="overflow-auto rounded-xl border border-gray-200 bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 sticky top-0">
        <tr class="text-left">
          <th class="px-3 py-2">Дата</th>
          <th class="px-3 py-2">Тип нарушения</th>
          <th class="px-3 py-2">Координаты</th>
          <th class="px-3 py-2">Фотографии</th>
          <th class="px-3 py-2">Статус проверки</th>
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
          <td class="px-3 py-2 font-semibold whitespace-nowrap">
            {{ p.createdAt }}
          </td>
          <td class="px-3 py-2">{{ p.typeName }}</td>

          <td class="px-3 py-2">
            <button
              class="font-mono text-blue-600 hover:underline"
              title="Скопировать ссылку на это место"
              @click.stop="copyCoordsLink(p)"
            >
              {{ p.coords }}
            </button>
          </td>

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

    <!-- модалка с фото -->
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
            <img :src="url" class="w-full h-48 object-cover rounded-lg border" alt="" />
          </a>
          <p v-if="selectedPhotos.length === 0" class="text-sm text-gray-500">Файлы не найдены</p>
        </div>
      </div>
    </div>

    <!-- шаблон печати -->
    <div class="print:block hidden">
      <article v-if="printingProblem" class="p-6">
        <h1 class="text-2xl font-bold mb-2">
          Отчёт по эко-проблеме #{{ printingProblem.id }}
        </h1>

        <!-- статическая карта для печати -->
        <img
          v-if="printMapUrl"
          :src="printMapUrl"
          id="printMapImg"
          alt="Карта инцидента"
          class="w-full rounded-lg border mb-4"
        />

        <p class="text-sm text-gray-600 mb-4">
          Координаты: {{ printingProblem.coords }}
        </p>
        <p class="mb-2"><strong>Тип нарушения:</strong> {{ printingProblem.typeName }}</p>
        <p class="mb-2"><strong>Статус проверки:</strong> {{ printingProblem.statusName }}</p>
        <p class="mt-6 text-xs text-gray-500">
          Сформировано автоматически в админ-панели
        </p>
      </article>
    </div>

    <!-- тост -->
    <div
      v-if="toast.show"
      class="fixed bottom-4 right-4 z-50 rounded-lg bg-black/80 text-white px-3 py-2 text-sm shadow"
    >
      {{ toast.text }}
    </div>
  </section>
</template>

<style>
@media print {
  .interactive-map { display: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { background: white; }
}
</style>
