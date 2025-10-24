<template>
  <div class="brand-management">
    <!-- 品牌列表 -->
    <div class="brand-section">
      <div class="section-header">
        <h3>品牌（按排序字段从小到大排序，空值排在最后）</h3>
        <el-button type="primary" @click="showAddBrandDialog">
          <el-icon><Plus /></el-icon>
          添加品牌
        </el-button>
      </div>
      
      <el-table 
        :data="brandStore.brands" 
        v-loading="brandStore.loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="排序" label="排序" width="80" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.排序 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="品牌" label="品牌名称" width="200" />
        <el-table-column prop="创建时间" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.创建时间) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="editBrand(row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteBrand(row)"
              :disabled="!canDeleteBrand(row.ID)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 用户平台关联表 -->
    <div class="platform-section">
      <div class="section-header">
        <h3>平台</h3>
        <el-button type="primary" @click="showAddPlatformDialog">
          <el-icon><Plus /></el-icon>
          添加平台
        </el-button>
      </div>
      
      <el-table 
        :data="brandStore.platforms" 
        v-loading="brandStore.loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="品牌" label="品牌" width="150" />
        <el-table-column prop="品牌ID" label="品牌ID" width="120" />
        <el-table-column prop="平台" label="平台" width="150" />
        <el-table-column prop="平台类型" label="平台类型" width="150">
          <template #default="{ row }">
            <el-link 
              v-if="getPlatformTypeUrl(row.平台类型)" 
              :href="getPlatformTypeUrl(row.平台类型)" 
              target="_blank"
              type="primary"
            >
              {{ getPlatformTypeIcon(row.平台类型) }} {{ row.平台类型 }}
            </el-link>
            <span v-else>
              {{ getPlatformTypeIcon(row.平台类型) }} {{ row.平台类型 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="平台ID" label="平台ID" width="120" />
        <el-table-column prop="创建时间" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.创建时间) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="editPlatform(row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deletePlatform(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 品牌编辑对话框 -->
    <el-dialog
      v-model="brandStore.brandDialogVisible"
      :title="brandStore.currentBrand ? '编辑品牌' : '添加品牌'"
      width="500px"
    >
      <el-form
        ref="brandFormRef"
        :model="brandForm"
        :rules="brandRules"
        label-width="80px"
      >
        <el-form-item label="品牌名称" prop="品牌">
          <el-input v-model="brandForm.品牌" placeholder="请输入品牌名称" />
        </el-form-item>
        <el-form-item label="排序" prop="排序">
          <el-input-number 
            v-model="brandForm.排序" 
            :min="0" 
            :max="999"
            placeholder="数字越小排序越靠前"
          />
          <div class="form-tip">数字越小排序越靠前</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="brandStore.hideBrandDialog()">取消</el-button>
        <el-button type="primary" @click="saveBrand">确定</el-button>
      </template>
    </el-dialog>

    <!-- 平台编辑对话框 -->
    <el-dialog
      v-model="brandStore.platformDialogVisible"
      :title="brandStore.currentPlatform ? '编辑平台' : '添加平台'"
      width="600px"
    >
      <el-form
        ref="platformFormRef"
        :model="platformForm"
        :rules="platformRules"
        label-width="80px"
      >
        <el-form-item label="品牌" prop="品牌">
          <el-select v-model="platformForm.品牌" placeholder="请选择品牌" @change="onBrandChange">
            <el-option
              v-for="brand in brandStore.brands"
              :key="brand.ID"
              :label="brand.品牌"
              :value="brand.品牌"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="品牌ID" prop="品牌ID">
          <el-input v-model="platformForm.品牌ID" placeholder="请输入品牌ID" />
        </el-form-item>
        <el-form-item label="平台" prop="平台">
          <el-input v-model="platformForm.平台" placeholder="请输入平台名称" />
        </el-form-item>
        <el-form-item label="平台类型" prop="平台类型">
          <el-select v-model="platformForm.平台类型" placeholder="请选择平台类型">
            <el-option 
              v-for="type in platformTypes" 
              :key="type" 
              :label="getPlatformTypeLabel(type)" 
              :value="type"
            >
              <span>{{ getPlatformTypeIcon(type) }} {{ getPlatformTypeLabel(type) }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="平台ID" prop="平台ID">
          <el-input v-model="platformForm.平台ID" placeholder="请输入平台ID" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="brandStore.hidePlatformDialog()">取消</el-button>
        <el-button type="primary" @click="savePlatform">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useBrandManagementStore } from '../stores/brandManagement.js'
import { platformTypeConfig } from '../utils/platformTypes.js'
import { ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const brandStore = useBrandManagementStore()

// 表单引用
const brandFormRef = ref()
const platformFormRef = ref()

// 平台类型选项 - 只使用配置的平台类型
const platformTypes = computed(() => {
  return platformTypeConfig.getAllTypes().map(type => type.value)
})

// 品牌表单
const brandForm = reactive({
  品牌: '',
  排序: 0
})

// 平台表单
const platformForm = reactive({
  品牌: '',
  品牌ID: '',
  平台: '',
  平台类型: '',
  平台ID: ''
})

// 品牌表单验证规则
const brandRules = {
  品牌: [
    { required: true, message: '请输入品牌名称', trigger: 'blur' }
  ],
  排序: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
}

// 平台表单验证规则
const platformRules = {
  品牌: [
    { required: true, message: '请选择品牌', trigger: 'change' }
  ],
  品牌ID: [
    { required: true, message: '请输入品牌ID', trigger: 'blur' }
  ],
  平台: [
    { required: true, message: '请输入平台名称', trigger: 'blur' }
  ],
  平台类型: [
    { required: true, message: '请选择平台类型', trigger: 'change' }
  ],
  平台ID: [
    { required: true, message: '请输入平台ID', trigger: 'blur' }
  ]
}

// 计算属性：检查品牌是否可以删除
const canDeleteBrand = computed(() => {
  return (brandId) => {
    // 检查是否有平台关联
    const hasPlatforms = brandStore.platforms.some(platform => platform.品牌ID === brandId)
    return !hasPlatforms
  }
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

// 显示添加品牌对话框
const showAddBrandDialog = () => {
  resetBrandForm()
  brandStore.showBrandDialog()
}

// 编辑品牌
const editBrand = (brand) => {
  Object.assign(brandForm, brand)
  brandStore.showBrandDialog(brand)
}

// 删除品牌
const deleteBrand = async (brand) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除品牌"${brand.品牌}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await brandStore.deleteBrand(brand.ID)
  } catch (error) {
    // 用户取消删除
  }
}

// 保存品牌
const saveBrand = async () => {
  try {
    await brandFormRef.value.validate()
    
    const success = brandStore.currentBrand
      ? await brandStore.updateBrand(brandStore.currentBrand.ID, brandForm)
      : await brandStore.addBrand(brandForm)
    
    if (success) {
      // 调试输出
      console.log('品牌保存成功，当前列表:', brandStore.brands)
      console.log('品牌排序:', brandStore.brands.map(b => ({ 品牌: b.品牌, 排序: b.排序 })))
      
      brandStore.hideBrandDialog()
      resetBrandForm()
    }
  } catch (error) {
    console.error('保存品牌失败:', error)
  }
}

// 重置品牌表单
const resetBrandForm = () => {
  // 计算下一个排序值
  const maxSort = Math.max(...brandStore.brands.map(b => b.排序 || 0), 0)
  
  Object.assign(brandForm, {
    品牌: '',
    排序: maxSort + 1
  })
}

// 显示添加平台对话框
const showAddPlatformDialog = () => {
  resetPlatformForm()
  brandStore.showPlatformDialog()
}

// 编辑平台
const editPlatform = (platform) => {
  Object.assign(platformForm, platform)
  brandStore.showPlatformDialog(platform)
}

// 删除平台
const deletePlatform = async (platform) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除平台"${platform.平台}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await brandStore.deletePlatform(
      platform.品牌ID,
      platform.平台类型,
      platform.平台ID
    )
  } catch (error) {
    // 用户取消删除
  }
}

// 保存平台
const savePlatform = async () => {
  try {
    await platformFormRef.value.validate()
    
    const success = brandStore.currentPlatform
      ? await brandStore.updatePlatform(
          brandStore.currentPlatform.品牌ID,
          brandStore.currentPlatform.平台类型,
          brandStore.currentPlatform.平台ID,
          platformForm
        )
      : await brandStore.addPlatform(platformForm)
    
    if (success) {
      brandStore.hidePlatformDialog()
      resetPlatformForm()
    }
  } catch (error) {
    console.error('保存平台失败:', error)
  }
}

// 重置平台表单
const resetPlatformForm = () => {
  Object.assign(platformForm, {
    品牌: '',
    品牌ID: '',
    平台: '',
    平台类型: '',
    平台ID: ''
  })
}

// 品牌选择变化
const onBrandChange = (brandName) => {
  const brand = brandStore.brands.find(b => b.品牌 === brandName)
  if (brand) {
    platformForm.品牌ID = brand.ID
  }
}

// 获取平台类型标签
const getPlatformTypeLabel = (type) => {
  const typeInfo = platformTypeConfig.getTypeByValue(type)
  return typeInfo ? typeInfo.label : type
}

// 获取平台类型图标
const getPlatformTypeIcon = (type) => {
  const typeInfo = platformTypeConfig.getTypeByValue(type)
  return typeInfo ? typeInfo.icon : '📋'
}

// 获取平台类型URL
const getPlatformTypeUrl = (type) => {
  return platformTypeConfig.getTypeUrl(type)
}

// 获取平台类型描述
const getPlatformTypeDescription = (type) => {
  return platformTypeConfig.getTypeDescription(type)
}

// 组件挂载时加载数据
onMounted(async () => {
  await brandStore.loadBrands()
  await brandStore.loadPlatforms()
  
  // 调试输出
  console.log('品牌列表加载完成:', brandStore.brands)
  console.log('品牌排序:', brandStore.brands.map(b => ({ 品牌: b.品牌, 排序: b.排序 })))
})
</script>

<style scoped>
.brand-management {
  padding: 20px;
}

.brand-section,
.platform-section {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-dialog .el-form {
  padding: 0 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
