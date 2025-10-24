import { supabase } from '../utils/supabase.js'
import { getCurrentUserId } from '../utils/userIsolation.js'

// 品牌管理API
export const brandManagementAPI = {
  // 获取品牌列表
  async getBrands() {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('用户未登录，无法获取品牌列表')
      }

      const { data, error } = await supabase
        .from('用户品牌表')
        .select('*')
        .eq('supabase_user_id', userId)
        .order('排序', { ascending: true })
        .order('创建时间', { ascending: true })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('获取品牌列表失败:', error)
      return { data: null, error }
    }
  },

  // 添加品牌
  async addBrand(brandData) {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('用户未登录，无法创建品牌')
      }

      const { data, error } = await supabase
        .from('用户品牌表')
        .insert([{
          品牌: brandData.品牌,
          排序: brandData.排序 || 0,
          supabase_user_id: userId
        }])
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('添加品牌失败:', error)
      return { data: null, error }
    }
  },

  // 更新品牌
  async updateBrand(id, brandData) {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('用户未登录，无法更新品牌')
      }

      const { data, error } = await supabase
        .from('用户品牌表')
        .update({
          品牌: brandData.品牌,
          排序: brandData.排序
        })
        .eq('ID', id)
        .eq('supabase_user_id', userId)
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('更新品牌失败:', error)
      return { data: null, error }
    }
  },

  // 删除品牌
  async deleteBrand(id) {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('用户未登录，无法删除品牌')
      }

      // 先检查是否有关联的平台数据
      const { data: platforms, error: checkError } = await supabase
        .from('用户平台表')
        .select('品牌ID')
        .eq('品牌ID', id)
        .eq('supabase_user_id', userId)
      
      if (checkError) throw checkError
      
      if (platforms && platforms.length > 0) {
        throw new Error('该品牌下存在平台关联数据，无法删除')
      }

      const { data, error } = await supabase
        .from('用户品牌表')
        .delete()
        .eq('ID', id)
        .eq('supabase_user_id', userId)
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('删除品牌失败:', error)
      return { data: null, error }
    }
  },

  // 获取平台列表
  async getPlatforms() {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('用户未登录，无法获取平台列表')
      }

      const { data, error } = await supabase
        .from('用户平台表')
        .select('*')
        .eq('supabase_user_id', userId)
        .order('品牌', { ascending: true })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('获取平台列表失败:', error)
      return { data: null, error }
    }
  },

  // 添加平台
  async addPlatform(platformData) {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('用户未登录，无法创建平台')
      }

      const { data, error } = await supabase
        .from('用户平台表')
        .insert([{
          品牌: platformData.品牌,
          品牌ID: platformData.品牌ID,
          平台: platformData.平台,
          平台类型: platformData.平台类型,
          平台ID: platformData.平台ID,
          supabase_user_id: userId
        }])
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('添加平台失败:', error)
      return { data: null, error }
    }
  },

  // 更新平台
  async updatePlatform(brandId, platformType, platformId, platformData) {
    try {
      const { data, error } = await supabase
        .from('用户平台表')
        .update({
          品牌: platformData.品牌,
          品牌ID: platformData.品牌ID,
          平台: platformData.平台,
          平台类型: platformData.平台类型,
          平台ID: platformData.平台ID
        })
        .eq('品牌ID', brandId)
        .eq('平台类型', platformType)
        .eq('平台ID', platformId)
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('更新平台失败:', error)
      return { data: null, error }
    }
  },

  // 删除平台
  async deletePlatform(brandId, platformType, platformId) {
    try {
      const { data, error } = await supabase
        .from('用户平台表')
        .delete()
        .eq('品牌ID', brandId)
        .eq('平台类型', platformType)
        .eq('平台ID', platformId)
        .select()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('删除平台失败:', error)
      return { data: null, error }
    }
  },

  // 检查品牌是否有平台关联
  async checkBrandHasPlatforms(brandId) {
    try {
      const { data, error } = await supabase
        .from('用户平台表')
        .select('品牌ID')
        .eq('品牌ID', brandId)
        .limit(1)
      
      if (error) throw error
      return { hasPlatforms: data && data.length > 0, error: null }
    } catch (error) {
      console.error('检查品牌平台关联失败:', error)
      return { hasPlatforms: false, error }
    }
  }
}
