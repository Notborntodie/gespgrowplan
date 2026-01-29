<template>
  <div class="exam-layout">
    <div class="exam-content exam-content-flex-row">
      <!-- 主体：动画演示内容 -->
      <div class="question-main">
        <div class="question-card plan-view-transparent">
          <!-- 统一的内容滚动区域 -->
          <div class="question-content-unified">
            <div class="question-left-panel question-left-panel-centered" style="width: 100%;">
              
              <!-- 动画演示列表视图 -->
              <div class="plans-list-view">
                <!-- 搜索栏 -->
                <div class="search-section">
                  <div class="search-bar-container">
                    <Icon name="search" :size="20" class="search-icon" />
                    <input 
                      v-model="searchQuery" 
                      type="text" 
                      placeholder="搜索动画名称或描述..."
                      class="search-input"
                    />
                    <button 
                      v-if="searchQuery" 
                      @click="searchQuery = ''" 
                      class="clear-search-btn"
                    >
                      <Icon name="x" :size="16" />
                    </button>
                  </div>
                </div>
                
                <div class="my-plans-grid">
                  <div 
                    v-for="category in filteredCategories" 
                    :key="category.id"
                    class="plan-card"
                    @click="handleCardClick(category)"
                  >
                    <div class="plan-card-header">
                      <div class="plan-level-badge">
                        {{ category.name }}
                      </div>
                    </div>
                    <div class="plan-card-body">
                      <div class="animation-items-grid">
                        <div 
                          v-for="animation in category.animations" 
                          :key="animation.id"
                          class="animation-item-card"
                          @click.stop="openAnimation(animation)"
                        >
                          <div class="animation-item-icon">
                            <Icon :name="animation.icon" :size="28" />
                          </div>
                          <div class="animation-item-content">
                            <h4 class="animation-item-title">{{ animation.name }}</h4>
                            <p v-if="animation.description" class="animation-item-desc">{{ animation.description }}</p>
                          </div>
                          <div class="animation-item-action">
                            <Icon name="external-link" :size="18" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'

const router = useRouter()

// 搜索关键词
const searchQuery = ref('')

// 动画分类和列表
const animationCategories = ref([
  {
    id: 'dfs',
    name: '深度优先搜索 (DFS)',
    icon: 'tree',
    animations: [
      { 
        id: 1, 
        name: 'N皇后问题', 
        file: 'n皇后.html', 
        icon: 'grid',
        description: '使用回溯算法解决N皇后问题的可视化演示'
      }
      // 可以在这里添加更多DFS相关的动画
    ]
  },
  {
    id: 'bfs',
    name: '广度优先搜索 (BFS)',
    icon: 'layers',
    animations: [
      { 
        id: 2, 
        name: 'BFS入门教学', 
        file: 'BFS入门教学.html', 
        icon: 'play-circle',
        description: '广度优先搜索算法的入门教学和可视化演示'
      }
      // 可以在这里添加更多BFS相关的动画
    ]
  }
  // 可以在这里添加更多分类
])

// 过滤后的动画分类
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return animationCategories.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  
  return animationCategories.value.map(category => {
    const filteredAnimations = category.animations.filter(animation => {
      // 搜索名称
      if (animation.name.toLowerCase().includes(query)) {
        return true
      }
      // 搜索描述
      if (animation.description?.toLowerCase().includes(query)) {
        return true
      }
      return false
    })
    
    return {
      ...category,
      animations: filteredAnimations
    }
  }).filter(category => category.animations.length > 0)
})

// 处理卡片点击
const handleCardClick = (category: any) => {
  // 如果分类中有动画，打开第一个动画
  if (category.animations && category.animations.length > 0) {
    const animation = category.animations[0]
    openAnimation(animation)
  }
}

// 打开动画演示
const openAnimation = (animation: any) => {
  // 跳转到动画详情页面
  const animationUrl = animation.url || `/html/${animation.file}`
  router.push({
    path: `/animation/${animation.id}`,
    query: {
      name: animation.name,
      url: animationUrl
    }
  })
}
</script>

<style scoped>
/* 基础布局 - 与 PlanView 保持一致 */
.exam-layout {
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #87ceeb 0%, #f8fafc 100%);
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
}

.exam-content-flex-row {
  display: flex;
  flex-direction: row;
  gap: 32px;
  width: 100%;
  margin: 0 auto;
  padding: 0 20px 40px 20px;
  box-sizing: border-box;
  flex-shrink: 0;
  align-items: flex-start;
  justify-content: center;
  margin-top: 0;
}

.question-main {
  flex: 1;
  max-width: 1600px;
  min-width: 0;
}

.question-card {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 6px 24px -4px rgba(30, 144, 255, 0.1);
  transition: all 0.3s ease;
  padding: 0;
  overflow: visible;
  width: 100%;
  min-height: calc(100vh - 84px - 80px);
  display: flex;
  flex-direction: column;
  margin: 20px auto 0 auto;
  box-sizing: border-box;
}

/* 计划列表视图时，卡片背景透明融入页面背景 */
.question-card.plan-view-transparent {
  background: transparent;
  border: none;
  box-shadow: none;
}

.question-content-unified {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  background: transparent;
}

.question-left-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-left-panel-centered {
  align-items: center;
  justify-content: flex-start;
}

.plans-list-view {
  width: 100%;
  max-width: 1400px;
}

/* 搜索栏样式 */
.search-section {
  margin-bottom: 24px;
}

.search-bar-container {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid rgba(30, 144, 255, 0.3);
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(30, 144, 255, 0.1);
  transition: all 0.3s ease;
}

.search-bar-container:focus-within {
  border-color: #1e90ff;
  box-shadow: 0 6px 16px rgba(30, 144, 255, 0.2);
}

.search-icon {
  color: #64748b;
  flex-shrink: 0;
  margin-right: 12px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #1e293b;
  background: transparent;
}

.search-input::placeholder {
  color: #94a3b8;
}

.clear-search-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.2s ease;
  border-radius: 4px;
  flex-shrink: 0;
}

.clear-search-btn:hover {
  color: #1e90ff;
  background: rgba(30, 144, 255, 0.1);
}

.my-plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  width: 100%;
}

.plan-card {
  background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
  border: 5px solid #1e90ff;
  border-radius: 20px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(30, 144, 255, 0.2);
  overflow: hidden;
  min-height: 260px;
}

.plan-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 16px 40px rgba(30, 144, 255, 0.4);
  border-color: #0c7cd5;
  border-width: 6px;
}

.plan-card-header {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-level-badge {
  background: #1e90ff;
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-card-body {
  padding: 20px;
}

.animation-items-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.animation-item-card {
  background: linear-gradient(135deg, rgba(30, 144, 255, 0.05), rgba(56, 189, 248, 0.05));
  border: 2px solid rgba(30, 144, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  position: relative;
  width: 100%;
  cursor: pointer;
}

.animation-item-card:hover {
  background: linear-gradient(135deg, rgba(30, 144, 255, 0.1), rgba(56, 189, 248, 0.1));
  border-color: rgba(30, 144, 255, 0.4);
  transform: translateX(4px);
}

.animation-item-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(30, 144, 255, 0.15), rgba(56, 189, 248, 0.15));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e90ff;
  border: 2px solid rgba(30, 144, 255, 0.3);
  flex-shrink: 0;
}

.animation-item-content {
  flex: 1;
  min-width: 0;
}

.animation-item-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.animation-item-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.animation-item-action {
  color: #94a3b8;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.animation-item-card:hover .animation-item-action {
  color: #1e90ff;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .exam-content-flex-row {
    padding: 0 16px 32px 16px;
  }

  .question-card {
    margin: 16px auto 0 auto;
  }

  .question-content-unified {
    padding: 16px;
  }

  .my-plans-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .plan-card-body {
    padding: 16px;
  }

  .animation-item-card {
    padding: 12px;
  }

  .animation-item-icon {
    width: 40px;
    height: 40px;
  }

  .animation-item-title {
    font-size: 1.1rem;
  }
  
  .search-bar-container {
    padding: 10px 12px;
  }
  
  .search-input {
    font-size: 0.9rem;
  }
}
</style>
