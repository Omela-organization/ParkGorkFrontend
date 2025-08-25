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

function loadYandexMaps() {
  return new Promise((resolve, reject) => {
    const makeSrc = (key) =>
      `https://api-maps.yandex.ru/2.1/?lang=ru_RU${key ? `&apikey=${key}` : ''}`

    try {
      delete window.ymaps
    } catch (_) {
      window.ymaps = undefined
    }
    document.querySelectorAll('script[src*="api-maps.yandex"]').forEach((s) => s.remove())

    const script = document.createElement('script')
    script.src = makeSrc(YANDEX_MAPS_API_KEY)
    script.async = true

    let settled = false
    script.onload = () => {
      if (!window.ymaps?.ready) {
        settled = true
        reject(new Error('ymaps not found after load'))
        return
      }
      window.ymaps.ready(() => {
        settled = true
        resolve()
      })

      setTimeout(() => {
        if (settled) return
        console.warn('Yandex Maps: timeout, retry without apikey (dev fallback)')
        document.querySelectorAll('script[src*="api-maps.yandex"]').forEach((s) => s.remove())
        try {
          delete window.ymaps
          // eslint-disable-next-line no-unused-vars
        } catch (_) {
          window.ymaps = undefined
        }

        const s2 = document.createElement('script')
        s2.src = makeSrc('')
        s2.async = true
        s2.onload = () =>
          window.ymaps?.ready(() => {
            settled = true
            resolve()
          })
        s2.onerror = (e) => {
          settled = true
          reject(e)
        }
        document.head.appendChild(s2)
      }, 4000)
    }

    script.onerror = (e) => reject(e)
    document.head.appendChild(script)
  })
}

function clearMarkers() {
  if (!map || !markers.length) return
  markers.forEach((m) => map.removeChild(m))
  markers = []
}

function drawPoints() {
  if (!map) return
  clearMarkers()
  props.points.forEach((p) => {
    const el = document.createElement('div')
    el.className = 'w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow'
    // ВАЖНО: v3 ждёт [долгота, широта]
    const marker = new ymaps3.YMapMarker(
      { coordinates: [Number(p.longitude), Number(p.latitude)] },
      el,
    )
    markers.push(marker)
    map.addChild(marker)
  })
}

function fitToPoints() {
  if (!map || !markers.length) return
  let minLon = 180,
    minLat = 90
  let maxLon = -180,
    maxLat = -90
  props.points.forEach((p) => {
    const lon = Number(p.longitude),
      lat = Number(p.latitude)
    if (isFinite(lon) && isFinite(lat)) {
      minLon = Math.min(minLon, lon)
      minLat = Math.min(minLat, lat)
      maxLon = Math.max(maxLon, lon)
      maxLat = Math.max(maxLat, lat)
    }
  })
  if (minLon <= maxLon && minLat <= maxLat) {
    map.update({
      location: {
        bounds: [
          [minLon, minLat],
          [maxLon, maxLat],
        ],
      },
    })
  }
}

async function init() {
  try {
    await loadYandexMaps()
    map = new window.ymaps.Map(mapRoot.value, {
      center: [55.73, 37.62],
      zoom: 12,
      controls: ['zoomControl', 'typeSelector', 'geolocationControl'],
    })
    drawPoints()
    fitToPoints()
  } catch (e) {
    console.error('Yandex Maps load error:', e)
    mapError.value = 'Карта не загрузилась. Проверь API-ключ/ограничения и блокировщики.'
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
  const lon = Number(problem.longitude)
  const lat = Number(problem.latitude)
  map.update({ location: { center: [lon, lat], zoom: 16 }, duration: 300 })
}

defineExpose({ focusOn })
</script>

<template>
  <div class="w-full h-[40vh] rounded-2xl overflow-hidden border border-gray-200">
    <div v-if="mapError" class="p-3 text-sm bg-red-50 text-red-700">
      {{ mapError }} (см. консоль и вкладку Network → api-maps.yandex.ru)
    </div>
    <div v-else ref="mapRoot" class="w-full h-full"></div>
  </div>
</template>
