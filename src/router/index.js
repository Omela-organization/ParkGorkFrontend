import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

import AdminPanel from '@/pages/AdminPanel.vue'
import EcoAnalysis from '@/pages/EcoAnalysis.vue'
import WikiFill from '@/pages/WikiFill.vue'
import UsersPage from '@/pages/Users.vue'
import NewsEditor from '@/pages/NewsEditor.vue'
import LoginPage from '@/pages/Login.vue'

const routes = [
  {
    path: '/',
    component: AdminLayout,
    children: [
      {
        path: 'admin',
        name: 'AdminPanel',
        component: AdminPanel,
        meta: { label: 'Административная панель', roles: ['admin'] },
      },
      {
        path: 'eco-analysis',
        name: 'EcoAnalysis',
        component: EcoAnalysis,
        meta: { label: 'Анализ Экопроблем', roles: ['ecologist'] },
      },
      {
        path: 'wiki-fill',
        name: 'WikiFill',
        component: WikiFill,
        meta: { label: 'Заполнение Wiki', roles: ['ecologist'] },
      },
      {
        path: 'users',
        name: 'Users',
        component: UsersPage,
        meta: { label: 'Пользователи', roles: ['pr'] },
      },
      {
        path: 'news-editor',
        name: 'NewsEditor',
        component: NewsEditor,
        meta: { label: 'Редактирование Новостной Ленты', roles: ['pr'] },
      },
      {
        path: '',
        name: 'RootRedirect',
        redirect: (to) => {
          const { role } = JSON.parse(localStorage.getItem('auth') || '{}')
          const roleLanding = {
            admin: 'AdminPanel',
            ecologist: 'EcoAnalysis',
            pr: 'Users',
          }
          return { name: roleLanding[role] || 'Login' }
        },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: AuthLayout,
    children: [{ path: '', component: LoginPage }],
    meta: { roles: ['guest'] },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
