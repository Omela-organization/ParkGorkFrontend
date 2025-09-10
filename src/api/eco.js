import { ecoApi } from '@/api/core'

export const fetchEcoProblems = () => ecoApi.get('/eco_problems/').then((r) => r.data)

export const fetchEcoProblemById = (id) => ecoApi.get(`/eco_problems/${id}`).then((r) => r.data)

export const fetchStatuses = () => ecoApi.get('/statuses/').then((r) => r.data)

export const fetchTypeIncidents = () => ecoApi.get('/type_incidents/').then((r) => r.data)

export const fetchWikis = () => ecoApi.get('/wiki/').then((r) => r.data)

export const fetchWikiById = (id) => ecoApi.get(`/wiki/${id}`).then((r) => r.data)

export const createWiki = (payload) =>
  ecoApi.post('/wiki/create', payload).then((r) => r.data)

export const updateWiki = (id, payload) =>
  ecoApi.put(`/wiki/update/${id}`, payload).then((r) => r.data)

export const deleteWiki = (id) => ecoApi.delete(`/wiki/delete/${id}`)

export const uploadWikiFiles = (id, files) => {
  const form = new FormData()
  ;[...files].forEach((f) => form.append('files', f))
  return ecoApi
    .post(`/wiki_files/upload_files`, form, {
      params: { wiki_id: id },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}
