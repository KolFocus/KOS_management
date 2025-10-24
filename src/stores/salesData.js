import { defineStore } from 'pinia'
import { SalesDataAPI } from '@/api/salesData'

export const useSalesDataStore = defineStore('salesData', {
  state: () => ({
    salesDataList: [],
    loading: false,
    total: 0,
    currentPage: 1,
    pageSize: 50,
    searchParams: {
      search: '',
      brandId: '',
      cycleType: '',
      startDate: '',
      endDate: ''
    },
    statistics: {
      totalOrderAmount: 0,
      totalLeads: 0,
      totalOrders: 0,
      averageOrderAmount: 0
    }
  }),
  
  getters: {
    // 获取品牌列表
    brandList: (state) => {
      const brands = [...new Set(state.salesDataList.map(item => item.品牌).filter(Boolean))]
      return brands
    },
    
    // 获取员工列表
    employeeList: (state) => {
      const employees = [...new Set(state.salesDataList.map(item => item.员工姓名).filter(Boolean))]
      return employees
    },
    
    // 获取店铺列表
    shopList: (state) => {
      const shops = [...new Set(state.salesDataList.map(item => item.店铺编号).filter(Boolean))]
      return shops
    },
    
    // 移除周期类型选项，允许自由输入
  },
  
  actions: {
    // 获取销售数据列表
    async fetchSalesDataList(params = {}) {
      this.loading = true
      try {
        const queryParams = {
          page: this.currentPage,
          pageSize: this.pageSize,
          ...this.searchParams,
          ...params
        }
        
        const result = await SalesDataAPI.getSalesDataList(queryParams)
        this.salesDataList = result.data
        this.total = result.total
        this.currentPage = result.page
        
        return result
      } catch (error) {
        console.error('获取销售数据失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 获取统计数据
    async fetchStatistics(params = {}) {
      try {
        const queryParams = {
          ...this.searchParams,
          ...params
        }
        
        const stats = await SalesDataAPI.getSalesStatistics(queryParams)
        this.statistics = stats
        return stats
      } catch (error) {
        console.error('获取统计数据失败:', error)
        throw error
      }
    },
    
    // 创建销售数据
    async createSalesData(salesData) {
      try {
        const newData = await SalesDataAPI.createSalesData(salesData)
        this.salesDataList.unshift(newData)
        this.total += 1
        return newData
      } catch (error) {
        console.error('创建销售数据失败:', error)
        throw error
      }
    },
    
    // 更新销售数据
    async updateSalesData(brandId, cycleType, date, employeeName, storeCode, updateData) {
      try {
        const updatedData = await SalesDataAPI.updateSalesData(
          brandId,
          cycleType,
          date,
          employeeName,
          storeCode,
          updateData
        )
        const index = this.salesDataList.findIndex(item => 
          item.品牌ID === brandId &&
          item.周期类型 === cycleType &&
          item.日期 === date &&
          item.员工姓名 === employeeName &&
          item.店铺编号 === storeCode
        )
        if (index !== -1) {
          this.salesDataList[index] = updatedData
        }
        return updatedData
      } catch (error) {
        console.error('更新销售数据失败:', error)
        throw error
      }
    },
    
    // 删除销售数据
    async deleteSalesData(brandId, cycleType, date, employeeName, storeCode) {
      try {
        await SalesDataAPI.deleteSalesData(
          brandId,
          cycleType,
          date,
          employeeName,
          storeCode
        )
        this.salesDataList = this.salesDataList.filter(item => 
          !(item.品牌ID === brandId &&
            item.周期类型 === cycleType &&
            item.日期 === date &&
            item.员工姓名 === employeeName &&
            item.店铺编号 === storeCode)
        )
        this.total -= 1
      } catch (error) {
        console.error('删除销售数据失败:', error)
        throw error
      }
    },
    
    // 批量导入销售数据
    async batchImportSalesData(salesDataList) {
      try {
        const result = await SalesDataAPI.batchImportSalesData(salesDataList)
        // 重新获取数据列表
        await this.fetchSalesDataList()
        return result
      } catch (error) {
        console.error('批量导入销售数据失败:', error)
        throw error
      }
    },
    
    // 批量删除销售数据
    async batchDeleteSalesData(salesDataList) {
      try {
        await SalesDataAPI.batchDeleteSalesData(salesDataList)
        // 重新获取数据列表
        await this.fetchSalesDataList()
      } catch (error) {
        console.error('批量删除销售数据失败:', error)
        throw error
      }
    },
    
    // 设置搜索参数
    setSearchParams(params) {
      this.searchParams = { ...this.searchParams, ...params }
      this.currentPage = 1
    },
    
    // 设置分页
    setPagination(page, pageSize) {
      this.currentPage = page
      this.pageSize = pageSize
    },
    
    // 重置状态
    reset() {
      this.salesDataList = []
      this.loading = false
      this.total = 0
      this.currentPage = 1
      this.pageSize = 50
      this.searchParams = {
        search: '',
        brandId: '',
        cycleType: '',
        startDate: '',
        endDate: ''
      }
      this.statistics = {
        totalOrderAmount: 0,
        totalLeads: 0,
        totalOrders: 0,
        averageOrderAmount: 0
      }
    }
  }
})
