<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import EcoProblemMap from '@/components/EcoProblemMap.vue'
import { fetchEcoProblems, fetchEcoProblemById, fetchStatuses, fetchTypeIncidents } from '@/api/eco'
import { ecoApi } from '@/api/core'
import { useAuth } from '@/stores/auth'
import { YANDEX_MAPS_API_KEY } from '@/utils/settings.js'

/* --------- авторизация / роли --------- */
const auth = useAuth()
const isAdmin = computed(() => auth.role === 'admin')

/* --------- состояние данных --------- */
const loading = ref(false)
const problems = ref([])

const statusesRaw = ref([]) // что пришло с бэка
const typesRaw = ref([])

/* Нормализация списков: приводим к { id, label } */
function normalizeList(list, preferredNameKey = 'name') {
  const src = Array.isArray(list) ? list : Array.isArray(list?.results) ? list.results : []

  return src
    .map((x) => ({
      id: x.id ?? x.value ?? x.key,
      label: x[preferredNameKey] ?? x.text ?? x.label ?? (typeof x === 'string' ? x : String(x.id)),
      _original: x,
    }))
    .filter((x) => x.id != null)
}

const statusOptions = computed(() => normalizeList(statusesRaw.value, 'name'))
const typeOptions = computed(() => normalizeList(typesRaw.value, 'name'))

const statusLabelById = computed(() =>
  Object.fromEntries(statusOptions.value.map((s) => [s.id, s.label])),
)
const typeLabelById = computed(() =>
  Object.fromEntries(typeOptions.value.map((t) => [t.id, t.label])),
)

/* --------- карта / координаты --------- */
const mapRef = ref(null)

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
function coordsPair(p) {
  // ⚠️ сейчас широта лежит в longitude, долгота — в latitude
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

/* --------- копирование ссылки --------- */
const toast = ref({ show: false, text: '' })
let toastTimer
function showToast(t) {
  toast.value = { show: true, text: t }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value.show = false), 1500)
}
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
  const ok = await copyText(buildYandexLink(lat, lon))
  showToast(ok ? 'Ссылка на карту скопирована' : 'Не удалось скопировать')
}

/* --------- представление таблицы --------- */
const sortedProblems = computed(() =>
  [...problems.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
)

const rows = computed(() =>
  sortedProblems.value.map((p) => ({
    ...p,
    createdAt: formatDate(p.created_at),
    typeName: typeLabelById.value[p.type_incident_id] ?? '—',
    statusName: statusLabelById.value[p.status_id] ?? '—',
    coords: coordsString(p),
  })),
)

/* --------- загрузка --------- */
async function load() {
  loading.value = true
  try {
    const [ps, ss, ts] = await Promise.all([
      fetchEcoProblems(),
      fetchStatuses(), // /api/v1/statuses/
      fetchTypeIncidents(), // /api/v1/type_incidents/
    ])
    problems.value = ps ?? []
    statusesRaw.value = ss ?? []
    typesRaw.value = ts ?? []
  } finally {
    loading.value = false
  }
}

/* --------- модалка с фото --------- */
const detailsCache = ref(new Map())
const photosOpen = ref(false)
const photosLoading = ref(false)
const selectedPhotos = ref([])

async function openPhotos(p) {
  photosLoading.value = true
  selectedPhotos.value = []
  try {
    if (!detailsCache.value.has(p.id)) {
      const full = await fetchEcoProblemById(p.id)
      detailsCache.value.set(p.id, full)
    }
    selectedPhotos.value =
      detailsCache.value
        .get(p.id)
        ?.files?.map((f) => f.storage?.url)
        .filter(Boolean) || []
  } catch {
    selectedPhotos.value = []
  } finally {
    photosLoading.value = false
    photosOpen.value = true
  }
}

/* --------- фокус карты --------- */
function focusOnMap(p) {
  mapRef.value?.focusOn(p)
}
function onRowClick(p) {
  focusOnMap(p)
}

const savingInline = ref(new Set())
async function updateField(id, patch) {
  try {
    savingInline.value.add(id)
    await ecoApi.put(`/eco_problems/update/${id}`, patch)
    const i = problems.value.findIndex((x) => x.id === id)
    if (i !== -1) problems.value[i] = { ...problems.value[i], ...patch }
  } catch {
    showToast('Не удалось сохранить')
  } finally {
    savingInline.value.delete(id)
  }
}

const editRowId = ref(null)
const draft = ref(null)
function startEditRow(p) {
  editRowId.value = p.id
  const [lat, lon] = coordsPair(p)
  draft.value = {
    id: p.id,
    type_incident_id: p.type_incident_id,
    status_id: p.status_id,
    is_seen: !!p.is_seen,
    lat: lat.toFixed(6),
    lon: lon.toFixed(6),
  }
}
function cancelEditRow() {
  editRowId.value = null
  draft.value = null
}
async function saveEditRow() {
  const id = draft.value.id
  const lat = Number(draft.value.lat)
  const lon = Number(draft.value.lon)
  const payload = {
    type_incident_id: draft.value.type_incident_id,
    status_id: draft.value.status_id,
    is_seen: !!draft.value.is_seen,
    longitude: Number.isFinite(lat) ? String(lat) : undefined,
    latitude: Number.isFinite(lon) ? String(lon) : undefined,
  }
  try {
    await ecoApi.put(`/eco_problems/update/${id}`, payload)
    const i = problems.value.findIndex((x) => x.id === id)
    if (i !== -1) problems.value[i] = { ...problems.value[i], ...payload }
    showToast('Сохранено')
    cancelEditRow()
  } catch {
    showToast('Не удалось сохранить')
  }
}
async function removeRow(id) {
  if (!confirm('Удалить запись?')) return
  try {
    await ecoApi.delete(`/eco_problems/delete/${id}`)
    problems.value = problems.value.filter((x) => x.id !== id)
    showToast('Удалено')
  } catch {
    showToast('Не удалось удалить')
  }
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
  if (img && !img.complete)
    await new Promise((res) => {
      img.onload = res
      img.onerror = res
    })
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
            <th class="px-3 py-2">Просмотрено</th>
            <th class="px-3 py-2">Отчёт / Действия</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="p in rows"
            :key="p.id"
            class="border-t hover:bg-gray-50 cursor-pointer"
            @click="onRowClick(p)"
          >
            <td class="px-3 py-2 font-semibold whitespace-nowrap">{{ p.createdAt }}</td>

            <td class="px-3 py-2">
              <template v-if="isAdmin && editRowId === p.id">
                <select
                  v-model="draft.type_incident_id"
                  class="text-sm bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-0 w-44"
                >
                  <option v-for="t in typeOptions" :key="t.id" :value="t.id">{{ t.label }}</option>
                </select>
              </template>
              <template v-else>
                {{ p.typeName }}
              </template>
            </td>

            <td class="px-3 py-2">
              <template v-if="isAdmin && editRowId === p.id">
                <div class="flex gap-2">
                  <input
                    v-model="draft.lat"
                    class="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200 w-32"
                    placeholder="Широта (55.x)"
                  />
                  <input
                    v-model="draft.lon"
                    class="text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200 w-32"
                    placeholder="Долгота (37.x)"
                  />
                </div>
              </template>
              <template v-else>
                <button
                  class="font-mono text-blue-600 hover:underline"
                  title="Скопировать ссылку на это место"
                  @click.stop="copyCoordsLink(p)"
                >
                  {{ p.coords }}
                </button>
              </template>
            </td>

            <!-- фото -->
            <td class="px-3 py-2">
              <button
                @click.stop="openPhotos(p)"
                class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                Показать
              </button>
            </td>

            <td class="px-3 py-2">
              <template v-if="isAdmin && editRowId === p.id">
                <select
                  v-model="draft.status_id"
                  class="text-sm bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-0 w-44"
                >
                  <option v-for="s in statusOptions" :key="s.id" :value="s.id">
                    {{ s.label }}
                  </option>
                </select>
              </template>
              <template v-else>
                <select
                  :value="p.status_id"
                  :disabled="savingInline.has(p.id)"
                  class="text-sm bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-0 w-44"
                  @change.stop="updateField(p.id, { status_id: Number($event.target.value) })"
                  title="Изменить статус"
                >
                  <option v-for="s in statusOptions" :key="s.id" :value="s.id">
                    {{ s.label }}
                  </option>
                </select>
              </template>
            </td>

            <td class="px-3 py-2">
              <template v-if="isAdmin && editRowId === p.id">
                <select
                  v-model="draft.is_seen"
                  class="text-sm bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-0 w-28"
                >
                  <option :value="false">Нет</option>
                  <option :value="true">Да</option>
                </select>
              </template>
              <template v-else>
                <select
                  :value="p.is_seen ? 'true' : 'false'"
                  :disabled="savingInline.has(p.id)"
                  class="text-sm bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-0 w-28"
                  @change.stop="updateField(p.id, { is_seen: $event.target.value === 'true' })"
                  title="Пометить как просмотрено"
                >
                  <option value="false">Нет</option>
                  <option value="true">Да</option>
                </select>
              </template>
            </td>

            <!-- отчёт / действия -->
            <td class="px-3 py-2">
              <div class="flex items-center gap-2">
                <button
                  @click.stop="printReport(p)"
                  class="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                >
                  Скачать PDF-отчёт
                </button>

                <template v-if="isAdmin">
                  <template v-if="editRowId === p.id">
                    <button
                      @click.stop="saveEditRow"
                      class="px-2 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600"
                    >
                      💾
                    </button>
                    <button
                      @click.stop="cancelEditRow"
                      class="px-2 py-1 rounded bg-gray-300 hover:bg-gray-400"
                    >
                      ✖️
                    </button>
                  </template>
                  <template v-else>
                    <button
                      @click.stop="startEditRow(p)"
                      class="px-2 py-1 rounded bg-emerald-400 text-white hover:bg-emerald-500"
                    >
                      ✏️
                    </button>
                    <button
                      @click.stop="removeRow(p.id)"
                      class="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                    >
                      🗑
                    </button>
                  </template>
                </template>
              </div>
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
        <div v-if="photosLoading" class="p-6 text-sm text-gray-500">Загрузка фото…</div>
        <div v-else class="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <a
            v-for="(url, i) in selectedPhotos"
            :key="i"
            :href="url"
            target="_blank"
            rel="noopener"
            class="block"
          >
            <img :src="url" class="w-full h-48 object-cover rounded-lg border" alt="Фото" />
          </a>
          <p v-if="selectedPhotos.length === 0" class="text-sm text-gray-500">Файлы не найдены</p>
        </div>
      </div>
    </div>

    <!-- печать -->
    <div class="print:block hidden">
      <article v-if="printingProblem" class="p-6">
        <h1 class="text-2xl font-bold mb-2">Отчёт по эко-проблеме #{{ printingProblem.id }}</h1>
        <img
          v-if="printMapUrl"
          :src="printMapUrl"
          id="printMapImg"
          alt="Карта инцидента"
          class="w-full rounded-lg border mb-4"
        />
        <p class="text-sm text-gray-600 mb-4">Координаты: {{ printingProblem.coords }}</p>
        <p class="mb-2"><strong>Тип нарушения:</strong> {{ printingProblem.typeName }}</p>
        <p class="mb-2"><strong>Статус проверки:</strong> {{ printingProblem.statusName }}</p>
        <p class="mt-6 text-xs text-gray-500">Сформировано автоматически в админ-панели</p>
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
  .interactive-map {
    display: none !important;
  }
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    background: white;
  }
}
</style>
