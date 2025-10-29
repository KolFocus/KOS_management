import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: {
        title: '用户登录',
        requiresAuth: false
      }
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/ResetPassword.vue'),
      meta: {
        title: '重置密码',
        requiresAuth: false
      }
    },
    {
      path: '/',
      redirect: '/kos-list'
    },
    {
      path: '/kos-list',
      name: 'KosList',
      component: () => import('@/views/KosList.vue'),
      meta: {
        title: 'KOS列表管理',
        requiresAuth: true
      }
    },
    {
      path: '/sales-data',
      name: 'SalesData',
      component: () => import('@/views/SalesData.vue'),
      meta: {
        title: 'KOS销售数据管理',
        requiresAuth: true
      }
    },
    {
      path: '/retail-analysis',
      name: 'RetailAnalysis',
      component: () => import('@/views/RetailAnalysis.vue'),
      meta: {
        title: '零售分析',
        requiresAuth: true
      }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/Profile.vue'),
      meta: {
        title: '个人资料',
        requiresAuth: true
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      redirect: '/login'
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - KOS管理系统`
  }

  // 如果认证状态还未初始化，等待初始化完成
  if (!authStore.initialized) {
    await authStore.initAuth()
  }

  // 如果路由需要认证
  if (to.meta.requiresAuth) {
    // 检查用户是否已登录
    if (!authStore.isAuthenticated) {
      // 未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      // 已登录，允许访问
      next()
    }
  } else {
    // 不需要认证的路由
    if (to.path === '/login' && authStore.isAuthenticated) {
      // 如果已登录且访问登录页，重定向到首页
      next('/')
    } else {
      next()
    }
  }
})

export default router

