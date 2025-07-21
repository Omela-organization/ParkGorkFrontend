import { authApi } from './core'

export const login = (email, password) =>
  authApi.post('/authorization/login', null, { params: { email, password } }).then((r) => r.data)

export const registration = (payload) =>
  authApi.post('/authorization/registration', payload).then((r) => r.data)

export const refresh = (refresh_token) =>
  authApi.post('/authorization/refresh-token', { refresh_token }).then((r) => r.data)

export const infoByToken = () => authApi.get('/authorization/info-by-token').then((r) => r.data)

export const forgotPassword = (email) =>
  authApi.post('/authorization/forgot-password', null, { params: { email } }).then((r) => r.data)

export const resetPassword = (old_password, new_password) =>
  authApi
    .post('/authorization/reset-password', null, { params: { old_password, new_password } })
    .then((r) => r.data)

export const changeRole = (user_id, role_id) =>
  authApi
    .put('/authorization/change-role', null, { params: { user_id, role_id } })
    .then((r) => r.data)

export const fetchProfiles = () => authApi.get('/profiles/').then((r) => r.data)
export const createProfile = (payload) => authApi.post('/profiles/', payload).then((r) => r.data)
export const fetchProfile = (profile_id) =>
  authApi.get(`/profiles/${profile_id}`).then((r) => r.data)
export const updateProfile = (profile_id, payload) =>
  authApi.put(`/profiles/${profile_id}`, payload).then((r) => r.data)
export const deleteProfile = (profile_id) => authApi.delete(`/profiles/${profile_id}`)
export const getProfileByUserId = (user_id) =>
  authApi.get(`/profiles/${user_id}`).then((r) => r.data)
export const fetchProfileInfo = (profile_id) =>
  authApi.get(`/profiles/info/${profile_id}`).then((r) => r.data)

export const fetchUsers = () => authApi.get('/users/').then((r) => r.data)
export const createUser = (payload) => authApi.post('/users/', payload).then((r) => r.data)
export const fetchUser = (user_id) => authApi.get(`/users/${user_id}`).then((r) => r.data)
export const updateUser = (user_id, payload) =>
  authApi.put(`/users/${user_id}`, payload).then((r) => r.data)
export const deleteUser = (user_id) => authApi.delete(`/users/${user_id}`)

export const fetchRoles = () => authApi.get('/roles/').then((r) => r.data)
export const createRole = (payload) => authApi.post('/roles/', payload).then((r) => r.data)
export const fetchRole = (role_id) => authApi.get(`/roles/${role_id}`).then((r) => r.data)
export const updateRole = (role_id, payload) =>
  authApi.put(`/roles/${role_id}`, payload).then((r) => r.data)
export const deleteRole = (role_id) => authApi.delete(`/roles/${role_id}`)
