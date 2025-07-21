import axios from 'axios'
import { useAuth } from '@/stores/auth'
import {
  API_BASE_AUTH,
  API_BASE_ECO,
  API_BASE_ENTERTAINMENT,
  API_BASE_STORAGE,
  API_PREFIX,
  REQUEST_TIMEOUT,
} from '@/config/settings'

function createClient(baseURL) {
  const client = axios.create({
    baseURL: `${baseURL}${API_PREFIX}`,
    timeout: REQUEST_TIMEOUT,
  })

  client.interceptors.request.use((config) => {
    const auth = useAuth()
    if (auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`
    }
    return config
  })

  client.interceptors.response.use(
    (r) => r,
    async (error) => {
      const auth = useAuth()
      const original = error.config

      if (error.response?.status === 401 && !original._retry && auth.refreshToken) {
        original._retry = true
        try {
          await auth.refreshTokenLoop() // обновляем в сторе
          original.headers.Authorization = `Bearer ${auth.accessToken}`
          return client(original) // повторяем запрос
        } catch (_) {
          auth.logout()
        }
      }
      return Promise.reject(error)
    },
  )

  return client
}

export const authApi = createClient(API_BASE_AUTH)
export const ecoApi = createClient(API_BASE_ECO)
export const entertainmentApi = createClient(API_BASE_ENTERTAINMENT)
export const storageApi = createClient(API_BASE_STORAGE)
