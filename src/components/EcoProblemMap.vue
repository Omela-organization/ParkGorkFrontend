<script setup>
import { onMounted, ref, watch, defineExpose } from 'vue'

const props = defineProps({
  points: { type: Array, default: () => [] },
})

const mapRoot = ref(null)
let map
let placemarks = []

function loadYandexMaps() {
  return new Promise((resolve, reject) => {
    if (window.ymaps?.ready) {
      window.ymaps.ready(resolve)
      return
    }
    const apikey = import.meta.env.VITE_YANDEX_MAPS_API_KEY
    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${apikey ? `&apikey=${apikey}` : ''}`
    script.async = true
    script.onload = () => window.ymaps.ready(resolve)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function clearPlacemarks() {
  if (!map || !placemarks.length) return
  placemarks.forEach((p) => map.geoObjects.remove(p))
  placemarks = []
}

function drawPoints() {
  if (!map) return
  clearPlacemarks()
  props.points.forEach((p) => {
    const pm = new window.ymaps.Placemark(
      [Number(p.latitude), Number(p.longitude)],
      { balloonContentHeader: p.title || `Эко-проблема #${p.id}` },
      { preset: 'islands#redIcon' },
    )
    placemarks.push(pm)
    map.geoObjects.add(pm)
  })
}

function fitToPoints() {
  if (!map || !placemarks.length) return
  const bounds = window.ymaps.geoQuery(placemarks).getBounds()
  if (bounds) map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 })
}

async function init() {
  await loadYandexMaps()
  map = new window.ymaps.Map(mapRoot.value, {
    center: [55.73, 37.62],
    zoom: 12,
    controls: ['zoomControl', 'typeSelector', 'geolocationControl'],
  })
  drawPoints()
  fitToPoints()
}

onMounted(init)

watch(
  () => props.points,
  () => {
    if (!window.ymaps || !map) return
    drawPoints()
    fitToPoints()
  },
  { deep: true },
)

function focusOn(problem) {
  if (!map || !problem) return
  const lat = Number(problem.latitude)
  const lon = Number(problem.longitude)
  map.setCenter([lat, lon], 16, { duration: 300 })
}

defineExpose({ focusOn })
</script>

<template>
  <div
    ref="mapRoot"
    class="w-full h-[40vh] rounded-2xl overflow-hidden border border-gray-200"
  ></div>
</template>
