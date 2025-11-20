import { ref, computed } from 'vue'
import axios from 'axios'
import { BASE_URL } from '@/config/api'

// 知识点状态管理
export const useKnowledgePointStore = () => {
  // 状态
  const knowledgePoints = ref<any[]>([])
  const loading = ref(false)
  const lastFetchTime = ref<number>(0)
  const cacheExpiry = 30 * 60 * 1000 // 30分钟缓存过期时间
  const isInitialized = ref(false) // 标记是否已经初始化过

  // 计算属性
  const isCacheValid = computed(() => {
    return Date.now() - lastFetchTime.value < cacheExpiry
  })

  const hasKnowledgePoints = computed(() => knowledgePoints.value.length > 0)

  // 方法
  const fetchKnowledgePoints = async (forceRefresh = false) => {
    // 如果缓存有效且不强制刷新，直接返回缓存数据
    if (!forceRefresh && isCacheValid.value && hasKnowledgePoints.value) {
      console.log('使用知识点缓存数据，跳过API调用')
      return knowledgePoints.value
    }

    // 如果已经初始化过且有数据，但缓存过期，显示加载状态但不阻塞UI
    if (isInitialized.value && hasKnowledgePoints.value && !forceRefresh) {
      console.log('知识点缓存过期，在后台刷新数据')
      // 在后台静默刷新，不显示loading状态
      refreshInBackground()
      return knowledgePoints.value
    }

    loading.value = true
    try {
      console.log('开始获取知识点列表...')
      const response = await axios.get(`${BASE_URL}/knowledge-points`)
      
      knowledgePoints.value = response.data
      lastFetchTime.value = Date.now()
      isInitialized.value = true
      
      return knowledgePoints.value
    } catch (error: any) {
      console.error('获取知识点列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 后台静默刷新数据
  const refreshInBackground = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/knowledge-points`)
      knowledgePoints.value = response.data
      lastFetchTime.value = Date.now()
    } catch (error: any) {
      console.error('知识点后台刷新失败:', error)
    }
  }

  // 添加知识点到缓存
  const addKnowledgePoint = (knowledgePoint: any) => {
    knowledgePoints.value.push(knowledgePoint)
  }

  // 更新缓存中的知识点
  const updateKnowledgePoint = (id: number, updatedKnowledgePoint: any) => {
    const index = knowledgePoints.value.findIndex(kp => kp.id === id)
    if (index !== -1) {
      knowledgePoints.value[index] = updatedKnowledgePoint
    }
  }

  // 从缓存中删除知识点
  const removeKnowledgePoint = (id: number) => {
    const index = knowledgePoints.value.findIndex(kp => kp.id === id)
    if (index !== -1) {
      knowledgePoints.value.splice(index, 1)
    }
  }

  // 批量删除知识点
  const removeKnowledgePoints = (ids: number[]) => {
    knowledgePoints.value = knowledgePoints.value.filter(kp => !ids.includes(kp.id))
  }

  // 清除缓存
  const clearCache = () => {
    knowledgePoints.value = []
    lastFetchTime.value = 0
    isInitialized.value = false
  }

  // 获取知识点详情（如果需要的话）
  const getKnowledgePointById = (id: number) => {
    return knowledgePoints.value.find(kp => kp.id === id)
  }

  return {
    // 状态
    knowledgePoints,
    loading,
    lastFetchTime,
    isInitialized,
    
    // 计算属性
    isCacheValid,
    hasKnowledgePoints,
    
    // 方法
    fetchKnowledgePoints,
    refreshInBackground,
    addKnowledgePoint,
    updateKnowledgePoint,
    removeKnowledgePoint,
    removeKnowledgePoints,
    clearCache,
    getKnowledgePointById
  }
}
