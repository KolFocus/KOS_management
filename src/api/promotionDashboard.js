import { supabase } from '../utils/supabase'
import { getCurrentUserId } from '../utils/userIsolation'

export const PromotionDashboardAPI = {
  async fetchPromotionDashboard(params = {}) {
    const { brandIds = [], promotionStart, promotionEnd, noteStart, noteEnd } = params
    const supaUserId = await getCurrentUserId()
    if (!supaUserId) {
      throw new Error('用户未登录，无法获取推广数据')
    }

    if (!Array.isArray(brandIds) || brandIds.length === 0) {
      throw new Error('请选择至少一个品牌')
    }

    const payload = {
      p_brand_ids: brandIds,
      p_promotion_start_date: promotionStart || null,
      p_promotion_end_date: promotionEnd || null,
      p_note_start_date: noteStart || null,
      p_note_end_date: noteEnd || null
    }

    const { data, error } = await supabase.rpc('get_kos_promotion_dashboard', payload)
    if (error) throw error
    const normalized = Array.isArray(data) ? data : data ? [data] : []
    return normalized
  }
}


