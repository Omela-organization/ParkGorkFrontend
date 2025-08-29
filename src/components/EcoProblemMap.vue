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
  markers.forEach((pm) => map.geoObjects.remove(pm))
  markers = []
}

function drawPoints() {
  if (!map) return
  clearMarkers()
  props.points.forEach((p) => {
    // ВАЖНО: v2.1 ждёт [широта, долгота]
    const pm = new window.ymaps.Placemark(
      [Number(p.latitude), Number(p.longitude)],
      { balloonContentHeader: p.title || `Эко-проблема #${p.id}` },
      { preset: 'islands#redIcon' },
    )
    markers.push(pm)
    map.geoObjects.add(pm)
  })
}

function focusOn(problem) {
  if (!map || !problem) return
  map.setCenter([Number(problem.latitude), Number(problem.longitude)], 18, { duration: 300 })
}

async function init() {
  try {
    await loadYandexMaps()
    map = new window.ymaps.Map(mapRoot.value, {
      center: [55.72936, 37.602431],
      zoom: 16,
      controls: ['zoomControl', 'typeSelector', 'geolocationControl'],
    })
    drawPoints()
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
  },
  { deep: true },
)

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
