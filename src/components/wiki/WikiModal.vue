<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { createWiki, updateWiki, uploadWikiFiles } from '@/api/eco.js'
import { useAuth } from '@/stores/auth'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initial: {
    type: Object,
    default: () => null, // { id?, name, description }
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const auth = useAuth()
const isEdit = computed(() => !!props.initial?.id)
const loading = ref(false)
const fileInput = ref(null)

// локальная форма
const form = reactive({
  name: '',
  description: '',
})

watch(
  () => props.initial,
  (val) => {
    form.name = val?.name ?? ''
    form.description = val?.description ?? ''
  },
  { immediate: true },
)

function close() {
  emit('update:modelValue', false)
}

async function onSubmit() {
  if (!auth?.user?.id) {
    alert('Не найден user_id. Проверь авторизацию.')
    return
  }
  loading.value = true
  try {
    const payload = {
      name: form.name,
      description: form.description,
      user_id: auth.user.id,
    }

    let wiki
    if (isEdit.value) {
      wiki = await updateWiki(props.initial.id, payload)
    } else {
      wiki = await createWiki(payload)
    }

    // загрузка файлов, если выбраны
    const files = fileInput.value?.files
    if (files && files.length > 0) {
      await uploadWikiFiles(wiki.id, files)
    }

    emit('saved', wiki)
    close()
  } catch (e) {
    console.error(e)
    alert('Ошибка при сохранении статьи')
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/40" @click="close"></div>

    <div class="relative w-full max-w-xl bg-white rounded-2xl shadow-xl">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <h3 class="text-lg font-semibold">
          {{ isEdit ? 'Редактировать статью' : 'Новая статья' }}
        </h3>
        <button class="p-2 rounded-lg hover:bg-gray-100" @click="close" aria-label="Close">
          ✕
        </button>
      </div>

      <form class="px-5 pt-4 pb-5 space-y-4" @submit.prevent="onSubmit">
        <div class="space-y-1">
          <label class="text-sm font-medium">Заголовок</label>
          <input
            v-model.trim="form.name"
            type="text"
            class="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
            placeholder="Название статьи"
            required
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium">Описание / контент</label>
          <textarea
            v-model.trim="form.description"
            rows="6"
            class="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
            placeholder="Краткое описание или текст статьи"
            required
          ></textarea>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium">Файлы (опционально)</label>
          <input
            ref="fileInput"
            type="file"
            multiple
            class="block w-full text-sm file:mr-3 file:rounded-lg file:border file:bg-white file:px-3 file:py-2 hover:file:bg-gray-50"
          />
          <p class="text-xs text-gray-500">Можно прикрепить изображения, документы и т.п.</p>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="rounded-xl border px-4 py-2 hover:bg-gray-50" @click="close">
            Отмена
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {{ loading ? 'Сохраняю…' : isEdit ? 'Сохранить' : 'Создать' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
