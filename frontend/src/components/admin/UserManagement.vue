<template>
    <div class="user-management">
      <div class="user-header">
        <div class="header-left">
          <h2>用户管理</h2>
          <span class="user-count">共 {{ users.length }} 个用户</span>
          <span v-if="userStore.isCacheValid && userStore.hasUsers" class="cache-indicator">
            📦 使用缓存数据
          </span>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索用户名或真实姓名..."
              class="search-input"
            />
            <i class="search-icon">🔍</i>
          </div>
          <button @click="refreshUsers" class="btn-refresh" title="刷新用户列表">
            🔄 刷新
          </button>
          <button @click="showCreateDialog = true" class="btn-primary">
            <i class="icon-plus"></i>
            创建用户
          </button>
        </div>
      </div>
  
      <!-- 用户列表 -->
      <div class="users-container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载用户列表...</p>
        </div>
        <div v-else class="users-grid">
          <div 
            v-for="user in filteredUsers" 
            :key="user.id" 
            class="user-card"
            @click="viewUserDetails(user)"
          >
            <div class="user-card-header">
              <div class="user-info">
                <div class="user-avatar">
                  {{ user.real_name ? user.real_name.charAt(0) : user.username.charAt(0) }}
                </div>
                <div class="user-details">
                  <h3 class="user-name">{{ user.real_name || user.username }}</h3>
                  <p class="user-username">@{{ user.username }}</p>
                  <div class="user-roles">
                    <span 
                      v-for="role in user.roles" 
                      :key="role.id"
                      class="role-badge"
                      :class="getRoleClass(role.id)"
                    >
                      {{ role.display_name }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="user-actions" @click.stop>
                <button @click="deleteUser(user)" class="btn-icon btn-delete" title="删除用户">
                  <i class="icon-delete"></i>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
  
      <!-- 创建用户对话框 -->
      <div v-if="showCreateDialog" class="dialog-overlay" @click="closeCreateDialog">
        <div class="dialog" @click.stop>
          <div class="dialog-header">
            <h3>创建用户</h3>
            <button @click="closeCreateDialog" class="btn-close">&times;</button>
          </div>
          <div class="dialog-body">
            <form @submit.prevent="createUser" class="user-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="username">用户名 *</label>
                  <input 
                    id="username"
                    v-model="newUser.username" 
                    type="text" 
                    required 
                    placeholder="请输入用户名"
                  />
                </div>
                <div class="form-group">
                  <label for="password">密码 *</label>
                  <input 
                    id="password"
                    v-model="newUser.password" 
                    type="password" 
                    required 
                    placeholder="请输入密码"
                  />
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="email">邮箱</label>
                  <input 
                    id="email"
                    v-model="newUser.email" 
                    type="email" 
                    placeholder="请输入邮箱地址"
                  />
                </div>
                <div class="form-group">
                  <label for="real_name">真实姓名</label>
                  <input 
                    id="real_name"
                    v-model="newUser.real_name" 
                    type="text" 
                    placeholder="请输入真实姓名"
                  />
                </div>
              </div>
              
              <div class="form-group">
                <label for="role_ids">角色（可多选）</label>
                <div class="role-checkboxes">
                  <label class="role-checkbox">
                    <input 
                      type="checkbox" 
                      v-model="newUser.role_ids" 
                      value="2"
                    />
                    <span class="role-badge role-user">普通用户</span>
                  </label>
                  <label class="role-checkbox">
                    <input 
                      type="checkbox" 
                      v-model="newUser.role_ids" 
                      value="3"
                    />
                    <span class="role-badge role-teacher">教师</span>
                  </label>
                  <label class="role-checkbox">
                    <input 
                      type="checkbox" 
                      v-model="newUser.role_ids" 
                      value="1"
                    />
                    <span class="role-badge role-admin">管理员</span>
                  </label>
                </div>
              </div>
              
              <div class="dialog-actions">
                <button type="button" @click="closeCreateDialog" class="btn-secondary">
                  取消
                </button>
                <button type="submit" class="btn-primary" :disabled="isCreating">
                  {{ isCreating ? '创建中...' : '创建用户' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  
  

      <!-- 用户详情对话框 -->
      <div v-if="showDetailsDialog" class="dialog-overlay" @click="closeDetailsDialog">
        <div class="dialog dialog-large" @click.stop>
          <div class="dialog-header">
            <h3>用户详细信息</h3>
            <button @click="closeDetailsDialog" class="btn-close">&times;</button>
          </div>
          <div class="dialog-body">
            <div v-if="userDetails" class="user-details-content">
              <!-- 用户基本信息 -->
              <div class="details-section">
                <div class="section-header">
                  <h4>基本信息</h4>
                  <button v-if="!isEditingInDetails" @click="startEditInDetails" class="btn-edit-inline">
                    <i class="icon-edit"></i>
                    编辑
                  </button>
                </div>
                
                <!-- 查看模式 -->
                <div v-if="!isEditingInDetails" class="user-basic-info">
                  <div class="user-avatar-large">
                    {{ userDetails.real_name ? userDetails.real_name.charAt(0) : userDetails.username.charAt(0) }}
                  </div>
                  <div class="user-basic-details">
                    <h3>{{ userDetails.real_name || userDetails.username }}</h3>
                    <p>@{{ userDetails.username }}</p>
                    <p v-if="userDetails.email">{{ userDetails.email }}</p>
                    <p class="created-time">创建时间: {{ formatDate(userDetails.created_at) }}</p>
                  </div>
                </div>

                <!-- 编辑模式 -->
                <div v-else class="edit-form-in-details">
                  <form @submit.prevent="updateUserInDetails" class="user-form">
                    <div class="form-row">
                      <div class="form-group">
                        <label for="edit_username_details">用户名 *</label>
                        <input 
                          id="edit_username_details"
                          v-model="editingUser.username" 
                          type="text" 
                          required 
                          placeholder="请输入用户名"
                        />
                      </div>
                      <div class="form-group">
                        <label for="edit_email_details">邮箱</label>
                        <input 
                          id="edit_email_details"
                          v-model="editingUser.email" 
                          type="email" 
                          placeholder="请输入邮箱地址"
                        />
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label for="edit_real_name_details">真实姓名</label>
                      <input 
                        id="edit_real_name_details"
                        v-model="editingUser.real_name" 
                        type="text" 
                        placeholder="请输入真实姓名"
                      />
                    </div>
                    
                    <div class="edit-actions">
                      <button type="button" @click="cancelEditInDetails" class="btn-secondary">
                        取消
                      </button>
                      <button type="submit" class="btn-primary" :disabled="isUpdating">
                        {{ isUpdating ? '更新中...' : '保存' }}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <!-- 角色信息 -->
              <div class="details-section">
                <div class="section-header">
                  <h4>角色信息</h4>
                  <button v-if="!isEditingRoleInDetails" @click="startEditRoleInDetails" class="btn-edit-inline">
                    <i class="icon-shield"></i>
                    管理角色
                  </button>
                </div>
                
                <!-- 查看模式 -->
                <div v-if="!isEditingRoleInDetails" class="roles-list">
                  <div v-for="role in userDetails.roles" :key="role.id" class="role-item">
                    <div class="role-info">
                      <span class="role-name">{{ role.display_name }}</span>
                      <span class="role-description">{{ role.description }}</span>
                    </div>
                    <span class="role-assigned-time">分配时间: {{ formatDate(role.assigned_at) }}</span>
                  </div>
                </div>

                <!-- 编辑模式 -->
                <div v-else class="edit-role-in-details">
                  <div class="role-selection">
                    <h5>选择角色（可多选）:</h5>
                    <div class="role-options">
                      <label class="role-option">
                        <input 
                          type="checkbox" 
                          v-model="selectedRoleIds" 
                          value="2"
                        />
                        <span class="role-badge role-user">普通用户</span>
                      </label>
                      <label class="role-option">
                        <input 
                          type="checkbox" 
                          v-model="selectedRoleIds" 
                          value="3"
                        />
                        <span class="role-badge role-teacher">教师</span>
                      </label>
                      <label class="role-option">
                        <input 
                          type="checkbox" 
                          v-model="selectedRoleIds" 
                          value="1"
                        />
                        <span class="role-badge role-admin">管理员</span>
                      </label>
                    </div>
                  </div>
                  
                  <div class="edit-actions">
                    <button type="button" @click="cancelEditRoleInDetails" class="btn-secondary">
                      取消
                    </button>
                    <button @click="updateUserRoleInDetails" class="btn-primary" :disabled="isUpdatingRole">
                      {{ isUpdatingRole ? '更新中...' : '保存' }}
                    </button>
                  </div>
                </div>
              </div>

            </div>
            
            <div class="dialog-actions">
              <button @click="userDetails && resetUserPassword(userDetails)" class="btn-warning" :disabled="isResettingPassword">
                <i class="icon-key"></i>
                {{ isResettingPassword ? '重置中...' : '重置密码' }}
              </button>
              <button @click="userDetails && deleteUser(userDetails)" class="btn-danger" :disabled="isDeleting">
                <i class="icon-delete"></i>
                {{ isDeleting ? '删除中...' : '删除用户' }}
              </button>
              <button @click="closeDetailsDialog" class="btn-secondary">
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 成功消息对话框 -->
      <SuccessMessageDialog 
        :visible="showSuccessDialog"
        :message="successMessage"
        @close="closeSuccessDialog"
      />

      <!-- 确认对话框 -->
      <ConfirmDialog 
        :visible="showConfirmDialog"
        :title="confirmTitle"
        :message="confirmMessage"
        @confirm="handleConfirmAction"
        @cancel="closeConfirmDialog"
      />
    </div>
  </template>
  
<script setup lang="ts">import { BASE_URL } from '@/config/api'

import { ref, onMounted, reactive, computed } from 'vue'
import SuccessMessageDialog from './Dialog/SuccessMessageDialog.vue'
import ConfirmDialog from './Dialog/ConfirmDialog.vue'
import { useUserStore } from '../../stores/userStore'

// 使用用户store
const userStore = useUserStore()

// 定义类型接口
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
  
  // 响应式数据
  const showCreateDialog = ref(false)
  const showDetailsDialog = ref(false)
  const isCreating = ref(false)
  const isUpdating = ref(false)
  const isUpdatingRole = ref(false)
  const isLoadingDetails = ref(false)
  const isEditingInDetails = ref(false)
  const isEditingRoleInDetails = ref(false)
  const isDeleting = ref(false)
  const isResettingPassword = ref(false)
  const showSuccessDialog = ref(false)
  const successMessage = ref('')
  const showConfirmDialog = ref(false)
  const confirmTitle = ref('')
  const confirmMessage = ref('')
  const userToDelete = ref<User | null>(null)
  const userToResetPassword = ref<User | null>(null)
  const searchQuery = ref('')

  // 从store获取状态
  const { users, loading } = userStore
  
  // 表单数据
  const newUser = reactive({
    username: '',
    password: '',
    email: '',
    real_name: '',
    role_ids: ['2'] // 默认选择普通用户角色
  })
  
  const editingUser = reactive<{
    id: number | null
    username: string
    email: string
    real_name: string
  }>({
    id: null,
    username: '',
    email: '',
    real_name: ''
  })
  
  
  const selectedRoleIds = ref<string[]>(['2'])
  const userDetails = ref<User | null>(null)

  // 计算属性：过滤后的用户列表
  const filteredUsers = computed(() => {
    if (!searchQuery.value.trim()) {
      return users.value
    }
    
    const query = searchQuery.value.toLowerCase().trim()
    return users.value.filter(user => {
      const username = (user.username || '').toLowerCase()
      const realName = (user.real_name || '').toLowerCase()
      return username.includes(query) || realName.includes(query)
    })
  })
  
  // 获取用户列表
  const fetchUsers = async (forceRefresh = false) => {
    try {
      await userStore.fetchUsers(forceRefresh)
    } catch (error: any) {
      console.error('获取用户列表失败:', error)
      alert('获取用户列表失败: ' + (error.response?.data?.error || error.message))
    }
  }
  
  // 创建用户
  const createUser = async () => {
    isCreating.value = true
    try {
      // 准备用户数据，将role_ids转换为role_id（取第一个角色作为主要角色）
      const userData = {
        ...newUser,
        role_id: parseInt(newUser.role_ids[0]) || 2
      }
      
      const response = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('创建用户API响应:', result)
        
        // 检查API响应是否包含用户数据
        if (result.user) {
          // 如果API返回了完整的用户数据，直接添加到缓存
          console.log('使用API返回的完整用户数据')
          userStore.addUser(result.user)
        } else if (result.id) {
          // 如果API只返回了用户ID，构造一个基本的用户对象
          console.log('构造基本用户对象，ID:', result.id)
          const userId = result.id
          
          // 如果有多个角色，需要为每个角色调用角色分配API
          if (newUser.role_ids.length > 1) {
            try {
              await fetch(`${BASE_URL}/users/${userId}/roles`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  role_ids: newUser.role_ids.map(id => parseInt(id))
                })
              })
            } catch (roleError) {
              console.error('分配角色失败:', roleError)
            }
          }
          
          const basicUser = {
            id: userId,
            username: newUser.username,
            email: newUser.email || '',
            real_name: newUser.real_name || '',
            created_at: new Date().toISOString(),
            roles: newUser.role_ids.map(roleId => {
              const roleMap: { [key: string]: any } = {
                '1': { id: 1, name: 'admin', display_name: '管理员', description: '系统管理员' },
                '2': { id: 2, name: 'user', display_name: '普通用户', description: '普通用户' },
                '3': { id: 3, name: 'teacher', display_name: '教师', description: '教师' }
              }
              return {
                ...roleMap[roleId],
                assigned_at: new Date().toISOString()
              }
            })
          }
          userStore.addUser(basicUser)
        } else {
          // 如果API没有返回用户数据，强制刷新用户列表
          console.log('API未返回用户数据，强制刷新用户列表')
          await fetchUsers(true)
        }
        
        // 无论哪种情况，都确保用户列表是最新的
        // 如果上面的逻辑没有成功添加用户到缓存，这里会强制刷新
        if (!userStore.users.value.some(u => u.username === newUser.username)) {
          console.log('用户未成功添加到缓存，强制刷新用户列表')
          await fetchUsers(true)
        }
        
        // 先关闭对话框和重置表单
        closeCreateDialog()
        resetNewUser()
        // 清空搜索框，确保新用户可见
        searchQuery.value = ''
        
        // 延迟显示成功消息，确保UI更新完成
        setTimeout(() => {
          showSuccessMessage('用户创建成功')
        }, 100)
      } else {
        const error = await response.json()
        console.error('创建用户失败:', error)
        alert('创建用户失败: ' + (error.message || '未知错误'))
      }
    } catch (error) {
      console.error('创建用户出错:', error)
      alert('创建用户出错: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      // 确保无论成功还是失败都重置创建状态
      isCreating.value = false
    }
  }
  
  // 更新用户信息
  const updateUser = async () => {
    isUpdating.value = true
    try {
      const response = await fetch(`${BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: editingUser.username,
          email: editingUser.email,
          real_name: editingUser.real_name
        })
      })
      
      if (response.ok) {
        await fetchUsers()
        // 这里应该关闭编辑对话框，但当前没有编辑对话框
      } else {
        const error = await response.json()
        alert('更新用户失败: ' + (error.message || '未知错误'))
      }
    } catch (error) {
      console.error('更新用户出错:', error)
      alert('更新用户出错')
    } finally {
      isUpdating.value = false
    }
  }
  
  // 更新用户角色
  const updateUserRole = async (userId: number) => {
    isUpdatingRole.value = true
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role_ids: selectedRoleIds.value.map(id => parseInt(id))
        })
      })
      
      if (response.ok) {
        await fetchUsers()
        // 如果详情对话框打开，也更新详情数据
        if (userDetails.value && userDetails.value.id === userId) {
          const detailsResponse = await fetch(`${BASE_URL}/users/${userId}`)
          if (detailsResponse.ok) {
            userDetails.value = await detailsResponse.json()
          }
        }
        // 这里应该关闭角色编辑对话框，但当前没有独立的角色编辑对话框
      } else {
        const error = await response.json()
        alert('更新角色失败: ' + (error.message || '未知错误'))
      }
    } catch (error) {
      console.error('更新角色出错:', error)
      alert('更新角色出错')
    } finally {
      isUpdatingRole.value = false
    }
  }

  // 删除用户
  const deleteUser = (user: User) => {
    userToDelete.value = user
    confirmTitle.value = '确认删除用户'
    confirmMessage.value = `确定要删除用户 "${user.real_name || user.username}" 吗？此操作不可撤销。`
    showConfirmDialog.value = true
  }

  // 重置用户密码
  const resetUserPassword = (user: User) => {
    userToResetPassword.value = user
    confirmTitle.value = '确认重置密码'
    confirmMessage.value = `确定要重置用户 "${user.real_name || user.username}" 的密码吗？密码将重置为 "123456"。`
    showConfirmDialog.value = true
  }

  // 确认重置密码
  const confirmResetPassword = async () => {
    if (!userToResetPassword.value) return

    isResettingPassword.value = true
    try {
      const response = await fetch(`${BASE_URL}/users/${userToResetPassword.value.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_user_id: 1 // 这里应该从当前登录用户获取，暂时硬编码
        })
      })
      
      if (response.ok) {
        showSuccessMessage('用户密码重置成功，新密码为：123456')
      } else {
        const error = await response.json()
        alert('重置密码失败: ' + (error.message || '未知错误'))
      }
    } catch (error) {
      console.error('重置密码出错:', error)
      alert('重置密码出错')
    } finally {
      isResettingPassword.value = false
      closeConfirmDialog()
    }
  }

  // 确认删除用户
  const confirmDeleteUser = async () => {
    if (!userToDelete.value) return

    isDeleting.value = true
    try {
      const response = await fetch(`${BASE_URL}/users/${userToDelete.value.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_user_id: 1 // 这里应该从当前登录用户获取，暂时硬编码
        })
      })
      
      if (response.ok) {
        // 立即从缓存中删除用户，无需重新加载整个列表
        userStore.removeUser(userToDelete.value.id)
        
        // 如果删除的是当前查看详情的用户，关闭详情对话框
        if (userDetails.value && userDetails.value.id === userToDelete.value.id) {
          closeDetailsDialog()
        }
        showSuccessMessage('用户删除成功')
      } else {
        const error = await response.json()
        alert('删除用户失败: ' + (error.message || '未知错误'))
      }
    } catch (error) {
      console.error('删除用户出错:', error)
      alert('删除用户出错')
    } finally {
      isDeleting.value = false
      closeConfirmDialog()
    }
  }
  
  // 开始编辑（在详情对话框中）
  const startEditInDetails = () => {
    if (userDetails.value) {
      editingUser.id = userDetails.value.id
      editingUser.username = userDetails.value.username
      editingUser.email = userDetails.value.email || ''
      editingUser.real_name = userDetails.value.real_name || ''
      isEditingInDetails.value = true
    }
  }

  // 取消编辑（在详情对话框中）
  const cancelEditInDetails = () => {
    isEditingInDetails.value = false
  }

  // 开始编辑角色（在详情对话框中）
  const startEditRoleInDetails = () => {
    if (userDetails.value && userDetails.value.roles && userDetails.value.roles.length > 0) {
      selectedRoleIds.value = userDetails.value.roles.map(role => role.id.toString())
    } else {
      selectedRoleIds.value = ['2'] // 默认普通用户
    }
    isEditingRoleInDetails.value = true
  }

  // 取消编辑角色（在详情对话框中）
  const cancelEditRoleInDetails = () => {
    isEditingRoleInDetails.value = false
  }

  // 更新用户角色（在详情对话框中）
  const updateUserRoleInDetails = async () => {
    if (!userDetails.value) return

    isUpdatingRole.value = true
    try {
      const response = await fetch(`${BASE_URL}/users/${userDetails.value.id}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role_ids: selectedRoleIds.value.map(id => parseInt(id))
        })
      })
      
      if (response.ok) {
        // 刷新用户详情数据
        const detailsResponse = await fetch(`${BASE_URL}/users/${userDetails.value.id}`)
        if (detailsResponse.ok) {
          userDetails.value = await detailsResponse.json()
        }
        // 刷新用户列表
        await fetchUsers()
        isEditingRoleInDetails.value = false
        showSuccessMessage('用户角色更新成功')
      } else {
        const error = await response.json()
        alert('更新角色失败: ' + (error.message || '未知错误'))
      }
    } catch (error) {
      console.error('更新角色出错:', error)
      alert('更新角色出错')
    } finally {
      isUpdatingRole.value = false
    }
  }

  // 更新用户（在详情对话框中）
  const updateUserInDetails = async () => {
    isUpdating.value = true
    try {
      const response = await fetch(`${BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: editingUser.username,
          email: editingUser.email,
          real_name: editingUser.real_name
        })
      })
      
      if (response.ok) {
        // 更新本地数据
        if (userDetails.value) {
          userDetails.value.username = editingUser.username
          userDetails.value.email = editingUser.email
          userDetails.value.real_name = editingUser.real_name
        }
        
        // 立即更新缓存中的用户数据
        userStore.updateUserInCache(editingUser.id!, {
          username: editingUser.username,
          email: editingUser.email,
          real_name: editingUser.real_name
        })
        
        isEditingInDetails.value = false
        showSuccessMessage('用户信息更新成功')
      } else {
        const error = await response.json()
        alert('更新用户失败: ' + (error.message || '未知错误'))
      }
    } catch (error) {
      console.error('更新用户出错:', error)
      alert('更新用户出错')
    } finally {
      isUpdating.value = false
    }
  }
  

  // 查看用户详情
  const viewUserDetails = async (user: User) => {
    isLoadingDetails.value = true
    try {
      const response = await fetch(`${BASE_URL}/users/${user.id}`)
      if (response.ok) {
        userDetails.value = await response.json()
        showDetailsDialog.value = true
      } else {
        console.error('获取用户详情失败')
        alert('获取用户详情失败')
      }
    } catch (error) {
      console.error('获取用户详情出错:', error)
      alert('获取用户详情出错')
    } finally {
      isLoadingDetails.value = false
    }
  }
  
  // 关闭对话框
  const closeCreateDialog = () => {
    showCreateDialog.value = false
    resetNewUser()
  }
  
  

  const closeDetailsDialog = () => {
    showDetailsDialog.value = false
    userDetails.value = null
    isEditingInDetails.value = false
    isEditingRoleInDetails.value = false
  }

  // 显示成功消息
  const showSuccessMessage = (message: string) => {
    successMessage.value = message
    showSuccessDialog.value = true
  }

  // 关闭成功消息对话框
  const closeSuccessDialog = () => {
    showSuccessDialog.value = false
    successMessage.value = ''
  }

  // 处理确认操作
  const handleConfirmAction = () => {
    if (userToDelete.value) {
      confirmDeleteUser()
    } else if (userToResetPassword.value) {
      confirmResetPassword()
    }
  }

  // 关闭确认对话框
  const closeConfirmDialog = () => {
    showConfirmDialog.value = false
    confirmTitle.value = ''
    confirmMessage.value = ''
    userToDelete.value = null
    userToResetPassword.value = null
  }
  
  // 重置新用户表单
  const resetNewUser = () => {
    newUser.username = ''
    newUser.password = ''
    newUser.email = ''
    newUser.real_name = ''
    newUser.role_ids = ['2']
  }
  
  // 获取角色名称
  const getRoleName = (roleId: number) => {
    const roleMap: { [key: number]: string } = {
      1: '管理员',
      2: '普通用户',
      3: '教师'
    }
    return roleMap[roleId] || '未知角色'
  }
  
  // 获取角色样式类
  const getRoleClass = (roleId: number) => {
    const classMap: { [key: number]: string } = {
      1: 'role-admin',
      2: 'role-user',
      3: 'role-teacher'
    }
    return classMap[roleId] || 'role-user'
  }
  
  // 获取用户的所有角色名称
  const getUserRoleNames = (user: User) => {
    if (!user.roles || user.roles.length === 0) return '无角色'
    return user.roles.map(role => role.display_name).join(', ')
  }
  
  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '未知'
    const d = new Date(dateStr)
    return d.toLocaleDateString()
  }
  
  // 手动刷新用户列表
  const refreshUsers = async () => {
    try {
      await fetchUsers(true) // 强制刷新
      showSuccessMessage('用户列表已刷新！')
    } catch (error: any) {
      alert('刷新失败: ' + (error.response?.data?.error || error.message))
    }
  }

  // 组件挂载时获取用户列表
  onMounted(async () => {
    // 只在没有缓存数据时才显示loading状态
    if (!userStore.hasUsers.value) {
      await fetchUsers()
    } else {
      // 如果有缓存数据，直接使用，在后台刷新
      console.log('使用现有用户缓存数据，在后台刷新')
      userStore.fetchUsers()
    }
  })
  </script>
  
  <style scoped>
  .user-management {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e2e8f0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .user-header h2 {
    margin: 0;
    color: #1e293b;
    font-size: 24px;
    font-weight: 600;
  }

  .user-count {
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
  }

  .cache-indicator {
    color: #10b981;
    font-size: 12px;
    font-weight: 600;
    background: #d1fae5;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #a7f3d0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    padding: 12px 16px 12px 40px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    width: 300px;
    transition: all 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }

  .search-icon {
    position: absolute;
    left: 12px;
    color: #64748b;
    font-size: 16px;
    pointer-events: none;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);
  }
  
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-refresh {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn-refresh:hover {
    background: #e2e8f0;
    color: #475569;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(100, 116, 139, 0.2);
  }
  
  .btn-secondary {
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .btn-secondary:hover {
    background: #e2e8f0;
    color: #475569;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-danger:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }

  .btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-warning {
    background: #f59e0b;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-warning:hover {
    background: #d97706;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  .btn-warning:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-edit {
    color: #f59e0b;
  }
  
  .btn-edit:hover {
    background: #fef3c7;
    color: #d97706;
  }
  
  .btn-role {
    color: #8b5cf6;
  }
  
  .btn-role:hover {
    background: #f3e8ff;
    color: #7c3aed;
  }

  .btn-delete {
    color: #ef4444;
  }

  .btn-delete:hover {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .users-container {
    margin-top: 24px;
  }
  
  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
  }
  
  .user-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .user-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
  
  .user-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, rgba(30, 144, 255, 0.05) 0%, rgba(135, 206, 235, 0.02) 100%);
    border-bottom: 1px solid #e2e8f0;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 18px;
  }
  
  .user-details h3 {
    margin: 0 0 4px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }
  
  .user-details p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
  }
  
  .user-actions {
    display: flex;
    gap: 8px;
  }
  
  
  /* 对话框样式 */
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .dialog {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .dialog-large {
    max-width: 800px;
  }
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .dialog-header h3 {
    margin: 0;
    color: #1e293b;
    font-size: 18px;
    font-weight: 600;
  }
  
  .btn-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #64748b;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.3s ease;
  }
  
  .btn-close:hover {
    background: #f1f5f9;
    color: #475569;
  }
  
  .dialog-body {
    padding: 24px;
  }
  
  .user-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .form-row {
    display: flex;
    gap: 16px;
  }
  
  .form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .form-group label {
    margin-bottom: 8px;
    color: #374151;
    font-weight: 600;
    font-size: 14px;
  }
  
  .form-group input,
  .form-group select {
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
  }
  
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #1e90ff;
    box-shadow: 0 0 0 3px rgba(30, 144, 255, 0.1);
  }
  
  .dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
  }
  
  /* 角色管理对话框特殊样式 */
  .role-user-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 24px;
  }
  
  .role-user-info .user-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .role-user-info h4 {
    margin: 0 0 4px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }
  
  .role-user-info p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
  }
  
  .role-selection h4 {
    margin: 0 0 16px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }
  
  .role-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .role-option {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  .role-option:hover {
    background: #f8fafc;
    border-color: #1e90ff;
  }
  
  .role-option input[type="radio"] {
    margin: 0;
    accent-color: #1e90ff;
  }

  /* 用户详情对话框样式 */
  .user-details-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .details-section {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
  }

  .details-section h4 {
    margin: 0 0 16px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
  }

  .user-basic-info {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .user-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1e90ff 0%, #87ceeb 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 32px;
  }

  .user-basic-details h3 {
    margin: 0 0 8px 0;
    color: #1e293b;
    font-size: 20px;
    font-weight: 600;
  }

  .user-basic-details p {
    margin: 0 0 4px 0;
    color: #64748b;
    font-size: 14px;
  }

  .created-time {
    color: #94a3b8 !important;
    font-size: 12px !important;
  }

  .roles-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .role-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .role-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .role-name {
    font-weight: 600;
    color: #1e293b;
    font-size: 14px;
  }

  .role-description {
    color: #64748b;
    font-size: 12px;
  }

  .role-assigned-time {
    color: #94a3b8;
    font-size: 12px;
  }


  /* 内联编辑样式 */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .btn-edit-inline {
    background: #f59e0b;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-edit-inline:hover {
    background: #d97706;
    transform: translateY(-1px);
  }

  .edit-form-in-details {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
  }

  .edit-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
  }

  /* 角色编辑样式 */
  .edit-role-in-details {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
  }

  .edit-role-in-details h5 {
    margin: 0 0 16px 0;
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
  }

  .edit-role-in-details .role-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .edit-role-in-details .role-option {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .edit-role-in-details .role-option:hover {
    background: #f8fafc;
    border-color: #1e90ff;
  }

  .edit-role-in-details .role-option input[type="radio"] {
    margin: 0;
    accent-color: #1e90ff;
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .users-grid {
      grid-template-columns: 1fr;
    }
    
    .user-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .header-actions {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      width: 100%;
    }

    .search-input {
      width: 100%;
    }
    
    .form-row {
      flex-direction: column;
      gap: 0;
    }
    
    .dialog {
      width: 95%;
      margin: 20px;
    }
    
    .dialog-actions {
      flex-direction: column;
    }
    
    .btn-primary,
    .btn-secondary {
      width: 100%;
    }

    .user-basic-info {
      flex-direction: column;
      text-align: center;
    }


    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .edit-actions {
      flex-direction: column;
    }

    .btn-edit-inline {
      width: 100%;
      justify-content: center;
    }

    .edit-role-in-details .role-options {
      gap: 8px;
    }

    .edit-role-in-details .role-option {
      padding: 10px;
    }
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #64748b;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #1e90ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .role-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .role-badge.role-user {
    background: #bee3f8;
    color: #2b6cb0;
  }

  .role-badge.role-teacher {
    background: #fef3c7;
    color: #92400e;
  }

  .role-badge.role-admin {
    background: #fed7d7;
    color: #c53030;
  }

  .user-roles {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }

  .role-checkboxes {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .role-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .role-checkbox:hover {
    background: #f8fafc;
    border-color: #1e90ff;
  }

  .role-checkbox input[type="checkbox"] {
    margin: 0;
    accent-color: #1e90ff;
  }
  </style>
  