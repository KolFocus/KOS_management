<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon><Platform /></el-icon>
          <span v-if="!sidebarCollapsed" class="logo-text">KOS管理系统</span>
        </div>
        <el-button 
          type="text" 
          @click="toggleSidebar"
          class="collapse-btn"
        >
          <el-icon>
            <component :is="sidebarCollapsed ? 'Expand' : 'Fold'" />
          </el-icon>
        </el-button>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/kos-list">
          <el-icon><User /></el-icon>
          <template #title>KOS列表管理</template>
        </el-menu-item>
        
        <el-menu-item index="/sales-data">
          <el-icon><TrendCharts /></el-icon>
          <template #title>KOS销售数据管理</template>
        </el-menu-item>
      </el-menu>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶部导航 -->
      <div class="top-nav">
        <div class="nav-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="nav-right">
          <!-- 品牌关联按钮 -->
          <el-button 
            type="primary" 
            @click="showBrandManagement"
            class="brand-btn"
          >
            <el-icon><Connection /></el-icon>
            品牌关联
          </el-button>
          
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="authStore.userAvatar">
                <el-icon v-if="!authStore.userAvatar"><User /></el-icon>
              </el-avatar>
              <span class="username">{{ authStore.userName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 页面内容 -->
      <div class="page-content">
        <router-view />
      </div>
    </div>

    <!-- 品牌管理对话框 -->
    <el-dialog
      v-model="brandDialogVisible"
      title="关联管理"
      width="90%"
      :close-on-click-modal="false"
      class="brand-management-dialog"
    >
      <BrandManagement />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MessageUtils } from '@/utils/common'
import BrandManagement from './BrandManagement.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const sidebarCollapsed = ref(false)
const brandDialogVisible = ref(false)

// 计算属性
const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const showBrandManagement = () => {
  brandDialogVisible.value = true
}

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      MessageUtils.info('系统设置功能开发中...')
      break
    case 'logout':
      MessageUtils.confirm('确定要退出登录吗？').then(async () => {
        try {
          const result = await authStore.logout()
          if (result.success) {
            MessageUtils.success('已退出登录')
            router.push('/login')
          } else {
            // 即使登出失败，也跳转到登录页面
            console.warn('登出过程中出现问题，但已清理本地状态')
            router.push('/login')
          }
        } catch (error) {
          console.error('退出登录时发生错误:', error)
          // 即使出错也跳转到登录页面
          router.push('/login')
        }
      }).catch(() => {
        // 用户取消
      })
      break
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

.sidebar {
  width: 200px;
  background: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #263445;
  border-bottom: 1px solid #434a50;
}

.logo {
  display: flex;
  align-items: center;
  color: #bfcbd9;
  font-size: 18px;
  font-weight: 600;
}

.logo .el-icon {
  font-size: 24px;
  margin-right: 8px;
}

.logo-text {
  white-space: nowrap;
}

.collapse-btn {
  color: #bfcbd9;
  font-size: 16px;
}

.sidebar-menu {
  border: none;
  background: #304156;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 200px;
}

:deep(.sidebar-menu .el-menu-item) {
  color: #bfcbd9;
  border-bottom: 1px solid #434a50;
}

:deep(.sidebar-menu .el-menu-item:hover) {
  background-color: #263445;
  color: #fff;
}

:deep(.sidebar-menu .el-menu-item.is-active) {
  background-color: #409eff;
  color: #fff;
}

:deep(.sidebar-menu .el-menu-item .el-icon) {
  margin-right: 8px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.nav-left {
  flex: 1;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-btn {
  margin-right: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  margin: 0 8px;
  color: #303133;
  font-size: 14px;
}

.page-content {
  flex: 1;
  overflow: auto;
}

:deep(.el-breadcrumb) {
  font-size: 14px;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #303133;
  font-weight: 600;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
}

:deep(.el-dropdown-menu__item .el-icon) {
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .top-nav {
    padding: 0 16px;
  }
  
  .username {
    display: none;
  }
}

/* 滚动条样式 */
:deep(.el-scrollbar__bar) {
  right: 0;
  bottom: 0;
}

:deep(.el-scrollbar__thumb) {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 4px;
}

:deep(.el-scrollbar__thumb:hover) {
  background-color: rgba(144, 147, 153, 0.5);
}

/* 品牌管理对话框样式 */
:deep(.brand-management-dialog .el-dialog__body) {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.brand-management-dialog .el-dialog) {
  margin-top: 5vh;
}
</style>

