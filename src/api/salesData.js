import { supabase, TABLES } from '../utils/supabase'
import { getCurrentUserId } from '../utils/userIsolation'

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
    
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('用户未登录，无法获取销售数据列表')
    }
    
    let query = supabase
      .from(TABLES.SALES_DATA)
      .select('*', { count: 'exact' })
      .eq('supabase_user_id', userId)
    
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
        .select('日期')
        .limit(5)
      console.log('数据库中的日期格式示例:', allData)
      
      // 尝试使用日期字段进行查询
      query = query.gte('日期', startDate).lte('日期', endDate)
    }
    
    // 分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    query = query.range(from, to).order('日期', { ascending: false, nullsLast: true })
    
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
  static async getSalesDataById(brandId, cycleType, date, employeeName, storeCode) {
    const { data, error } = await supabase
      .from(TABLES.SALES_DATA)
      .select('*')
      .eq('品牌ID', brandId)
      .eq('周期类型', cycleType)
      .eq('日期', date)
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
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('用户未登录，无法创建销售数据')
    }

    const { data, error } = await supabase
      .from(TABLES.SALES_DATA)
      .insert([{
        ...salesData,
        supabase_user_id: userId
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`创建销售数据失败: ${error.message}`)
    }
    
    return data
  }
  
  // 更新销售数据（通过复合主键更新）
  static async updateSalesData(brandId, cycleType, date, employeeName, storeCode, updateData) {
    const { data, error } = await supabase
      .from(TABLES.SALES_DATA)
      .update(updateData)
      .eq('品牌ID', brandId)
      .eq('周期类型', cycleType)
      .eq('日期', date)
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
  static async deleteSalesData(brandId, cycleType, date, employeeName, storeCode) {
    const { error } = await supabase
      .from(TABLES.SALES_DATA)
      .delete()
      .eq('品牌ID', brandId)
      .eq('周期类型', cycleType)
      .eq('日期', date)
      .eq('员工姓名', employeeName)
      .eq('店铺编号', storeCode)
    
    if (error) {
      throw new Error(`删除销售数据失败: ${error.message}`)
    }
  }
  
  // 批量导入销售数据（覆盖模式，手动处理重复数据）
  static async batchImportSalesData(salesDataList) {
    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('用户未登录，无法导入销售数据')
      }

      const results = []
      
      for (const salesData of salesDataList) {
        // 为销售数据添加用户ID
        const salesDataWithUserId = {
          ...salesData,
          supabase_user_id: userId
        }

        // 检查是否存在相同主键的记录
        const { data: existingData, error: checkError } = await supabase
          .from(TABLES.SALES_DATA)
          .select('*')
          .eq('品牌ID', salesData.品牌ID)
          .eq('周期类型', salesData.周期类型)
          .eq('日期', salesData.日期)
          .eq('员工姓名', salesData.员工姓名)
          .eq('店铺编号', salesData.店铺编号)
          .eq('supabase_user_id', userId)
          .single()
        
        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 表示没有找到记录，这是正常的
          throw new Error(`检查重复数据失败: ${checkError.message}`)
        }

        if (existingData) {
          // 如果存在，则更新
          const { data: updatedData, error: updateError } = await supabase
            .from(TABLES.SALES_DATA)
            .update(salesDataWithUserId)
            .eq('品牌ID', salesData.品牌ID)
            .eq('周期类型', salesData.周期类型)
            .eq('日期', salesData.日期)
            .eq('员工姓名', salesData.员工姓名)
            .eq('店铺编号', salesData.店铺编号)
            .eq('supabase_user_id', userId)
            .select()
            .single()

          if (updateError) {
            throw new Error(`更新销售数据失败: ${updateError.message}`)
          }

          results.push(updatedData)
        } else {
          // 如果不存在，则插入
          const { data: insertedData, error: insertError } = await supabase
            .from(TABLES.SALES_DATA)
            .insert(salesDataWithUserId)
            .select()
            .single()

          if (insertError) {
            throw new Error(`插入销售数据失败: ${insertError.message}`)
          }

          results.push(insertedData)
        }
      }
      
      return results
    } catch (error) {
      throw new Error(`批量导入销售数据失败: ${error.message}`)
    }
  }
  
  // 批量删除销售数据
  static async batchDeleteSalesData(salesDataList) {
    const deletePromises = salesDataList.map(row => 
      supabase
        .from(TABLES.SALES_DATA)
        .delete()
        .eq('品牌ID', row.品牌ID)
        .eq('周期类型', row.周期类型)
        .eq('日期', row.日期)
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
      query = query.gte('日期', startDate).lte('日期', endDate)
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
