import { createRouter, createWebHistory } from 'vue-router'
import expenseCard from '../views/expenseCard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'expensecard',
      component: expenseCard,
    },
    
  ],
})

export default router
