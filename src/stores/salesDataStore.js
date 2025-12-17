import { create } from 'zustand'
import { SalesDataAPI } from '../api/salesData'

export const useSalesDataStore = create((set, get) => ({
  // State
  salesDataList: [],
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 50,
  searchParams: {
    search: '',
    brandId: '',
    cycleType: '',
    exactDate: '' // 精确日期匹配（周的起始日期）
  },
  statistics: {
    totalOrderAmount: 0,
    totalLeads: 0,
    totalOrders: 0,
    averageOrderAmount: 0
  },

  // Getters
  getBrandList: () => {
    const { salesDataList } = get()
    const brands = [...new Set(salesDataList.map(item => item.品牌).filter(Boolean))]
    return brands
  },
  
  getEmployeeList: () => {
    const { salesDataList } = get()
    const employees = [...new Set(salesDataList.map(item => item.员工姓名).filter(Boolean))]
    return employees
  },
  
  getShopList: () => {
    const { salesDataList } = get()
    const shops = [...new Set(salesDataList.map(item => item.店铺编号).filter(Boolean))]
    return shops
  },

  // Actions
  fetchSalesDataList: async (params = {}) => {
    const { currentPage, pageSize, searchParams } = get()
    set({ loading: true })
    
    try {
      const queryParams = {
        page: currentPage,
        pageSize: pageSize,
        ...searchParams,
        ...params
      }
      
      const result = await SalesDataAPI.getSalesDataList(queryParams)
      
      set({
        salesDataList: result.data,
        total: result.total,
        currentPage: result.page,
        loading: false
      })
      
      return result
    } catch (error) {
      console.error('获取销售数据失败:', error)
      set({ loading: false })
      throw error
    }
  },
  
  fetchStatistics: async (params = {}) => {
    const { searchParams } = get()
    
    try {
      const queryParams = {
        ...searchParams,
        ...params
      }
      
      const stats = await SalesDataAPI.getSalesStatistics(queryParams)
      set({ statistics: stats })
      return stats
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw error
    }
  },
  
  createSalesData: async (salesData) => {
    try {
      const newData = await SalesDataAPI.createSalesData(salesData)
      set(state => ({
        salesDataList: [newData, ...state.salesDataList],
        total: state.total + 1
      }))
      return newData
    } catch (error) {
      console.error('创建销售数据失败:', error)
      throw error
    }
  },
  
  updateSalesData: async (brandId, cycleType, date, employeeName, storeCode, updateData) => {
    try {
      const updatedData = await SalesDataAPI.updateSalesData(
        brandId,
        cycleType,
        date,
        employeeName,
        storeCode,
        updateData
      )
      
      set(state => {
        const index = state.salesDataList.findIndex(item => 
          item.品牌ID === brandId &&
          item.周期类型 === cycleType &&
          item.日期 === date &&
          item.员工姓名 === employeeName &&
          item.店铺编号 === storeCode
        )
        
        if (index !== -1) {
          const newList = [...state.salesDataList]
          newList[index] = updatedData
          return { salesDataList: newList }
        }
        
        return state
      })
      
      return updatedData
    } catch (error) {
      console.error('更新销售数据失败:', error)
      throw error
    }
  },
  
  deleteSalesData: async (brandId, cycleType, date, employeeName, storeCode) => {
    try {
      await SalesDataAPI.deleteSalesData(
        brandId,
        cycleType,
        date,
        employeeName,
        storeCode
      )
      
      set(state => ({
        salesDataList: state.salesDataList.filter(item => 
          !(item.品牌ID === brandId &&
            item.周期类型 === cycleType &&
            item.日期 === date &&
            item.员工姓名 === employeeName &&
            item.店铺编号 === storeCode)
        ),
        total: state.total - 1
      }))
    } catch (error) {
      console.error('删除销售数据失败:', error)
      throw error
    }
  },
  
  batchImportSalesData: async (salesDataList) => {
    try {
      const result = await SalesDataAPI.batchImportSalesData(salesDataList)
      // 重新获取数据列表
      await get().fetchSalesDataList()
      return result
    } catch (error) {
      console.error('批量导入销售数据失败:', error)
      throw error
    }
  },
  
  batchDeleteSalesData: async (salesDataList) => {
    try {
      await SalesDataAPI.batchDeleteSalesData(salesDataList)
      // 重新获取数据列表
      await get().fetchSalesDataList()
    } catch (error) {
      console.error('批量删除销售数据失败:', error)
      throw error
    }
  },
  
  setSearchParams: (params) => {
    set(state => {
      const newSearchParams = { ...state.searchParams, ...params }
      return {
        searchParams: newSearchParams,
        currentPage: 1
      }
    })
  },
  
  setPagination: (page, pageSize) => {
    set({ currentPage: page, pageSize: pageSize })
  },
  
  reset: () => {
    set({
      salesDataList: [],
      loading: false,
      total: 0,
      currentPage: 1,
      pageSize: 50,
      searchParams: {
        search: '',
        brandId: '',
        cycleType: '',
        exactDate: ''
      },
      statistics: {
        totalOrderAmount: 0,
        totalLeads: 0,
        totalOrders: 0,
        averageOrderAmount: 0
      }
    })
  }
}))
