import { create } from 'zustand'
import { brandManagementAPI } from '../api/brandManagement'

export const useBrandManagementStore = create((set, get) => ({
  // State
  brands: [],
  platforms: [],
  loading: false,
  selectedBrandId: '',
  brandDialogVisible: false,
  platformDialogVisible: false,
  currentBrand: null,
  currentPlatform: null,

  // Getters
  getBrandOptions: () => {
    const { brands } = get()
    return brands.map(brand => ({
      label: brand.品牌,
      value: brand.ID
    }))
  },

  // 当前选择品牌操作
  setSelectedBrandId: (brandId) => set({ selectedBrandId: brandId || '' }),

  getPlatformsByBrand: () => {
    const { platforms } = get()
    const grouped = {}
    platforms.forEach(platform => {
      if (!grouped[platform.品牌]) {
        grouped[platform.品牌] = []
      }
      grouped[platform.品牌].push(platform)
    })
    return grouped
  },

  // Actions
  loadBrands: async () => {
    set({ loading: true })
    
    try {
      const { data, error } = await brandManagementAPI.getBrands()
      if (error) throw error
      
      // 品牌列表排序，空值排在最后
      const sortedBrands = (data || []).sort((a, b) => {
        const sortA = a.排序 === null || a.排序 === undefined || a.排序 === '' ? null : parseInt(a.排序)
        const sortB = b.排序 === null || b.排序 === undefined || b.排序 === '' ? null : parseInt(b.排序)
        
        // 如果两个都是空值，按品牌名称排序
        if (sortA === null && sortB === null) {
          return (a.品牌 || '').localeCompare(b.品牌 || '')
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
        return sortA - sortB
      })
      
      set({ brands: sortedBrands, loading: false })
    } catch (error) {
      console.error('加载品牌列表失败:', error)
      set({ loading: false })
      throw error
    }
  },

  loadPlatforms: async () => {
    set({ loading: true })
    
    try {
      const { data, error } = await brandManagementAPI.getPlatforms()
      if (error) throw error
      set({ platforms: data || [], loading: false })
    } catch (error) {
      console.error('加载平台列表失败:', error)
      set({ loading: false })
      throw error
    }
  },

  addBrand: async (brandData) => {
    try {
      // 如果没有设置排序，自动设置为最大值+1
      if (brandData.排序 === undefined || brandData.排序 === null) {
        const { brands } = get()
        const maxSort = Math.max(...brands.map(b => b.排序 || 0), 0)
        brandData.排序 = maxSort + 1
      }
      
      const { data, error } = await brandManagementAPI.addBrand(brandData)
      if (error) throw error
      
      const newBrand = data[0]
      set(state => {
        const newBrands = [...state.brands, newBrand]
        // 重新排序，空值排在最后
        newBrands.sort((a, b) => {
          const sortA = a.排序 === null || a.排序 === undefined || a.排序 === '' ? null : parseInt(a.排序)
          const sortB = b.排序 === null || b.排序 === undefined || b.排序 === '' ? null : parseInt(b.排序)
          
          if (sortA === null && sortB === null) {
            return (a.品牌 || '').localeCompare(b.品牌 || '')
          }
          if (sortA === null) return 1
          if (sortB === null) return -1
          return sortA - sortB
        })
        
        return { brands: newBrands }
      })
      
      return true
    } catch (error) {
      console.error('添加品牌失败:', error)
      throw error
    }
  },

  updateBrand: async (id, brandData) => {
    try {
      const { data, error } = await brandManagementAPI.updateBrand(id, brandData)
      if (error) throw error
      
      set(state => {
        const index = state.brands.findIndex(brand => brand.ID === id)
        if (index !== -1) {
          const newBrands = [...state.brands]
          newBrands[index] = data[0]
          
          // 重新排序，空值排在最后
          newBrands.sort((a, b) => {
            const sortA = a.排序 === null || a.排序 === undefined || a.排序 === '' ? null : parseInt(a.排序)
            const sortB = b.排序 === null || b.排序 === undefined || b.排序 === '' ? null : parseInt(b.排序)
            
            if (sortA === null && sortB === null) {
              return (a.品牌 || '').localeCompare(b.品牌 || '')
            }
            if (sortA === null) return 1
            if (sortB === null) return -1
            return sortA - sortB
          })
          
          return { brands: newBrands }
        }
        return state
      })
      
      return true
    } catch (error) {
      console.error('更新品牌失败:', error)
      throw error
    }
  },

  deleteBrand: async (id) => {
    try {
      const { data, error } = await brandManagementAPI.deleteBrand(id)
      if (error) throw error
      
      set(state => ({
        brands: state.brands.filter(brand => brand.ID !== id)
      }))
      
      return true
    } catch (error) {
      console.error('删除品牌失败:', error)
      throw error
    }
  },

  addPlatform: async (platformData) => {
    try {
      const { data, error } = await brandManagementAPI.addPlatform(platformData)
      if (error) throw error
      
      set(state => ({
        platforms: [...state.platforms, data[0]]
      }))
      
      return true
    } catch (error) {
      console.error('添加平台失败:', error)
      throw error
    }
  },

  updatePlatform: async (brandId, platformType, platformId, platformData) => {
    try {
      const { data, error } = await brandManagementAPI.updatePlatform(
        brandId, platformType, platformId, platformData
      )
      if (error) throw error
      
      set(state => {
        const index = state.platforms.findIndex(platform => 
          platform.品牌ID === brandId && 
          platform.平台类型 === platformType && 
          platform.平台ID === platformId
        )
        
        if (index !== -1) {
          const newPlatforms = [...state.platforms]
          newPlatforms[index] = data[0]
          return { platforms: newPlatforms }
        }
        
        return state
      })
      
      return true
    } catch (error) {
      console.error('更新平台失败:', error)
      throw error
    }
  },

  deletePlatform: async (brandId, platformType, platformId) => {
    try {
      const { data, error } = await brandManagementAPI.deletePlatform(
        brandId, platformType, platformId
      )
      if (error) throw error
      
      set(state => ({
        platforms: state.platforms.filter(platform => 
          !(platform.品牌ID === brandId && 
            platform.平台类型 === platformType && 
            platform.平台ID === platformId)
        )
      }))
      
      return true
    } catch (error) {
      console.error('删除平台失败:', error)
      throw error
    }
  },

  canDeleteBrand: async (brandId) => {
    try {
      const { hasPlatforms, error } = await brandManagementAPI.checkBrandHasPlatforms(brandId)
      if (error) throw error
      return !hasPlatforms
    } catch (error) {
      console.error('检查品牌删除权限失败:', error)
      return false
    }
  },

  showBrandDialog: (brand = null) => {
    set({ currentBrand: brand, brandDialogVisible: true })
  },

  hideBrandDialog: () => {
    set({ brandDialogVisible: false, currentBrand: null })
  },

  showPlatformDialog: (platform = null) => {
    set({ currentPlatform: platform, platformDialogVisible: true })
  },

  hidePlatformDialog: () => {
    set({ platformDialogVisible: false, currentPlatform: null })
  }
}))
