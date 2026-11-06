import { createRouter, createWebHistory } from 'vue-router'
import todoList from '../views/todoList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/todolist',
      name: 'todolist',
      component: todoList,
    }
  ],
})

export default router
