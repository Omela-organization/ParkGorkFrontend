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

export const resetPassword = (oldPassword, newPassword) =>
  authApi
    .post('/authorization/reset-password', null, { params: { old_password: oldPassword, new_password: newPassword } })
    .then((r) => r.data)

export const changeRole = (userId, role_id) =>
  authApi
    .put('/authorization/change-role', null, { params: { user_id: userId, role_id } })
    .then((r) => r.data)

export const fetchProfiles = () => authApi.get('/profiles/').then((r) => r.data)
export const createProfile = (payload) => authApi.post('/profiles/', payload).then((r) => r.data)
export const fetchProfile = (profileId) =>
  authApi.get(`/profiles/${profileId}`).then((r) => r.data)
export const updateProfile = (profileId, payload) =>
  authApi.put(`/profiles/${profileId}`, payload).then((r) => r.data)
export const deleteProfile = (profileId) => authApi.delete(`/profiles/${profileId}`)
export const getProfileByUserId = (userId) =>
  authApi.get(`/profiles/${userId}`).then((r) => r.data)
export const fetchProfileInfo = (profileId) =>
  authApi.get(`/profiles/info/${profileId}`).then((r) => r.data)

export const fetchUsers = () => authApi.get('/users/').then((r) => r.data)
export const createUser = (payload) => authApi.post('/users/', payload).then((r) => r.data)
export const fetchUser = (userId) => authApi.get(`/users/${userId}`).then((r) => r.data)
export const updateUser = (userId, payload) =>
  authApi.put(`/users/${userId}`, payload).then((r) => r.data)
export const deleteUser = (userId) => authApi.delete(`/users/${userId}`)

export const fetchRoles = () => authApi.get('/roles/').then((r) => r.data)
export const createRole = (payload) => authApi.post('/roles/', payload).then((r) => r.data)
export const fetchRole = (roleId) => authApi.get(`/roles/${roleId}`).then((r) => r.data)
export const updateRole = (roleId, payload) =>
  authApi.put(`/roles/${roleId}`, payload).then((r) => r.data)
export const deleteRole = (roleId) => authApi.delete(`/roles/${roleId}`)
