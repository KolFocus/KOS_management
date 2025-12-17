import { create } from 'zustand'
import { supabase } from '../utils/supabase'

let authSubscription = null

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,
  showLoginPage: true,
  authError: null,

  initAuth: async () => {
    if (get().initialized) {
      return
    }

    set({ loading: true })

    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      if (data?.session) {
        set({
          session: data.session,
          user: data.session.user,
          showLoginPage: false
        })
      }

      if (!authSubscription) {
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
          set({
            session: session || null,
            user: session?.user || null,
            showLoginPage: !session
          })
        })

        authSubscription = subscription?.subscription || subscription
      }
    } catch (error) {
      console.error('初始化认证失败:', error)
      set({ authError: error.message })
    } finally {
      set({ loading: false, initialized: true })
    }
  },

  login: async ({ email, password }) => {
    set({ loading: true, authError: null })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        throw error
      }

      if (data?.session) {
        set({
          session: data.session,
          user: data.session.user,
          showLoginPage: false
        })
      }

      if (data?.user) {
        await get().recordLogin(data.user)
      }

      return { success: true, data }
    } catch (error) {
      console.error('登录失败:', error)
      set({ authError: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  register: async ({ email, password, name }) => {
    set({ loading: true, authError: null })

    try {
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

      return { success: true, data }
    } catch (error) {
      console.error('注册失败:', error)
      set({ authError: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, authError: null })

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('重置密码失败:', error)
      set({ authError: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updatePassword: async (newPassword) => {
    set({ loading: true, authError: null })

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('更新密码失败:', error)
      set({ authError: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateProfile: async (updates = {}) => {
    set({ loading: true, authError: null })

    try {
      const { data, error } = await supabase.auth.updateUser({ data: updates })

      if (error) {
        throw error
      }

      set({
        user: data.user,
        session: data.session
      })

      return { success: true, data }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      set({ authError: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    set({ loading: true, authError: null })

    try {
      const { data } = await supabase.auth.getSession()

      if (data?.session) {
        const { error } = await supabase.auth.signOut()

        if (error) {
          console.warn('Supabase登出失败，但继续清理本地状态:', error)
        }
      }

      set({
        session: null,
        user: null,
        showLoginPage: true
      })

      return { success: true }
    } catch (error) {
      console.error('登出过程中发生错误:', error)
      set({
        session: null,
        user: null,
        showLoginPage: true,
        authError: error.message
      })

      return { success: false, error: error.message }
    } finally {
      set({ loading: false })
    }
  },

  closeLoginPage: () => set({ showLoginPage: false }),

  getClientIP: async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      console.error('获取IP地址失败:', error)
      return 'unknown'
    }
  },

  recordLogin: async (user) => {
    try {
      const ipAddress = await get().getClientIP()

      const { error } = await supabase
        .from('user_login_history')
        .insert({
          user_id: user.id,
          ip_address: ipAddress,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          login_time: new Date().toISOString()
        })

      if (error) {
        console.error('记录登录历史失败:', error)
      }
    } catch (error) {
      console.error('记录登录历史失败:', error)
    }
  },

  clearError: () => set({ authError: null })
}))


