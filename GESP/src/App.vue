<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main class="main-content">
    <RouterView />
  </main>
</template>

<style scoped>
.app-wrapper {
  width: 50vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 主内容区域，为导航栏留出空间 */
.main-content {
  padding-top: 60px; /* 与导航栏高度一致 */
  min-height: calc(100vh - 60px);
  width: 100%;
  flex: 1;
  /* 移除 max-width 限制，让内容占满整个屏幕 */
}
</style>
