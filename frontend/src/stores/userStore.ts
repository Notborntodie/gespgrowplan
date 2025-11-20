import { ref, computed } from 'vue'
import axios from 'axios'
import { BASE_URL } from '@/config/api'

// 用户类型定义
interface Role {
  id: number
  name: string
  display_name: string
  description: string
  assigned_at: string
}

interface User {
  id: number
  username: string
  email?: string
  real_name?: string
  created_at: string
  roles: Role[]
}

// 用户状态管理
export const useUserStore = () => {
  // 状态
  const users = ref<User[]>([])
  const loading = ref(false)
  const lastFetchTime = ref<number>(0)
  const cacheExpiry = 30 * 60 * 1000 // 30分钟缓存过期时间
  const isInitialized = ref(false) // 标记是否已经初始化过

  // 计算属性
  const isCacheValid = computed(() => {
    return Date.now() - lastFetchTime.value < cacheExpiry
  })

  const hasUsers = computed(() => users.value.length > 0)

  // 方法
  const fetchUsers = async (forceRefresh = false) => {
    // 如果缓存有效且不强制刷新，直接返回缓存数据
    if (!forceRefresh && isCacheValid.value && hasUsers.value) {
      console.log('使用用户缓存数据，跳过API调用')
      return users.value
    }

    // 如果已经初始化过且有数据，但缓存过期，显示加载状态但不阻塞UI
    if (isInitialized.value && hasUsers.value && !forceRefresh) {
      console.log('用户缓存过期，在后台刷新数据')
      // 在后台静默刷新，不显示loading状态
      refreshInBackground()
      return users.value
    }

    loading.value = true
    try {
      console.log('开始获取用户列表...')
      const response = await axios.get(`${BASE_URL}/users`)
      
      users.value = response.data
      lastFetchTime.value = Date.now()
      isInitialized.value = true
      
      console.log('用户列表获取完成，共', users.value.length, '个用户')
      return users.value
    } catch (error: any) {
      console.error('获取用户列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 后台静默刷新数据
  const refreshInBackground = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users`)
      users.value = response.data
      lastFetchTime.value = Date.now()
      console.log('用户数据后台刷新完成')
    } catch (error: any) {
      console.error('用户数据后台刷新失败:', error)
    }
  }

  // 获取用户详情（用于用户详情对话框）
  const fetchUserDetails = async (userId: number) => {
    try {
      const response = await axios.get(`${BASE_URL}/users/${userId}`)
      return response.data
    } catch (error: any) {
      console.error(`获取用户 ${userId} 详情失败:`, error)
      throw error
    }
  }

  // 创建用户
  const createUser = async (userData: any) => {
    try {
      // 只发送后端支持的字段
      const requestData = {
        username: userData.username,
        password: userData.password
      }
      
      const response = await axios.post(`${BASE_URL}/register`, requestData)
      
      // 创建成功后，强制刷新列表（因为后端只返回成功消息，不返回用户数据）
      await fetchUsers(true)
      
      return response.data
    } catch (error: any) {
      console.error('创建用户失败:', error)
      throw error
    }
  }

  // 更新用户信息
  const updateUser = async (userId: number, userData: any) => {
    try {
      const response = await axios.put(`${BASE_URL}/users/${userId}`, userData)
      
      // 更新缓存中的用户信息
      updateUserInCache(userId, userData)
      
      return response.data
    } catch (error: any) {
      console.error(`更新用户 ${userId} 失败:`, error)
      throw error
    }
  }

  // 更新用户角色
  const updateUserRole = async (userId: number, roleIds: number[]) => {
    try {
      const response = await axios.put(`${BASE_URL}/users/${userId}/roles`, {
        role_ids: roleIds
      })
      
      // 更新成功后，重新获取用户详情并更新缓存
      const userDetails = await fetchUserDetails(userId)
      updateUserInCache(userId, userDetails)
      
      return response.data
    } catch (error: any) {
      console.error(`更新用户 ${userId} 角色失败:`, error)
      throw error
    }
  }

  // 删除用户
  const deleteUser = async (userId: number, adminUserId: number) => {
    try {
      const response = await axios.delete(`${BASE_URL}/users/${userId}`, {
        data: { admin_user_id: adminUserId }
      })
      
      // 从缓存中删除用户
      removeUser(userId)
      
      return response.data
    } catch (error: any) {
      console.error(`删除用户 ${userId} 失败:`, error)
      throw error
    }
  }

  // 重置用户密码
  const resetUserPassword = async (userId: number, adminUserId: number) => {
    try {
      const response = await axios.put(`${BASE_URL}/users/${userId}/reset-password`, {
        admin_user_id: adminUserId
      })
      
      return response.data
    } catch (error: any) {
      console.error(`重置用户 ${userId} 密码失败:`, error)
      throw error
    }
  }

  // 添加用户到缓存
  const addUser = (user: User) => {
    users.value.unshift(user) // 添加到开头
    // 更新缓存时间戳，确保新添加的用户能立即显示
    lastFetchTime.value = Date.now()
  }

  // 更新缓存中的用户
  const updateUserInCache = (userId: number, updatedData: any) => {
    const index = users.value.findIndex(u => u.id === userId)
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...updatedData }
      // 更新缓存时间戳，确保更新能立即反映
      lastFetchTime.value = Date.now()
    }
  }

  // 从缓存中删除用户
  const removeUser = (userId: number) => {
    const index = users.value.findIndex(u => u.id === userId)
    if (index !== -1) {
      users.value.splice(index, 1)
      // 更新缓存时间戳，确保删除能立即反映
      lastFetchTime.value = Date.now()
    }
  }

  // 清空缓存
  const clearCache = () => {
    users.value = []
    lastFetchTime.value = 0
    isInitialized.value = false
  }

  // 获取单个用户（优先从缓存获取）
  const getUser = (userId: number) => {
    return users.value.find(u => u.id === userId)
  }

  // 搜索用户（在缓存中搜索）
  const searchUsers = (query: string) => {
    if (!query) return users.value
    const lowerQuery = query.toLowerCase()
    return users.value.filter(u => 
      u.username?.toLowerCase().includes(lowerQuery) ||
      u.real_name?.toLowerCase().includes(lowerQuery) ||
      u.email?.toLowerCase().includes(lowerQuery)
    )
  }

  // 按角色过滤用户
  const filterUsersByRole = (roleId: number) => {
    if (!roleId) return users.value
    return users.value.filter(u => 
      u.roles && u.roles.some(role => role.id === roleId)
    )
  }

  return {
    // 状态
    users,
    loading,
    lastFetchTime,
    isInitialized,
    
    // 计算属性
    isCacheValid,
    hasUsers,
    
    // 方法
    fetchUsers,
    fetchUserDetails,
    createUser,
    updateUser,
    updateUserRole,
    deleteUser,
    resetUserPassword,
    clearCache,
    getUser,
    searchUsers,
    filterUsersByRole,
    
    // 缓存操作方法
    addUser,
    updateUserInCache,
    removeUser
  }
}
