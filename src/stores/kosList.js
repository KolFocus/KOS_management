import { defineStore } from 'pinia'
import { KosListAPI } from '@/api/kosList'
import { STATUS } from '@/utils/supabase'

export const useKosListStore = defineStore('kosList', {
  state: () => ({
    kosList: [],
    loading: false,
    total: 0,
    currentPage: 1,
    pageSize: 20,
    searchParams: {
      search: '',
      channel: '',
      status: ''
    }
  }),
  
  getters: {
    // 获取上线状态的KOS数量
    onlineCount: (state) => state.kosList.filter(kos => kos.参与统计 === STATUS.ONLINE).length,
    
    // 获取下线状态的KOS数量
    offlineCount: (state) => state.kosList.filter(kos => kos.参与统计 === STATUS.OFFLINE).length,
    
    // 获取渠道列表
    channelList: (state) => {
      const channels = [...new Set(state.kosList.map(kos => kos.渠道).filter(Boolean))]
      return channels
    }
  },
  
  actions: {
    // 获取KOS列表
    async fetchKosList(params = {}) {
      this.loading = true
      try {
        const queryParams = {
          page: this.currentPage,
          pageSize: this.pageSize,
          ...this.searchParams,
          ...params
        }
        
        const result = await KosListAPI.getKosList(queryParams)
        // 确保数据按排序字段从小到大排序，空值排在最后
        this.kosList = (result.data || []).sort((a, b) => {
          const sortA = a.排序 === null || a.排序 === undefined || a.排序 === '' ? null : parseInt(a.排序)
          const sortB = b.排序 === null || b.排序 === undefined || b.排序 === '' ? null : parseInt(b.排序)
          
          // 如果两个都是空值，按品牌ID排序
          if (sortA === null && sortB === null) {
            return (a.品牌ID || '').localeCompare(b.品牌ID || '')
          }
          
          // 如果只有A是空值，A排在后面
          if (sortA === null) {
            return 1
          }
          
          // 如果只有B是空值，B排在后面
          if (sortB === null) {
            return -1
          }
          
          // 两个都不是空值，按数值排序
          if (sortA !== sortB) {
            return sortA - sortB
          }
          
          // 如果排序相同，按品牌ID排序
          return (a.品牌ID || '').localeCompare(b.品牌ID || '')
        })
        this.total = result.total
        this.currentPage = result.page
        
        return result
      } catch (error) {
        console.error('获取KOS列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    // 创建KOS
    async createKos(kosData) {
      try {
        const newKos = await KosListAPI.createKos(kosData)
        // 重新获取数据以确保列表更新
        await this.fetchKosList()
        return newKos
      } catch (error) {
        console.error('创建KOS失败:', error)
        throw error
      }
    },
    
    // 更新KOS
    async updateKos(brandId, userId, updateData) {
      try {
        const updatedKos = await KosListAPI.updateKos(brandId, userId, updateData)
        // 重新获取数据以确保列表更新
        await this.fetchKosList()
        return updatedKos
      } catch (error) {
        console.error('更新KOS失败:', error)
        throw error
      }
    },
    
    // 删除KOS
    async deleteKos(brandId, userId) {
      try {
        await KosListAPI.deleteKos(brandId, userId)
        // 重新获取数据以确保列表更新
        await this.fetchKosList()
      } catch (error) {
        console.error('删除KOS失败:', error)
        throw error
      }
    },
    
    // 批量更新状态
    async batchUpdateStatus(kosList, status) {
      try {
        await KosListAPI.batchUpdateStatus(kosList, status)
        // 重新获取数据以确保列表更新
        await this.fetchKosList()
      } catch (error) {
        console.error('批量更新状态失败:', error)
        throw error
      }
    },
    
    // 批量删除KOS
    async batchDeleteKos(kosList) {
      try {
        await KosListAPI.batchDeleteKos(kosList)
        // 重新获取数据以确保列表更新
        await this.fetchKosList()
      } catch (error) {
        console.error('批量删除失败:', error)
        throw error
      }
    },
    
    // 批量导入KOS
    async batchImportKos(kosList) {
      try {
        const result = await KosListAPI.batchImportKos(kosList)
        // 重新获取数据以确保列表更新
        await this.fetchKosList()
        return result
      } catch (error) {
        console.error('批量导入KOS失败:', error)
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
      this.kosList = []
      this.loading = false
      this.total = 0
      this.currentPage = 1
      this.pageSize = 20
      this.searchParams = {
        search: '',
        channel: '',
        status: ''
      }
    }
  }
})
