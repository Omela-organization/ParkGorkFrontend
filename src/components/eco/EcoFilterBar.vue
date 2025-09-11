<script setup>
import { computed, reactive, toRefs, watch, toRaw } from 'vue'

const props = defineProps({
  /** v-model */
  modelValue: {
    type: Object,
    default: () => ({
      q: '',
      dateFrom: '',
      dateTo: '',
      statuses: [],
      types: [],
      seen: 'all',
      onlyInView: false,
      sortBy: 'created_at',
      sortDir: 'desc',
    }),
  },
  /** [{ id, label }] */
  statusOptions: { type: Array, default: () => [] },
  /** [{ id, label }] */
  typeOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

/** локальная копия, чтобы v-model не дёргался на каждом keypress */
const f = reactive({ ...props.modelValue })

watch(
  () => props.modelValue,
  (v) => Object.assign(f, v || {}),
  { deep: true, immediate: true },
)

function push() {
  // отдаём «чистый» объект наружу
  emit('update:modelValue', JSON.parse(JSON.stringify(toRaw(f))))
}

function resetAll() {
  Object.assign(f, {
    q: '',
    dateFrom: '',
    dateTo: '',
    statuses: [],
    types: [],
    seen: 'all',
    onlyInView: false,
    sortBy: 'created_at',
    sortDir: 'desc',
  })
  push()
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-3 flex flex-wrap items-end gap-3">
    <!-- Поиск -->
    <label class="flex flex-col gap-1">
      <span class="text-xs text-gray-500">Поиск</span>
      <input
        v-model="f.q"
        @input="push"
        type="text"
        placeholder="текст в заголовке/описании"
        class="px-2 py-1 border rounded w-56"
      />
    </label>

    <!-- Даты -->
    <label class="flex flex-col gap-1">
      <span class="text-xs text-gray-500">c даты</span>
      <input v-model="f.dateFrom" @change="push" type="date" class="px-2 py-1 border rounded" />
    </label>
    <label class="flex flex-col gap-1">
      <span class="text-xs text-gray-500">по дату</span>
      <input v-model="f.dateTo" @change="push" type="date" class="px-2 py-1 border rounded" />
    </label>

    <!-- Статусы -->
    <label class="flex flex-col gap-1">
      <span class="text-xs text-gray-500">Статусы</span>
      <select
        multiple
        v-model="f.statuses"
        @change="push"
        class="px-2 py-1 border rounded min-w-[12rem]"
        size="4"
      >
        <option v-for="s in statusOptions" :key="s.id" :value="s.id">{{ s.label }}</option>
      </select>
    </label>

    <!-- Типы -->
    <label class="flex flex-col gap-1">
      <span class="text-xs text-gray-500">Типы</span>
      <select
        multiple
        v-model="f.types"
        @change="push"
        class="px-2 py-1 border rounded min-w-[12rem]"
        size="4"
      >
        <option v-for="t in typeOptions" :key="t.id" :value="t.id">{{ t.label }}</option>
      </select>
    </label>

    <!-- Просмотрено -->
    <label class="flex flex-col gap-1">
      <span class="text-xs text-gray-500">Просмотрено</span>
      <select v-model="f.seen" @change="push" class="px-2 py-1 border rounded w-28">
        <option value="all">Все</option>
        <option value="true">Да</option>
        <option value="false">Нет</option>
      </select>
    </label>

    <!-- Только в кадре карты -->
    <label class="flex items-center gap-2 mb-1">
      <input type="checkbox" v-model="f.onlyInView" @change="push" />
      <span class="text-sm">Только в кадре карты</span>
    </label>

    <!-- Сортировка -->
    <label class="flex flex-col gap-1">
      <span class="text-xs text-gray-500">Сортировка</span>
      <div class="flex items-center gap-2">
        <select v-model="f.sortBy" @change="push" class="px-2 py-1 border rounded">
          <option value="created_at">По дате</option>
          <option value="status_id">По статусу</option>
          <option value="type_incident_id">По типу</option>
          <option value="is_seen">По отметке просмотра</option>
        </select>
        <select v-model="f.sortDir" @change="push" class="px-2 py-1 border rounded">
          <option value="desc">↓ убыв.</option>
          <option value="asc">↑ возр.</option>
        </select>
      </div>
    </label>

    <button class="ml-auto px-3 py-2 rounded bg-gray-100 hover:bg-gray-200" @click="resetAll">
      Сбросить
    </button>
  </div>
</template>
