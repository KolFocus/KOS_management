<template>
  <div id="app">
    <!-- 加载状态 -->
    <div v-if="!authStore.initialized" class="loading-container">
      <el-loading
        element-loading-text="正在初始化..."
        element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(0, 0, 0, 0.8)"
        style="width: 100%"
      />
    </div>
    
    <!-- 主要内容 -->
    <div v-else>
      <!-- 已登录且路由不是登录页时显示Layout，避免在 /login 上闪现侧边栏 -->
      <Layout v-if="showLayout" />
      
      <!-- 否则渲染当前路由页面（含登录页） -->
      <router-view v-else />
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Layout from '@/components/Layout.vue'

const authStore = useAuthStore()
const route = useRoute()

// 仅当已登录且当前路由不是登录页时才渲染主布局
const showLayout = computed(() => authStore.isAuthenticated && route.path !== '/login')

// 初始化认证状态
onMounted(async () => {
  await authStore.initAuth()
})
</script>

<style>
#app {
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #f5f7fa;
}

/* 全局样式重置 */
html, body {
  height: 100%;
  overflow: hidden;
}

/* Element Plus 样式覆盖 */
:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-button) {
  border-radius: 6px;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-pagination) {
  justify-content: center;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>

<!-- 全局覆盖：强制移除 Element Plus 内联子菜单白色背景 -->
<style>
.el-menu--inline,
.el-sub-menu .el-menu {
  background-color: #2b394a !important; /* 二级更暗一档 */
}

.el-sub-menu__title,
.el-menu-item {
  background-color: #304156 !important; /* 一级保持 */
  color: #bfcbd9 !important;
}

.el-menu-item:hover,
.el-menu-item.is-active {
  background-color: #409eff !important;
  color: #fff !important;
}
</style>
