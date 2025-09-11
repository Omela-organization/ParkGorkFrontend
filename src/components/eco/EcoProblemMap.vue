<script setup>
import { onMounted, ref, watch, defineExpose } from 'vue'
import { YANDEX_MAPS_API_KEY } from '@/utils/settings.js'

const props = defineProps({
  points: { type: Array, default: () => [] },
})

const mapRoot = ref(null)
let map
let markers = []
const mapError = ref(null)

// ТЕПЕРЬ: latitude = 55.x (широта), longitude = 37.x (долгота)
function toLatLon(p) {
  const lat = Number(p.latitude)  // широта
  const lon = Number(p.longitude) // долгота
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return [lat, lon] // v2.1 ждёт [lat, lon]
}

function loadYandexMaps() {
  return new Promise((resolve, reject) => {
    const makeSrc = (key) =>
      `https://api-maps.yandex.ru/2.1/?lang=ru_RU${key ? `&apikey=${key}` : ''}`
    try { delete window.ymaps } catch (_) { window.ymaps = undefined }
    document.querySelectorAll('script[src*="api-maps.yandex"]').forEach((s) => s.remove())

    const script = document.createElement('script')
    script.src = makeSrc(YANDEX_MAPS_API_KEY)
    script.async = true
    script.onload = () => window.ymaps?.ready(resolve)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function clearMarkers() {
  if (!map || !markers.length) return
  markers.forEach((pm) => map.geoObjects.remove(pm))
  markers = []
}

function drawPoints() {
  if (!map) return
  clearMarkers()
  props.points.forEach((p) => {
    const ll = toLatLon(p)
    if (!ll) return
    const pm = new window.ymaps.Placemark(
      ll,
      { balloonContentHeader: p.title || `Эко-проблема #${p.id}` },
      { preset: 'islands#redIcon' },
    )
    markers.push(pm)
    map.geoObjects.add(pm)
  })
}

function fitToPoints() {
  if (!map || !markers.length) return
  const bounds = window.ymaps.geoQuery(markers).getBounds()
  if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 })
}

async function init() {
  try {
    await loadYandexMaps()
    map = new window.ymaps.Map(mapRoot.value, {
      center: [55.72936, 37.602431], // Москва
      zoom: 16,
      controls: ['zoomControl', 'typeSelector', 'geolocationControl'],
    })
    drawPoints()
    fitToPoints()
  } catch (e) {
    console.error('Yandex Maps load error:', e)
    mapError.value = 'Карта не загрузилась. Проверь API-ключ/ограничения.'
  }
}

onMounted(init)

watch(
  () => props.points,
  () => {
    if (!map) return
    drawPoints()
    fitToPoints()
  },
  { deep: true },
)

function focusOn(problem) {
  if (!map || !problem) return
  const ll = toLatLon(problem)
  if (!ll) return
  map.setCenter(ll, 16, { duration: 300 })
}

function getBounds() {
  if (!map) return null
  const b = map.getBounds()
  if (!b) return null
  // [[latSW, lonSW], [latNE, lonNE]]
  return { sw: { lat: b[0][0], lon: b[0][1] }, ne: { lat: b[1][0], lon: b[1][1] } }
}

defineExpose({ focusOn, getBounds })
</script>

<template>
  <div class="w-full h-[40vh] rounded-2xl overflow-hidden border border-gray-200">
    <div v-if="mapError" class="p-3 text-sm bg-red-50 text-red-700">
      {{ mapError }}
    </div>
    <div v-else ref="mapRoot" class="w-full h-full"></div>
  </div>
</template>
