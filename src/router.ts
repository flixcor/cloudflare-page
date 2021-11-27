import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory
} from 'vue-router'

export const createRouter = () => _createRouter({
  // use appropriate history implementation for server/client
  // import.meta.env.SSR is injected by Vite.
  history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
  routes: [
      {
        path: '/about',
        component: () => import('./components/About.vue')
      },
      {
          path: '/:pathMatch(.*)',
          component: () => import('./components/HelloWorld.vue'),
          props: {
            msg: 'Home'
          }
      }
  ]
})
