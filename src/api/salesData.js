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
      exactDate = '' // 精确日期匹配（周起始日）
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
    
    if (exactDate) {
      query = query.eq('日期', exactDate)
    }
    
    // 先获取所有符合条件的数据（在前端排序/分页以确保格式一致）
    const { data: allData, error: allError, count } = await query
    
    if (allError) {
      throw new Error(`获取销售数据失败: ${allError.message}`)
    }
    
    const filteredData = allData || []
    
    // 前端排序：将日期字符串转换为Date对象进行比较，从大到小（倒序）
    const sortedData = filteredData.sort((a, b) => {
      const dateA = a.日期 ? new Date(a.日期) : new Date(0)
      const dateB = b.日期 ? new Date(b.日期) : new Date(0)
      return dateB.getTime() - dateA.getTime() // 倒序：最新的在前
    })
    
    // 前端分页
    const from = (page - 1) * pageSize
    const to = from + pageSize
    const paginatedData = sortedData.slice(from, to)
    
    return {
      data: paginatedData,
      total: count ?? sortedData.length,
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
    const { brandId = '', exactDate = '', cycleType = '' } = params
    
    const userId = await getCurrentUserId()
    if (!userId) {
      throw new Error('用户未登录，无法获取统计数据')
    }
    
    let query = supabase
      .from(TABLES.SALES_DATA)
      .select('小红书成单, 本期累计成单, 企微留资数')
      .eq('supabase_user_id', userId)
    
    if (brandId) {
      query = query.eq('品牌ID', brandId)
    }
    
    if (cycleType) {
      query = query.eq('周期类型', cycleType)
    }
    
    if (exactDate) {
      query = query.eq('日期', exactDate)
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
