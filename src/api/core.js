import axios from 'axios'
import { useAuth } from '@/stores/auth'
import { refresh as apiRefresh } from '@/api/auth'
import {
  API_BASE_AUTH,
  API_BASE_ECO,
  API_BASE_ENTERTAINMENT,
  API_BASE_STORAGE,
  API_PREFIX,
  REQUEST_TIMEOUT,
} from '@/utils/settings'

let isRefreshing = false
let pendingQueue = []

function enqueueRequest(config) {
  return new Promise((resolve, reject) => {
    pendingQueue.push({ resolve, reject, config })
  })
}

function flushQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) return reject(error)
    if (token) config.headers.Authorization = `Bearer ${token}`
    resolve(axios(config))
  })
  pendingQueue = []
}

async function doRefreshToken(auth) {
  if (!auth?.refreshToken) throw new Error('No refresh token')
  const data = await apiRefresh(auth.refreshToken)
  const newAccess = data.access_token || data.access || data.token
  const newRefresh = data.refresh_token || data.refresh
  if (!newAccess) throw new Error('No access token in refresh response')

  if (typeof auth.setTokens === 'function') {
    auth.setTokens({
      accessToken: newAccess,
      refreshToken: newRefresh || auth.refreshToken,
      accessExpiresAt: data.access_expires_at || null,
    })
  } else {
    auth.accessToken = newAccess
    if (newRefresh) auth.refreshToken = newRefresh
  }
  return newAccess
}

function createClient(baseURL) {
  const client = axios.create({
    baseURL: `${baseURL}${API_PREFIX}`,
    timeout: REQUEST_TIMEOUT,
  })

  client.interceptors.request.use((config) => {
    const auth = useAuth()
    if (auth?.accessToken) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${auth.accessToken}`
    }
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const { response, config } = error
      const originalRequest = config
      if (!response) return Promise.reject(error) // сеть/таймаут

      if (response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        const auth = useAuth()

        if (!auth?.refreshToken) {
          if (typeof auth.logout === 'function') auth.logout()
          return Promise.reject(error)
        }

        if (isRefreshing) {
          return enqueueRequest(originalRequest)
        }

        isRefreshing = true
        try {
          const newAccess = await doRefreshToken(auth)
          isRefreshing = false
          flushQueue(null, newAccess)
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${newAccess}`
          return client(originalRequest)
        } catch (e) {
          isRefreshing = false
          flushQueue(e, null)
          if (typeof auth.logout === 'function') auth.logout()
          return Promise.reject(e)
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
