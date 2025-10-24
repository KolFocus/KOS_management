import { supabase, TABLES } from '@/utils/supabase'
import { getCurrentUserId } from '@/utils/userIsolation'

// KOS列表管理API
export class KosListAPI {
  // 获取KOS列表
  static async getKosList(params = {}) {
    const { page = 1, pageSize = 20, search = '', brandId = '', status = '' } = params
    
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('用户未登录，无法获取KOS列表')
    }
    
    let query = supabase
      .from(TABLES.KOS_LIST)
      .select('*', { count: 'exact' })
      .eq('supabase_user_id', userId)
    
    // 搜索条件
    if (search) {
      query = query.or(`品牌.ilike.%${search}%,用户ID.ilike.%${search}%`)
    }
    
    // 筛选条件
    if (brandId) {
      query = query.eq('品牌ID', brandId)
    }
    
    if (status !== '') {
      query = query.eq('参与统计', status)
    }
    
    // 分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    // 数据库排序：先按"排序"升序（空值排在最后），再按"品牌ID"升序
    query = query
      .order('排序', { ascending: true, nullsLast: true })
      .order('品牌ID', { ascending: true })
      .range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`获取KOS列表失败: ${error.message}`)
    }
    
    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize
    }
  }
  
  // 获取单个KOS信息
  static async getKosById(brandId, userId) {
    const { data, error } = await supabase
      .from(TABLES.KOS_LIST)
      .select('*')
      .eq('品牌ID', brandId)
      .eq('用户ID', userId)
      .single()
    
    if (error) {
      throw new Error(`获取KOS信息失败: ${error.message}`)
    }
    
    return data
  }
  
  // 创建KOS
  static async createKos(kosData) {
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('用户未登录，无法创建KOS')
    }

    const { data, error } = await supabase
      .from(TABLES.KOS_LIST)
      .insert([{
        ...kosData,
        supabase_user_id: userId
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`创建KOS失败: ${error.message}`)
    }
    
    return data
  }
  
  // 更新KOS
  static async updateKos(brandId, userId, updateData) {
    const { data, error } = await supabase
      .from(TABLES.KOS_LIST)
      .update(updateData)
      .eq('品牌ID', brandId)
      .eq('用户ID', userId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`更新KOS失败: ${error.message}`)
    }
    
    return data
  }
  
  // 删除KOS
  static async deleteKos(brandId, userId) {
    const { error } = await supabase
      .from(TABLES.KOS_LIST)
      .delete()
      .eq('品牌ID', brandId)
      .eq('用户ID', userId)
    
    if (error) {
      throw new Error(`删除KOS失败: ${error.message}`)
    }
  }
  
  // 批量更新状态
  static async batchUpdateStatus(kosList, status) {
    const updates = kosList.map(kos => ({
      品牌ID: kos.品牌ID,
      用户ID: kos.用户ID,
      参与统计: status,
      // 保留原有字段，避免NOT NULL约束错误
      品牌: kos.品牌,
      排序: kos.排序,
      所属用户: kos.所属用户,
      所属店铺: kos.所属店铺,
      渠道: kos.渠道
    }))
    
    const { data, error } = await supabase
      .from(TABLES.KOS_LIST)
      .upsert(updates)
      .select()
    
    if (error) {
      throw new Error(`批量更新状态失败: ${error.message}`)
    }
    
    return data
  }
  
  // 批量删除KOS
  static async batchDeleteKos(kosList) {
    const deletePromises = kosList.map(kos => 
      supabase
        .from(TABLES.KOS_LIST)
        .delete()
        .eq('品牌ID', kos.品牌ID)
        .eq('用户ID', kos.用户ID)
    )
    
    const results = await Promise.all(deletePromises)
    
    // 检查是否有错误
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      throw new Error(`批量删除失败: ${errors[0].error.message}`)
    }
    
    return results
  }
  
  // 批量导入KOS（覆盖模式，使用upsert基于复合主键）
  static async batchImportKos(kosList) {
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('用户未登录，无法导入KOS数据')
    }

    // 为所有KOS数据添加用户ID
    const kosListWithUserId = kosList.map(kos => ({
      ...kos,
      supabase_user_id: userId
    }))

    const { data, error } = await supabase
      .from(TABLES.KOS_LIST)
      .upsert(kosListWithUserId, {
        onConflict: '品牌ID,用户ID'
      })
      .select()
    
    if (error) {
      throw new Error(`批量导入KOS失败: ${error.message}`)
    }
    
    return data
  }
}
