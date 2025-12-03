import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 支持环境变量
  envPrefix: 'VITE_',
  // 构建优化配置
  build: {
    // 启用资源预加载
    rollupOptions: {
      output: {
        // 手动分包策略，优化资源加载
        manualChunks: {
          // 将 Vue 核心库单独打包
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          // 将大型第三方库单独打包
          'editor-vendor': ['codemirror', '@codemirror/view', '@codemirror/state'],
          // 将工具库单独打包
          'utils-vendor': ['axios', 'marked', 'katex'],
        },
        // 优化 chunk 文件名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 启用资源内联阈值（小于 4kb 的资源内联）
    assetsInlineLimit: 4096,
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留 console，方便调试
        drop_debugger: true,
      },
    },
    // 启用 sourcemap（生产环境可关闭）
    sourcemap: false,
    // 启用 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'codemirror',
      '@codemirror/view',
      '@codemirror/state',
    ],
  },
})
