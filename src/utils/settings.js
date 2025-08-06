const API_HOST = import.meta.env.VITE_API_URL || ''

const withPort = (port) => (port ? `${API_HOST}:${port}` : API_HOST)

export const API_BASE_AUTH = withPort(import.meta.env.VITE_API_AUTH_PORT)
console.log(API_BASE_AUTH)
export const API_BASE_ECO = withPort(import.meta.env.VITE_API_ECO_PORT)
export const API_BASE_ENTERTAINMENT = withPort(import.meta.env.VITE_API_ENTERTAINMENT_PORT)
export const API_BASE_STORAGE = withPort(import.meta.env.VITE_API_STORAGE_PORT)

export const API_PREFIX = import.meta.env.VITE_API_PREFIX
export const REQUEST_TIMEOUT = import.meta.env.VITE_REQUEST_TIMEOUT
