import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import SelectLevelView from '../views/SelectLevelView.vue'
import GESPEaxmView from '../views/GESPEaxmView.vue'
import AdminView from '../views/AdminView.vue'
import LevelExamsView from '../views/LevelExamsView.vue'
import SubmissionDetailView from '../views/SubmissionDetailView.vue'

const routes = [
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/select', component: SelectLevelView },
  { path: '/select-level', component: SelectLevelView },
  { path: '/level-exams/:level', component: LevelExamsView },
  { path: '/practice/:examId', component: GESPEaxmView },
  { path: '/exam/:examId', component: GESPEaxmView },
  { path: '/submission/:submissionId', component: SubmissionDetailView },
  { path: '/submissions', component: () => import('../views/SubmissionsView.vue') },
  { path: '/gesp5', redirect: '/practice/1' }, // 保持向后兼容
  { path: '/admin', component: AdminView },
  { path: '/', redirect: '/select' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  // 允许未登录访问的页面
  const publicPages = ['/login', '/register']
  const isPublic = publicPages.includes(to.path)

  if (!isLoggedIn && !isPublic) {
    // 未登录且访问受保护页面，跳转到登录
    next('/login')
  } else if (isLoggedIn && isPublic) {
    // 已登录访问登录/注册页，跳转到主页面
    next('/select')
  } else {
    next()
  }
})

export default router
