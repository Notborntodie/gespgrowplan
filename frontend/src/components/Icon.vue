<template>
  <component 
    :is="iconComponent" 
    :size="size" 
    :stroke-width="strokeWidth" 
    :class="['lucide-icon', iconClass]"
    :style="iconStyle"
  />
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

// Font Awesome 到 Lucide 的映射表
const faToLucideMap: Record<string, string> = {
  'fa-book': 'BookOpen',
  'fa-arrow-right': 'ArrowRight',
  'fa-clock': 'Clock',
  'fa-file-alt': 'FileText',
  'fa-code': 'Code',
  'fa-calendar-alt': 'Calendar',
  'fa-spinner': 'Loader2',
  'fa-book-open': 'BookOpen',
  'fa-grip-lines-vertical': 'GripVertical',
  'fa-times': 'X',
  'fa-lock': 'Lock',
  'fa-inbox': 'Inbox',
  'fa-plus': 'Plus',
  'fa-refresh': 'RefreshCw',
  'fa-tasks': 'CheckSquare',
  'fa-chevron-left': 'ChevronLeft',
  'fa-chevron-right': 'ChevronRight',
  'fa-paper-plane': 'Send',
  'fa-info-circle': 'Info',
  'fa-lightbulb': 'Lightbulb',
  'fa-circle': 'Circle',
  'fa-stop': 'Square',
  'fa-download': 'Download',
  'fa-trash': 'Trash2',
  'fa-tachometer-alt': 'Gauge',
  'fa-edit': 'Edit',
  'fa-toggle-on': 'ToggleRight',
  'fa-toggle-off': 'ToggleLeft',
  'fa-layer-group': 'Layers',
  'fa-memory': 'Cpu',
  'fa-check-circle': 'CheckCircle',
  'fa-sync': 'RefreshCw',
  'fa-eye-slash': 'EyeOff',
  'fa-user': 'User',
  'fa-cog': 'Settings',
  'fa-sign-out-alt': 'LogOut',
  'fa-home': 'Home',
  'fa-list': 'List',
  'fa-chart-bar': 'BarChart3',
  'fa-question-circle': 'HelpCircle',
  'fa-search': 'Search',
  'fa-x-circle': 'XCircle',
  'fa-trending-up': 'TrendingUp',
  'fa-thumbs-up': 'ThumbsUp',
  'fa-eye': 'Eye',
  'fa-alert-triangle': 'AlertTriangle',
  'fa-graduation-cap': 'GraduationCap',
  'fa-clipboard-list': 'ClipboardList',
  'fa-play': 'Play',
  'fa-school': 'School',
  'fa-target': 'Target',
  'fa-package': 'Package',
  'fa-shield': 'Shield',
  'fa-key': 'Key',
  'fa-bot': 'Bot',
  'fa-video': 'Video',
  'fa-sparkles': 'Sparkles',
  'fa-bar-chart-3': 'BarChart3',
}

interface Props {
  name: string
  size?: number | string
  strokeWidth?: number | string
  class?: string
  spin?: boolean
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
  strokeWidth: 2,
  class: '',
  spin: false,
  color: undefined
})

// 创建 fallback 图标组件
const createFallbackIcon = (size: number | string) => {
  const sizeNum = typeof size === 'string' ? parseInt(size) || 20 : size
  return () => h('svg', {
    width: sizeNum,
    height: sizeNum,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    style: {
      display: 'inline-block',
      verticalAlign: 'middle',
      opacity: 0.5,
    }
  }, [
    h('circle', { cx: '12', cy: '12', r: '10' }),
    h('line', { x1: '12', y1: '8', x2: '12', y2: '12' }),
    h('line', { x1: '12', y1: '16', x2: '12.01', y2: '16' })
  ])
}

const iconComponent = computed(() => {
  try {
    // 如果 LucideIcons 未加载，返回 fallback
    if (!LucideIcons || Object.keys(LucideIcons).length === 0) {
      return createFallbackIcon(props.size)
    }

    let iconName = props.name
    
    // 如果是 Font Awesome 格式，先转换
    if (iconName.startsWith('fa-')) {
      iconName = faToLucideMap[iconName] || iconName.replace('fa-', '')
    }
    
    // 将 kebab-case 转换为 PascalCase
    const pascalName = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    
    // 尝试获取图标组件（使用类型断言以支持动态属性访问）
    const Icon = (LucideIcons as any)[pascalName] || (LucideIcons as any)[`${pascalName}Icon`]
    
    if (!Icon || typeof Icon !== 'function' && typeof Icon !== 'object') {
      // 开发环境显示警告，生产环境静默处理
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Icon "${props.name}" (${pascalName}) not found in Lucide Icons`)
      }
      return createFallbackIcon(props.size)
    }
    
    return Icon
  } catch (error) {
    // 捕获任何错误，返回 fallback
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading icon:', error)
    }
    return createFallbackIcon(props.size)
  }
})

const iconClass = computed(() => {
  const classes = [props.class]
  if (props.spin) {
    classes.push('lucide-icon-spin')
  }
  return classes.filter(Boolean).join(' ')
})

const iconStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.color) {
    style.color = props.color
  }
  return style
})
</script>

<style scoped>
.lucide-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  /* 确保 SVG 图标正确渲染 */
  width: auto;
  height: auto;
  /* 兼容旧浏览器 */
  max-width: 100%;
  max-height: 100%;
}

/* 确保 SVG 元素正确显示 */
.lucide-icon :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.lucide-icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 兼容不支持 CSS transforms 的旧浏览器 */
@supports not (transform: rotate(0deg)) {
  .lucide-icon-spin {
    animation: none;
  }
}
</style>

