import { supabase, TABLES } from '@/utils/supabase'

// KOS销售数据管理API
export class SalesDataAPI {
  // 获取销售数据列表
  static async getSalesDataList(params = {}) {
    const { 
      page = 1, 
      pageSize = 50, 
      search = '', 
      brandId = '', 
      cycleType = '', 
      startDate = '', 
      endDate = '' 
    } = params
    
    let query = supabase
      .from(TABLES.SALES_DATA)
      .select('*', { count: 'exact' })
    
    // 搜索条件
    if (search) {
      query = query.or(`品牌.ilike.%${search}%,员工姓名.ilike.%${search}%,店铺编号.ilike.%${search}%`)
    }
    
    // 筛选条件
    if (brandId) {
      query = query.eq('品牌ID', brandId)
    }
    
    if (cycleType) {
      query = query.eq('周期类型', cycleType)
    }
    
    if (startDate && endDate) {
      console.log('日期范围查询:', { startDate, endDate })
      // 先查询所有数据看看日期格式
      const { data: allData } = await supabase
        .from(TABLES.SALES_DATA)
        .select('短日期, 日期')
        .limit(5)
      console.log('数据库中的日期格式示例:', allData)
      
      // 尝试使用日期字段进行查询
      query = query.gte('日期', startDate).lte('日期', endDate)
    }
    
    // 分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    query = query.range(from, to).order('短日期', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`获取销售数据失败: ${error.message}`)
    }
    
    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize
    }
  }
  
  // 获取单个销售数据（通过复合主键查询）
  static async getSalesDataById(brandId, cycleType, shortDate, employeeName, storeCode) {
    const { data, error } = await supabase
      .from(TABLES.SALES_DATA)
      .select('*')
      .eq('品牌ID', brandId)
      .eq('周期类型', cycleType)
      .eq('短日期', shortDate)
      .eq('员工姓名', employeeName)
      .eq('店铺编号', storeCode)
      .single()
    
    if (error) {
      throw new Error(`获取销售数据失败: ${error.message}`)
    }
    
    return data
  }
  
  // 创建销售数据
  static async createSalesData(salesData) {
    const { data, error } = await supabase
      .from(TABLES.SALES_DATA)
      .insert([salesData])
      .select()
      .single()
    
    if (error) {
      throw new Error(`创建销售数据失败: ${error.message}`)
    }
    
    return data
  }
  
  // 更新销售数据（通过复合主键更新）
  static async updateSalesData(brandId, cycleType, shortDate, employeeName, storeCode, updateData) {
    const { data, error } = await supabase
      .from(TABLES.SALES_DATA)
      .update(updateData)
      .eq('品牌ID', brandId)
      .eq('周期类型', cycleType)
      .eq('短日期', shortDate)
      .eq('员工姓名', employeeName)
      .eq('店铺编号', storeCode)
      .select()
      .single()
    
    if (error) {
      throw new Error(`更新销售数据失败: ${error.message}`)
    }
    
    return data
  }
  
  // 删除销售数据（通过复合主键删除）
  static async deleteSalesData(brandId, cycleType, shortDate, employeeName, storeCode) {
    const { error } = await supabase
      .from(TABLES.SALES_DATA)
      .delete()
      .eq('品牌ID', brandId)
      .eq('周期类型', cycleType)
      .eq('短日期', shortDate)
      .eq('员工姓名', employeeName)
      .eq('店铺编号', storeCode)
    
    if (error) {
      throw new Error(`删除销售数据失败: ${error.message}`)
    }
  }
  
  // 批量导入销售数据（覆盖模式，使用upsert基于复合主键）
  static async batchImportSalesData(salesDataList) {
    const { data, error } = await supabase
      .from(TABLES.SALES_DATA)
      .upsert(salesDataList, {
        onConflict: '品牌ID,周期类型,短日期,员工姓名,店铺编号'
      })
      .select()
    
    if (error) {
      throw new Error(`批量导入销售数据失败: ${error.message}`)
    }
    
    return data
  }
  
  // 批量删除销售数据
  static async batchDeleteSalesData(salesDataList) {
    const deletePromises = salesDataList.map(row => 
      supabase
        .from(TABLES.SALES_DATA)
        .delete()
        .eq('品牌ID', row.品牌ID)
        .eq('周期类型', row.周期类型)
        .eq('短日期', row.短日期)
        .eq('员工姓名', row.员工姓名)
        .eq('店铺编号', row.店铺编号)
    )
    
    const results = await Promise.all(deletePromises)
    
    // 检查是否有错误
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      throw new Error(`批量删除失败: ${errors[0].error.message}`)
    }
    
    return results
  }
  
  // 获取统计数据
  static async getSalesStatistics(params = {}) {
    const { brandId = '', startDate = '', endDate = '' } = params
    
    let query = supabase
      .from(TABLES.SALES_DATA)
      .select('小红书成单, 本期累计成单, 企微留资数')
    
    if (brandId) {
      query = query.eq('品牌ID', brandId)
    }
    
    if (startDate && endDate) {
      query = query.gte('短日期', startDate).lte('短日期', endDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`获取统计数据失败: ${error.message}`)
    }
    
    // 计算统计数据
    const totalOrderAmount = data.reduce((sum, item) => sum + (item.小红书成单 || 0), 0)
    const totalLeads = data.reduce((sum, item) => sum + (item.企微留资数 || 0), 0)
    const totalOrders = data.reduce((sum, item) => sum + (item.本期累计成单 || 0), 0)
    
    return {
      totalOrderAmount,
      totalLeads,
      totalOrders,
      averageOrderAmount: data.length > 0 ? totalOrderAmount / data.length : 0
    }
  }
}
