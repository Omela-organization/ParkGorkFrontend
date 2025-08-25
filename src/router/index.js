import { createRouter, createWebHistory } from 'vue-router'
import BaseLayout from '@/layouts/BaseLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

import AdminPanel from '@/pages/admin/AdminPanel.vue'
import EcoAnalysis from '@/pages/EcoAnalysis.vue'
import WikiFill from '@/pages/WikiFill.vue'
import UsersPage from '@/pages/Users.vue'
import NewsEditor from '@/pages/NewsEditor.vue'
import LoginPage from '@/pages/LoginPage.vue'

const routes = [
  {
    path: '/',
    component: BaseLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'HomeByRole',
      },
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
    ],
  },
  {
    path: '/login',
    component: AuthLayout,
    children: [{ path: '', name: 'Login', component: LoginPage }],
    meta: { guestOnly: true },
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
