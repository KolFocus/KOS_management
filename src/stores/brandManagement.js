import { defineStore } from 'pinia'
import { brandManagementAPI } from '../api/brandManagement.js'
import { ElMessage } from 'element-plus'

export const useBrandManagementStore = defineStore('brandManagement', {
  state: () => ({
    brands: [],
    platforms: [],
    loading: false,
    brandDialogVisible: false,
    platformDialogVisible: false,
    currentBrand: null,
    currentPlatform: null
  }),

  getters: {
    // 获取品牌选项（用于下拉选择）
    brandOptions: (state) => {
      return state.brands.map(brand => ({
        label: brand.品牌,
        value: brand.ID
      }))
    },

    // 按品牌分组的平台数据
    platformsByBrand: (state) => {
      const grouped = {}
      state.platforms.forEach(platform => {
        if (!grouped[platform.品牌]) {
          grouped[platform.品牌] = []
        }
        grouped[platform.品牌].push(platform)
      })
      return grouped
    }
  },

  actions: {
    // 加载品牌列表
    async loadBrands() {
      this.loading = true
      try {
        const { data, error } = await brandManagementAPI.getBrands()
        if (error) throw error
        // 品牌列表排序，空值排在最后
        this.brands = (data || []).sort((a, b) => {
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
      } catch (error) {
        ElMessage.error('加载品牌列表失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    // 加载平台列表
    async loadPlatforms() {
      this.loading = true
      try {
        const { data, error } = await brandManagementAPI.getPlatforms()
        if (error) throw error
        this.platforms = data || []
      } catch (error) {
        ElMessage.error('加载平台列表失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    // 添加品牌
    async addBrand(brandData) {
      try {
        // 如果没有设置排序，自动设置为最大值+1
        if (brandData.排序 === undefined || brandData.排序 === null) {
          const maxSort = Math.max(...this.brands.map(b => b.排序 || 0), 0)
          brandData.排序 = maxSort + 1
        }
        
        const { data, error } = await brandManagementAPI.addBrand(brandData)
        if (error) throw error
        
        // 将新品牌插入到正确位置而不是直接push
        const newBrand = data[0]
        this.brands.push(newBrand)
        // 重新排序，空值排在最后
        this.brands.sort((a, b) => {
          const sortA = a.排序 === null || a.排序 === undefined || a.排序 === '' ? null : parseInt(a.排序)
          const sortB = b.排序 === null || b.排序 === undefined || b.排序 === '' ? null : parseInt(b.排序)
          
          if (sortA === null && sortB === null) {
            return (a.品牌 || '').localeCompare(b.品牌 || '')
          }
          if (sortA === null) return 1
          if (sortB === null) return -1
          return sortA - sortB
        })
        
        // 强制Vue响应式更新
        this.brands = [...this.brands]
        
        ElMessage.success('品牌添加成功')
        return true
      } catch (error) {
        ElMessage.error('添加品牌失败: ' + error.message)
        return false
      }
    },

    // 更新品牌
    async updateBrand(id, brandData) {
      try {
        console.log('更新品牌前:', this.brands.map(b => ({ 品牌: b.品牌, 排序: b.排序 })))
        
        const { data, error } = await brandManagementAPI.updateBrand(id, brandData)
        if (error) throw error
        
        const index = this.brands.findIndex(brand => brand.ID === id)
        if (index !== -1) {
          this.brands[index] = data[0]
        }
        
        // 重新排序，空值排在最后
        this.brands.sort((a, b) => {
          const sortA = a.排序 === null || a.排序 === undefined || a.排序 === '' ? null : parseInt(a.排序)
          const sortB = b.排序 === null || b.排序 === undefined || b.排序 === '' ? null : parseInt(b.排序)
          
          if (sortA === null && sortB === null) {
            return (a.品牌 || '').localeCompare(b.品牌 || '')
          }
          if (sortA === null) return 1
          if (sortB === null) return -1
          return sortA - sortB
        })
        
        // 强制Vue响应式更新
        this.brands = [...this.brands]
        
        console.log('更新品牌后:', this.brands.map(b => ({ 品牌: b.品牌, 排序: b.排序 })))
        
        ElMessage.success('品牌更新成功')
        return true
      } catch (error) {
        ElMessage.error('更新品牌失败: ' + error.message)
        return false
      }
    },

    // 删除品牌
    async deleteBrand(id) {
      try {
        const { data, error } = await brandManagementAPI.deleteBrand(id)
        if (error) throw error
        
        this.brands = this.brands.filter(brand => brand.ID !== id)
        ElMessage.success('品牌删除成功')
        return true
      } catch (error) {
        ElMessage.error('删除品牌失败: ' + error.message)
        return false
      }
    },

    // 添加平台
    async addPlatform(platformData) {
      try {
        const { data, error } = await brandManagementAPI.addPlatform(platformData)
        if (error) throw error
        
        this.platforms.push(data[0])
        ElMessage.success('平台添加成功')
        return true
      } catch (error) {
        ElMessage.error('添加平台失败: ' + error.message)
        return false
      }
    },

    // 更新平台
    async updatePlatform(brandId, platformType, platformId, platformData) {
      try {
        const { data, error } = await brandManagementAPI.updatePlatform(
          brandId, platformType, platformId, platformData
        )
        if (error) throw error
        
        const index = this.platforms.findIndex(platform => 
          platform.品牌ID === brandId && 
          platform.平台类型 === platformType && 
          platform.平台ID === platformId
        )
        if (index !== -1) {
          this.platforms[index] = data[0]
        }
        ElMessage.success('平台更新成功')
        return true
      } catch (error) {
        ElMessage.error('更新平台失败: ' + error.message)
        return false
      }
    },

    // 删除平台
    async deletePlatform(brandId, platformType, platformId) {
      try {
        const { data, error } = await brandManagementAPI.deletePlatform(
          brandId, platformType, platformId
        )
        if (error) throw error
        
        this.platforms = this.platforms.filter(platform => 
          !(platform.品牌ID === brandId && 
            platform.平台类型 === platformType && 
            platform.平台ID === platformId)
        )
        ElMessage.success('平台删除成功')
        return true
      } catch (error) {
        ElMessage.error('删除平台失败: ' + error.message)
        return false
      }
    },

    // 检查品牌是否可以删除
    async canDeleteBrand(brandId) {
      try {
        const { hasPlatforms, error } = await brandManagementAPI.checkBrandHasPlatforms(brandId)
        if (error) throw error
        return !hasPlatforms
      } catch (error) {
        console.error('检查品牌删除权限失败:', error)
        return false
      }
    },

    // 显示品牌对话框
    showBrandDialog(brand = null) {
      this.currentBrand = brand
      this.brandDialogVisible = true
    },

    // 隐藏品牌对话框
    hideBrandDialog() {
      this.brandDialogVisible = false
      this.currentBrand = null
    },

    // 显示平台对话框
    showPlatformDialog(platform = null) {
      this.currentPlatform = platform
      this.platformDialogVisible = true
    },

    // 隐藏平台对话框
    hidePlatformDialog() {
      this.platformDialogVisible = false
      this.currentPlatform = null
    }
  }
})
