import { create } from 'zustand'
import { KosListAPI } from '../api/kosList'
import { STATUS } from '../utils/supabase'

export const useKosListStore = create((set, get) => ({
  // State
  kosList: [],
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  searchParams: {
    search: '',
    channel: '',
    status: ''
  },

  // Getters
  getOnlineCount: () => {
    const { kosList } = get()
    return kosList.filter(kos => kos.参与统计 === STATUS.ONLINE).length
  },
  
  getOfflineCount: () => {
    const { kosList } = get()
    return kosList.filter(kos => kos.参与统计 === STATUS.OFFLINE).length
  },
  
  getChannelList: () => {
    const { kosList } = get()
    const channels = [...new Set(kosList.map(kos => kos.渠道).filter(Boolean))]
    return channels
  },

  // Actions
  fetchKosList: async (params = {}) => {
    const { currentPage, pageSize, searchParams } = get()
    set({ loading: true })
    
    try {
      const queryParams = {
        page: currentPage,
        pageSize: pageSize,
        ...searchParams,
        ...params
      }
      
      const result = await KosListAPI.getKosList(queryParams)
      
      // 确保数据按排序字段从小到大排序，空值排在最后
      const sortedData = (result.data || []).sort((a, b) => {
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
      
      set({
        kosList: sortedData,
        total: result.total,
        currentPage: result.page,
        loading: false
      })
      
      return result
    } catch (error) {
      console.error('获取KOS列表失败:', error)
      set({ loading: false })
      throw error
    }
  },
  
  createKos: async (kosData) => {
    try {
      const newKos = await KosListAPI.createKos(kosData)
      // 重新获取数据以确保列表更新
      await get().fetchKosList()
      return newKos
    } catch (error) {
      console.error('创建KOS失败:', error)
      throw error
    }
  },
  
  updateKos: async (brandId, userId, updateData) => {
    try {
      const updatedKos = await KosListAPI.updateKos(brandId, userId, updateData)
      // 重新获取数据以确保列表更新
      await get().fetchKosList()
      return updatedKos
    } catch (error) {
      console.error('更新KOS失败:', error)
      throw error
    }
  },
  
  deleteKos: async (brandId, userId) => {
    try {
      await KosListAPI.deleteKos(brandId, userId)
      // 重新获取数据以确保列表更新
      await get().fetchKosList()
    } catch (error) {
      console.error('删除KOS失败:', error)
      throw error
    }
  },
  
  batchUpdateStatus: async (kosList, status) => {
    try {
      await KosListAPI.batchUpdateStatus(kosList, status)
      // 重新获取数据以确保列表更新
      await get().fetchKosList()
    } catch (error) {
      console.error('批量更新状态失败:', error)
      throw error
    }
  },
  
  batchDeleteKos: async (kosList) => {
    try {
      await KosListAPI.batchDeleteKos(kosList)
      // 重新获取数据以确保列表更新
      await get().fetchKosList()
    } catch (error) {
      console.error('批量删除失败:', error)
      throw error
    }
  },
  
  batchImportKos: async (kosList) => {
    try {
      const result = await KosListAPI.batchImportKos(kosList)
      // 重新获取数据以确保列表更新
      await get().fetchKosList()
      return result
    } catch (error) {
      console.error('批量导入KOS失败:', error)
      throw error
    }
  },
  
  setSearchParams: (params) => {
    set(state => ({
      searchParams: { ...state.searchParams, ...params },
      currentPage: 1
    }))
  },
  
  setPagination: (page, pageSize) => {
    set({ currentPage: page, pageSize: pageSize })
  },
  
  reset: () => {
    set({
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
    })
  }
}))
