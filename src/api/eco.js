import { ecoApi } from '@/api/core'

export const fetchEcoProblems = () => ecoApi.get('/eco_problems/').then((r) => r.data)

export const fetchEcoProblemById = (id) => ecoApi.get(`/eco_problems/${id}`).then((r) => r.data)

export const fetchStatuses = () => ecoApi.get('/statuses/').then((r) => r.data)

export const fetchTypeIncidents = () => ecoApi.get('/type_incidents/').then((r) => r.data)
