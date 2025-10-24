import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/utils/supabase'
import { MessageUtils } from '@/utils/common'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const loading = ref(false)
  const session = ref(null)
  const initialized = ref(false)
  const showLoginPage = ref(true)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userName = computed(() => user.value?.user_metadata?.name || user.value?.email || '用户')
  const userAvatar = computed(() => user.value?.user_metadata?.avatar_url || '')

  // 初始化认证状态
  const initAuth = async () => {
    try {
      loading.value = true
      
      // 获取当前会话
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('获取会话失败:', error)
        return
      }

      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
      }

      // 监听认证状态变化
      supabase.auth.onAuthStateChange((event, currentSession) => {
        console.log('认证状态变化:', event, currentSession)
        
        if (event === 'SIGNED_IN') {
          session.value = currentSession
          user.value = currentSession.user
          // 移除自动登录成功提示，只在用户主动登录时显示
        } else if (event === 'SIGNED_OUT') {
          session.value = null
          user.value = null
          // 移除登出提示，避免与Layout组件中的确认提示重复
        }
      })
    } catch (error) {
      console.error('初始化认证失败:', error)
      MessageUtils.error('初始化认证失败')
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  // 获取客户端IP地址
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      return 'unknown'
    }
  }

  // 记录登录历史
  const recordLogin = async (user) => {
    try {
      console.log('开始记录登录历史，用户ID:', user.id)
      
      // 获取客户端IP地址
      const ipAddress = await getClientIP()
      console.log('获取到的IP地址:', ipAddress)
      
      // 记录登录历史
      const { data, error } = await supabase
        .from('user_login_history')
        .insert({
          user_id: user.id,
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          login_time: new Date().toISOString()
        })
      
      if (error) {
        console.error('记录登录历史失败:', error)
      } else {
        console.log('登录历史记录成功:', data)
      }
    } catch (error) {
      console.error('记录登录历史失败:', error)
    }
  }

  // 关闭登录页面
  const closeLoginPage = () => {
    showLoginPage.value = false
  }

  // 登录
  const login = async (email, password) => {
    try {
      loading.value = true
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      // 立即同步本地会话与用户，避免界面仍渲染登录页
      if (data) {
        if (data.session) {
          session.value = data.session
        }
        if (data.user) {
          user.value = data.user
        }
      }

      // 记录登录历史
      if (data.user) {
        await recordLogin(data.user)
      }

      return { success: true, data }
    } catch (error) {
      console.error('登录失败:', error)
      MessageUtils.error(error.message || '登录失败')
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (email, password, name) => {
    try {
      loading.value = true
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      })

      if (error) {
        throw error
      }

      MessageUtils.success('注册成功，请检查邮箱验证邮件')
      return { success: true, data }
    } catch (error) {
      console.error('注册失败:', error)
      MessageUtils.error(error.message || '注册失败')
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      loading.value = true
      
      // 先检查当前会话是否存在
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        // 如果会话存在，正常登出
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.warn('Supabase登出失败，但继续清理本地状态:', error)
        }
      } else {
        console.log('当前没有活跃会话，直接清理本地状态')
      }

      // 无论如何都清理本地状态
      session.value = null
      user.value = null
      showLoginPage.value = true
      
      return { success: true }
    } catch (error) {
      console.error('登出过程中发生错误:', error)
      
      // 即使出错也要清理本地状态
      session.value = null
      user.value = null
      showLoginPage.value = true
      
      // 不显示错误消息，因为本地状态已经清理
      return { success: true }
    } finally {
      loading.value = false
    }
  }

  // 重置密码
  const resetPassword = async (email) => {
    try {
      loading.value = true
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // 使用当前站点的 /reset-password 作为重定向页
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw error
      }

      MessageUtils.success('密码重置邮件已发送，请检查邮箱')
      return { success: true }
    } catch (error) {
      console.error('重置密码失败:', error)
      MessageUtils.error(error.message || '重置密码失败')
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 更新当前用户密码（用于邮箱链接跳到重置页后的提交）
  const updatePassword = async (newPassword) => {
    try {
      loading.value = true
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      return true
    } catch (error) {
      console.error('更新密码失败:', error)
      MessageUtils.error(error.message || '更新密码失败')
      return false
    } finally {
      loading.value = false
    }
  }

  // 更新用户信息
  const updateProfile = async (updates) => {
    try {
      loading.value = true
      
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) {
        throw error
      }

      // 更新本地用户状态
      user.value = data.user
      session.value = data.session
      
      MessageUtils.success('用户信息更新成功')
      return { success: true, data }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      MessageUtils.error(error.message || '更新用户信息失败')
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    user,
    loading,
    session,
    initialized,
    showLoginPage,
    
    // 计算属性
    isAuthenticated,
    userEmail,
    userName,
    userAvatar,
    
    // 方法
    initAuth,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    updatePassword,
    closeLoginPage
  }
})
