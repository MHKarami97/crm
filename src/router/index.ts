import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/people',
    },
    {
      path: '/people',
      name: 'People',
      component: () => import('@/views/PeopleView.vue'),
    },
    {
      path: '/graph',
      name: 'Graph',
      component: () => import('@/views/GraphView.vue'),
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/people',
    },
  ],
})

export default router
