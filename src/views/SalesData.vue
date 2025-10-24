<template>
  <div class="sales-data-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>KOS销售数据管理</h1>
        <p>管理品牌离线导入的KOS销售数据</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增销售数据
        </el-button>
        <el-button type="success" @click="showImportDialog = true">
          <el-icon><Upload /></el-icon>
          Excel导入
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card>
        <el-form :model="searchForm" class="search-form">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
              <el-form-item label="搜索">
                <el-input
                  v-model="searchForm.search"
                  placeholder="品牌、员工姓名或店铺编号"
                  clearable
                  class="search-input"
                  @keyup.enter="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
              <el-form-item label="品牌">
                <el-select 
                  v-model="searchForm.brandId" 
                  placeholder="选择品牌" 
                  clearable
                  class="filter-select"
                >
                  <el-option
                    v-for="brand in brandOptions"
                    :key="brand.value"
                    :label="brand.label"
                    :value="brand.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
              <el-form-item label="周期类型">
                <el-select 
                  v-model="searchForm.cycleType" 
                  placeholder="选择周期类型" 
                  clearable
                  class="filter-select"
                >
                  <el-option label="日" value="BY_DAY" />
                  <el-option label="周" value="BY_WEEK" />
                  <el-option label="月" value="BY_MONTH" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
              <el-form-item label="日期范围">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  class="date-picker"
                  @change="handleDateRangeChange"
                />
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="4">
              <el-form-item class="search-buttons">
                <el-button type="primary" @click="handleSearch" class="search-btn">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="handleReset" class="reset-btn">
                  <el-icon><Refresh /></el-icon>
                  重置
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon amount">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ formatMoney(statistics.totalOrderAmount) }}</div>
                <div class="stats-label">总成单金额</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon leads">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ statistics.totalLeads }}</div>
                <div class="stats-label">总留资数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon orders">
                <el-icon><ShoppingCart /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ statistics.totalOrders }}</div>
                <div class="stats-label">总成单数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon average">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ formatMoney(statistics.averageOrderAmount) }}</div>
                <div class="stats-label">平均成单金额</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-card>
        <div class="table-header">
          <div class="table-title">销售数据列表</div>
          <div class="table-actions">
            <el-button 
              type="danger" 
              :disabled="selectedRows.length === 0"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>
        
        <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="salesDataList"
          @selection-change="handleSelectionChange"
          stripe
          border
        >
          <el-table-column type="selection" min-width="55" />
          
          <el-table-column prop="品牌" label="品牌" min-width="120" />
          <el-table-column prop="周期类型" label="周期类型" min-width="100">
            <template #default="{ row }">
              <span>{{ getCycleTypeLabel(row.周期类型) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="日期" label="日期" min-width="120" sortable />
          <el-table-column prop="员工姓名" label="员工姓名" min-width="120" />
          <el-table-column prop="店铺编号" label="店铺编号" min-width="120" />
          
          <el-table-column prop="小红书成单" label="小红书成单" min-width="140">
            <template #default="{ row }">
              <span class="money-text">¥{{ formatMoney(row.小红书成单) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="本期累计成单" label="本期累计成单" min-width="140">
            <template #default="{ row }">
              <span class="money-text">¥{{ formatMoney(row.本期累计成单) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="企微留资数" label="企微留资数" min-width="120">
            <template #default="{ row }">
              <span class="money-text">¥{{ formatMoney(row.企微留资数) }}</span>
            </template>
          </el-table-column>
          
          
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-tooltip content="编辑" placement="top">
                  <el-button 
                    type="primary" 
                    size="small" 
                    circle
                    @click="handleEdit(row)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                </el-tooltip>
                
                <el-tooltip content="删除" placement="top">
                  <el-button 
                    type="danger" 
                    size="small" 
                    circle
                    @click="handleDelete(row)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
        </div>
        
        <!-- 分页 -->
        <div class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[20, 50, 100, 200]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- Excel导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="Excel导入"
      width="800px"
      @close="handleImportDialogClose"
    >
      <div class="import-content">
        <el-steps :active="importStep" finish-status="success">
          <el-step title="选择文件" />
          <el-step title="选择品牌和日期" />
          <el-step title="数据预览" />
          <el-step title="导入完成" />
        </el-steps>
        
        <div class="step-content">
          <!-- 步骤1: 选择文件 -->
          <div v-if="importStep === 0" class="step-1">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :on-change="handleFileChange"
              :before-upload="beforeUpload"
              accept=".xlsx,.xls"
              drag
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传xlsx/xls文件，且不超过10MB
                </div>
              </template>
            </el-upload>
            
            <div class="template-download">
              <el-button type="text" @click="downloadTemplate">
                <el-icon><Download /></el-icon>
                下载导入模板
              </el-button>
            </div>
          </div>
          
          <!-- 步骤2: 选择品牌和日期 -->
          <div v-if="importStep === 1" class="step-2">
            <div class="brand-date-selection">
              <h4>选择品牌和日期</h4>
              <p>为批量导入的销售数据选择统一的品牌和日期信息</p>
              
              <el-form :model="importBrandDateForm" label-width="120px">
                <el-form-item label="品牌" required>
                  <el-select 
                    v-model="importBrandDateForm.品牌" 
                    placeholder="请选择品牌" 
                    @change="onImportBrandChange"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="brand in brandOptions"
                      :key="brand.value"
                      :label="brand.label"
                      :value="brand.value"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="品牌ID" required>
                  <el-input 
                    v-model="importBrandDateForm.品牌ID" 
                    placeholder="品牌ID将自动填充"
                    readonly
                  />
                </el-form-item>
                
                <el-form-item label="周期类型" required>
                  <el-select 
                    v-model="importBrandDateForm.周期类型" 
                    placeholder="请选择周期类型"
                    style="width: 100%"
                    @change="onCycleTypeChange"
                  >
                    <el-option label="日" value="BY_DAY" />
                    <el-option label="周" value="BY_WEEK" />
                    <el-option label="月" value="BY_MONTH" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="日期" required>
                  <el-date-picker
                    v-model="importBrandDateForm.日期"
                    type="date"
                    placeholder="选择日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                    @change="onDateChange"
                  />
                  <div class="form-tip">
                    <span v-if="importBrandDateForm.周期类型 === 'BY_DAY'">日类型：使用选择的日期</span>
                    <span v-else-if="importBrandDateForm.周期类型 === 'BY_WEEK'">周类型：自动取这一周的开始第一天（周一）</span>
                    <span v-else-if="importBrandDateForm.周期类型 === 'BY_MONTH'">月类型：自动取这一月的开始第一天</span>
                  </div>
                </el-form-item>
                
              </el-form>
              
              <div class="step-actions">
                <el-button @click="importStep = 0">上一步</el-button>
                <el-button 
                  type="primary" 
                  @click="proceedToPreview"
                  :disabled="!importBrandDateForm.品牌 || !importBrandDateForm.品牌ID || !importBrandDateForm.周期类型 || !importBrandDateForm.日期"
                >
                  下一步
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 步骤3: 数据预览 -->
          <div v-if="importStep === 2" class="step-3">
            <div class="preview-header">
              <h4>数据预览 (共{{ previewData.length }}条记录)</h4>
              <el-button type="primary" @click="handleImport" :loading="importing">
                <el-icon><Upload /></el-icon>
                确认导入
              </el-button>
            </div>
            
            <el-table :data="previewData.slice(0, 10)" border max-height="400">
              <el-table-column prop="品牌" label="品牌" width="100" />
              <el-table-column prop="周期类型" label="周期类型" width="100" />
              <el-table-column prop="日期" label="日期" width="120" />
              <el-table-column prop="员工姓名" label="员工姓名" width="120" />
              <el-table-column prop="店铺编号" label="店铺编号" width="120" />
              <el-table-column prop="小红书成单" label="小红书成单" width="120" />
              <el-table-column prop="本期累计成单" label="本期累计成单" width="120" />
              <el-table-column prop="企微留资数" label="企微留资数" width="120" />
            </el-table>
            
            <div v-if="previewData.length > 10" class="preview-tip">
              仅显示前10条记录，实际将导入{{ previewData.length }}条记录
            </div>
          </div>
          
          <!-- 步骤4: 导入完成 -->
          <div v-if="importStep === 3" class="step-4">
            <el-result
              :icon="importResult.success ? 'success' : 'error'"
              :title="importResult.success ? '导入成功' : '导入失败'"
              :sub-title="importResult.message"
            >
              <template #extra>
                <el-button type="primary" @click="showImportDialog = false">
                  完成
                </el-button>
                <el-button @click="resetImport">
                  重新导入
                </el-button>
              </template>
            </el-result>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑/新增对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="isEdit ? '编辑销售数据' : '新增销售数据'"
      width="600px"
      @close="handleEditDialogClose"
    >
      <el-form
        ref="editFormRef"
        :model="editFormData"
        :rules="editFormRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌" prop="品牌">
              <el-select 
                v-model="editFormData.品牌" 
                placeholder="请选择品牌" 
                @change="onEditBrandChange"
                style="width: 100%"
              >
                <el-option
                  v-for="brand in brandOptions"
                  :key="brand.value"
                  :label="brand.label"
                  :value="brand.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌ID" prop="品牌ID">
              <el-input 
                v-model="editFormData.品牌ID" 
                placeholder="品牌ID将自动填充"
                readonly
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
        <el-form-item label="周期类型" prop="周期类型">
          <el-select
            v-model="editFormData.周期类型"
            placeholder="请选择周期类型"
            style="width: 100%"
            @change="onEditCycleTypeChange"
          >
            <el-option label="日" value="BY_DAY" />
            <el-option label="周" value="BY_WEEK" />
            <el-option label="月" value="BY_MONTH" />
          </el-select>
        </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="员工姓名">
              <el-input v-model="editFormData.员工姓名" placeholder="请输入员工姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="日期" prop="日期">
              <el-date-picker
                v-model="editFormData.日期"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="onEditDateChange"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="店铺编号" prop="店铺编号">
          <el-input v-model="editFormData.店铺编号" placeholder="请输入店铺编号" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="小红书成单" prop="小红书成单">
              <el-input-number 
                v-model="editFormData.小红书成单" 
                :precision="2" 
                :min="0" 
                :max="999999999.99"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="本期累计成单" prop="本期累计成单">
              <el-input-number 
                v-model="editFormData.本期累计成单" 
                :min="0" 
                :max="999999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="企微留资数" prop="企微留资数">
          <el-input-number 
            v-model="editFormData.企微留资数" 
            :min="0" 
            :max="999999"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit" :loading="editSubmitting">
          {{ isEdit ? '更新' : '新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useSalesDataStore } from '@/stores/salesData'
import { useBrandManagementStore } from '@/stores/brandManagement'
import { MessageUtils, FormUtils, DataUtils } from '@/utils/common'
import { ExcelUtils } from '@/utils/excel'

const salesDataStore = useSalesDataStore()
const brandManagementStore = useBrandManagementStore()

// 响应式数据
const loading = computed(() => salesDataStore.loading)
const salesDataList = computed(() => salesDataStore.salesDataList)
const total = computed(() => salesDataStore.total)
const currentPage = computed({
  get: () => salesDataStore.currentPage,
  set: (value) => salesDataStore.setPagination(value, pageSize.value)
})

// 品牌选项
const brandOptions = computed(() => {
  console.log('品牌数据:', brandManagementStore.brands)
  console.log('品牌数据长度:', brandManagementStore.brands?.length || 0)
  const options = (brandManagementStore.brands || []).map(brand => ({
    label: brand.品牌,
    value: brand.品牌
  }))
  console.log('品牌选项:', options)
  return options
})
const pageSize = computed({
  get: () => salesDataStore.pageSize,
  set: (value) => salesDataStore.setPagination(currentPage.value, value)
})
const brandList = computed(() => salesDataStore.brandList)
const statistics = computed(() => salesDataStore.statistics)

// 搜索表单
const searchForm = reactive({
  search: '',
  brandId: '',
  cycleType: '',
  startDate: '',
  endDate: ''
})

const dateRange = ref([])

// 表格选择
const selectedRows = ref([])

// 导入相关
const showImportDialog = ref(false)
const importStep = ref(0)
const previewData = ref([])
const importing = ref(false)
const importResult = ref({ success: false, message: '' })

// 导入品牌和日期表单
const importBrandDateForm = reactive({
  品牌: '',
  品牌ID: '',
  周期类型: 'BY_WEEK',
  日期: ''
})

// 编辑相关
const showEditDialog = ref(false)
const editSubmitting = ref(false)
const isEdit = ref(false)
// 保存原始复合主键信息，用于更新匹配
const originalKeys = ref({ 品牌ID: '', 周期类型: '', 日期: '', 员工姓名: '', 店铺编号: '' })
const editFormData = reactive({
  品牌: '',
  品牌ID: '',
  周期类型: '',
  日期: '',
  员工姓名: '',
  店铺编号: '',
  小红书成单: 0,
  本期累计成单: 0,
  企微留资数: 0
})

const editFormRules = {
  品牌: [
    { required: true, message: '请输入品牌名称', trigger: 'blur' }
  ],
  品牌ID: [
    { required: true, message: '请输入品牌ID', trigger: 'blur' }
  ],
  员工姓名: [
    { required: true, message: '请输入员工姓名', trigger: 'blur' }
  ]
}

const editFormRef = ref()
const uploadRef = ref()

// 导入品牌选择变化处理
const onImportBrandChange = (brandName) => {
  const brand = brandManagementStore.brands.find(b => b.品牌 === brandName)
  if (brand) {
    importBrandDateForm.品牌ID = brand.ID
  }
}

// 编辑品牌选择变化处理
const onEditBrandChange = (brandName) => {
  const brand = brandManagementStore.brands.find(b => b.品牌 === brandName)
  if (brand) {
    editFormData.品牌ID = brand.ID
  }
}

// 编辑表单周期类型变化处理
const onEditCycleTypeChange = (cycleType) => {
  if (editFormData.日期) {
    // 根据周期类型重新计算日期
    const selectedDate = new Date(editFormData.日期)
    const calculatedDate = calculateDateByCycleType(selectedDate, cycleType)
    editFormData.日期 = calculatedDate
    console.log('编辑表单周期类型变化:', cycleType, '基于日期:', selectedDate, '计算后日期:', calculatedDate)
  } else {
    // 如果没有选择日期，使用当前日期计算默认值
    const calculatedDate = calculateDateByCycleType(new Date(), cycleType)
    editFormData.日期 = calculatedDate
    console.log('编辑表单周期类型变化:', cycleType, '使用当前日期计算:', calculatedDate)
  }
}

// 编辑表单日期变化处理
const onEditDateChange = (date) => {
  if (date && editFormData.周期类型) {
    // 根据周期类型计算日期
    const calculatedDate = calculateDateByCycleType(new Date(date), editFormData.周期类型)
    editFormData.日期 = calculatedDate
    console.log('编辑表单日期变化:', date, '周期类型:', editFormData.周期类型, '计算后日期:', calculatedDate)
  }
}

// 日期变化处理
const onDateChange = (date) => {
  if (date && importBrandDateForm.周期类型) {
    // 根据周期类型计算日期
    const calculatedDate = calculateDateByCycleType(new Date(date), importBrandDateForm.周期类型)
    importBrandDateForm.日期 = calculatedDate
    console.log('用户选择日期:', date, '周期类型:', importBrandDateForm.周期类型, '计算后日期:', calculatedDate)
  }
}

// 周期类型变化处理
const onCycleTypeChange = (cycleType) => {
  if (importBrandDateForm.日期) {
    // 根据周期类型重新计算日期
    const selectedDate = new Date(importBrandDateForm.日期)
    const calculatedDate = calculateDateByCycleType(selectedDate, cycleType)
    importBrandDateForm.日期 = calculatedDate
    console.log('周期类型变化:', cycleType, '基于日期:', selectedDate, '计算后日期:', calculatedDate)
  } else {
    // 如果没有选择日期，使用当前日期计算默认值
    const calculatedDate = calculateDateByCycleType(new Date(), cycleType)
    importBrandDateForm.日期 = calculatedDate
    console.log('周期类型变化:', cycleType, '使用当前日期计算:', calculatedDate)
  }
}

// 根据周期类型计算日期
const calculateDateByCycleType = (date, cycleType) => {
  const d = new Date(date)
  
  switch (cycleType) {
    case 'BY_DAY':
      // 日类型：使用选择的日期
      return d.toISOString().split('T')[0]
      
    case 'BY_WEEK':
      // 周类型：取这一周的开始第一天（周一）
      const dayOfWeek = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      return monday.getFullYear() + '-' + 
             String(monday.getMonth() + 1).padStart(2, '0') + '-' + 
             String(monday.getDate()).padStart(2, '0')
      
    case 'BY_MONTH':
      // 月类型：取这一月的开始第一天
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
      return firstDay.getFullYear() + '-' + 
             String(firstDay.getMonth() + 1).padStart(2, '0') + '-' + 
             String(firstDay.getDate()).padStart(2, '0')
      
    default:
      return d.toISOString().split('T')[0]
  }
}

// 进入预览步骤
const proceedToPreview = () => {
  // 为所有预览数据设置统一的品牌和日期信息
  previewData.value = previewData.value.map(item => ({
    ...item,
    品牌: importBrandDateForm.品牌,
    品牌ID: importBrandDateForm.品牌ID,
    周期类型: importBrandDateForm.周期类型,
    日期: importBrandDateForm.日期
  }))
  importStep.value = 2
}

// 方法
// 获取周期类型的中文标签
const getCycleTypeLabel = (cycleType) => {
  const cycleTypeMap = {
    'BY_DAY': '日',
    'BY_WEEK': '周', 
    'BY_MONTH': '月'
  }
  return cycleTypeMap[cycleType] || cycleType
}

const fetchData = async () => {
  try {
    await salesDataStore.fetchSalesDataList()
    await salesDataStore.fetchStatistics()
  } catch (error) {
    MessageUtils.error(error.message)
  }
}

const handleSearch = () => {
  // 将品牌名称转换为品牌ID
  const searchParams = { ...searchForm }
  if (searchForm.brandId) {
    const brand = brandManagementStore.brands.find(b => b.品牌 === searchForm.brandId)
    if (brand) {
      searchParams.brandId = brand.ID
    }
  }
  salesDataStore.setSearchParams(searchParams)
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    brandId: '',
    cycleType: '',
    startDate: '',
    endDate: ''
  })
  dateRange.value = []
  salesDataStore.setSearchParams(searchForm)
  fetchData()
}

const handleDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.startDate = dates[0]
    searchForm.endDate = dates[1]
  } else {
    searchForm.startDate = ''
    searchForm.endDate = ''
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  fetchData()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchData()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleAdd = () => {
  console.log('=== 点击新增销售数据按钮 ===')
  console.log('当前isEdit状态:', isEdit.value)
  console.log('当前showEditDialog状态:', showEditDialog.value)
  
  try {
    // 重置表单数据
    Object.assign(editFormData, {
      品牌: '',
      品牌ID: '',
      周期类型: 'BY_WEEK',
      日期: calculateDateByCycleType(new Date(), 'BY_WEEK'), // 自动计算默认日期
      员工姓名: '',
      店铺编号: '',
      小红书成单: 0,
      本期累计成单: 0,
      企微留资数: 0
    })
    originalKeys.value = { 品牌ID: '', 周期类型: '', 日期: '', 员工姓名: '', 店铺编号: '' }
    isEdit.value = false
    showEditDialog.value = true
    
    console.log('设置后isEdit状态:', isEdit.value)
    console.log('设置后showEditDialog状态:', showEditDialog.value)
    console.log('自动计算的日期:', editFormData.日期)
    console.log('=== 新增按钮处理完成 ===')
  } catch (error) {
    console.error('新增按钮处理出错:', error)
    // 即使出错也要打开对话框
    isEdit.value = false
    showEditDialog.value = true
  }
}

const handleEdit = (row) => {
  Object.assign(editFormData, row)
    originalKeys.value = {
      品牌ID: row.品牌ID,
      周期类型: row.周期类型,
      日期: row.日期,
      员工姓名: row.员工姓名,
      店铺编号: row.店铺编号
    }
  isEdit.value = true
  showEditDialog.value = true
}

const handleDelete = async (row) => {
  try {
    console.log('开始删除销售数据:', row)
    await MessageUtils.confirmDelete(`销售数据记录`)
    console.log('用户确认删除，开始执行删除操作')
    await salesDataStore.deleteSalesData(
      row.品牌ID,
      row.周期类型,
      row.日期,
      row.员工姓名,
      row.店铺编号
    )
    console.log('删除操作完成')
    MessageUtils.success('删除成功')
    fetchData()
  } catch (error) {
    console.error('删除失败:', error)
    if (error !== 'cancel') {
      MessageUtils.error(error.message)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await MessageUtils.confirmBatchOperation('删除', selectedRows.value.length)
    await salesDataStore.batchDeleteSalesData(selectedRows.value)
    MessageUtils.success('批量删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      MessageUtils.error(error.message)
    }
  }
}


const handleFileChange = async (file) => {
  try {
    const excelData = await ExcelUtils.parseExcelFile(file.raw)
    const headers = ['员工姓名', '店铺编号', '小红书成单', '本期累计成单', '企微留资数']
    
    const validation = ExcelUtils.validateExcelData(excelData, headers)
    if (!validation.isValid) {
      MessageUtils.error(`数据验证失败:\n${validation.errors.join('\n')}`)
      return
    }
    
    previewData.value = ExcelUtils.convertToSalesData(excelData)
    importStep.value = 1
  } catch (error) {
    MessageUtils.error(error.message)
  }
}

const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    MessageUtils.error('只能上传Excel文件!')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    MessageUtils.error('文件大小不能超过10MB!')
    return false
  }
  
  return false // 阻止自动上传
}

const handleImport = async () => {
  try {
    importing.value = true
    await salesDataStore.batchImportSalesData(previewData.value)
    
    importResult.value = {
      success: true,
      message: `成功导入${previewData.value.length}条记录`
    }
    importStep.value = 3
    
    MessageUtils.success('导入成功')
    fetchData()
  } catch (error) {
    importResult.value = {
      success: false,
      message: error.message
    }
    importStep.value = 3
    MessageUtils.error(error.message)
  } finally {
    importing.value = false
  }
}

const handleEditSubmit = async () => {
  console.log('=== 开始提交销售数据', isEdit.value ? '编辑' : '新增', '===')
  console.log('数据:', editFormData)
  
  try {
    console.log('开始表单验证...')
    await editFormRef.value.validate()
    console.log('✓ 表单验证通过')
    
    editSubmitting.value = true
    console.log('开始', isEdit.value ? '更新' : '创建', '数据...')
    
    if (isEdit.value) {
      // 编辑模式：更新现有数据
      await salesDataStore.updateSalesData(
        originalKeys.value.品牌ID,
        originalKeys.value.周期类型,
        originalKeys.value.日期,
        originalKeys.value.员工姓名,
        originalKeys.value.店铺编号,
        editFormData
      )
      MessageUtils.success('更新成功')
      console.log('✓ 更新成功')
    } else {
      // 新增模式：创建新数据
      await salesDataStore.createSalesData(editFormData)
      MessageUtils.success('新增成功')
      console.log('✓ 新增成功')
    }
    
    console.log('关闭对话框...')
    showEditDialog.value = false
    console.log('刷新数据...')
    fetchData()
    console.log('=== 操作完成 ===')
  } catch (error) {
    console.error('操作失败:', error)
    if (error && error.message) {
      MessageUtils.error(error.message)
    } else {
      MessageUtils.error('操作失败，请检查表单数据')
    }
  } finally {
    editSubmitting.value = false
  }
}

const handleImportDialogClose = () => {
  resetImport()
}

const handleEditDialogClose = () => {
  Object.assign(editFormData, {
    品牌: '',
    品牌ID: '',
    周期类型: 'BY_WEEK',
    日期: '',
    员工姓名: '',
    店铺编号: '',
    小红书成单: 0,
    本期累计成单: 0,
    企微留资数: 0
  })
  originalKeys.value = { 品牌ID: '', 周期类型: '', 日期: '', 员工姓名: '', 店铺编号: '' }
  isEdit.value = false
  editFormRef.value?.resetFields()
}

const resetImport = () => {
  importStep.value = 0
  previewData.value = []
  importResult.value = { success: false, message: '' }
  importBrandDateForm.品牌 = ''
  importBrandDateForm.品牌ID = ''
  importBrandDateForm.周期类型 = 'BY_WEEK'
  importBrandDateForm.日期 = ''
  uploadRef.value?.clearFiles()
}

const downloadTemplate = () => {
  const templateData = [
    ['员工姓名', '店铺编号', '小红书成单', '本期累计成单', '企微留资数'],
    ['张三', '001', '1000.00', '100', '10']
  ]
  
  ExcelUtils.downloadTemplate(templateData, '销售数据导入模板.xlsx', '销售数据模板')
  MessageUtils.success('模板下载成功')
}

// 移除周期类型枚举逻辑，允许自由输入

const formatMoney = DataUtils.formatMoney
const formatDateTime = DataUtils.formatDateTime

// 生命周期
onMounted(async () => {
  try {
    console.log('开始加载品牌数据...')
    await brandManagementStore.loadBrands()
    console.log('品牌数据加载完成:', brandManagementStore.brands)
    console.log('品牌数据长度:', brandManagementStore.brands?.length || 0)
    
    // 如果品牌数据为空，提示用户
    if (!brandManagementStore.brands || brandManagementStore.brands.length === 0) {
      console.warn('品牌数据为空，请先在品牌关联中添加品牌')
    }
  } catch (error) {
    console.error('加载品牌数据失败:', error)
  }
  
  fetchData()
})
</script>

<style scoped>
.sales-data-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.search-section {
  margin-bottom: 20px;
}

.search-form {
  padding: 8px 0;
}

.search-input {
  width: 100%;
  min-width: 200px;
}

.filter-select {
  width: 100%;
  min-width: 150px;
}

.date-picker {
  width: 100%;
  min-width: 200px;
}

.search-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 0 !important;
}

.search-btn,
.reset-btn {
  min-width: 80px;
  height: 32px;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.action-buttons .el-button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-buttons .el-button .el-icon {
  font-size: 14px;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .action-buttons {
    gap: 4px;
  }
  
  .action-buttons .el-button {
    width: 28px;
    height: 28px;
  }
  
  .action-buttons .el-button .el-icon {
    font-size: 12px;
  }
}

@media (max-width: 576px) {
  .search-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-btn,
  .reset-btn {
    width: 100%;
  }
}

.stats-section {
  margin-bottom: 20px;
}

.stats-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stats-icon.amount {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stats-icon.leads {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stats-icon.orders {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stats-icon.average {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

.table-section {
  margin-bottom: 20px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.money-text {
  color: #67c23a;
  font-weight: 600;
}

.import-content {
  padding: 20px 0;
}

.step-content {
  margin-top: 30px;
}

.step-1 {
  text-align: center;
}

.template-download {
  margin-top: 20px;
}

.step-2 {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-header h4 {
  margin: 0;
  color: #303133;
}

.preview-tip {
  margin-top: 10px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.step-3 {
  text-align: center;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: 600;
}

:deep(.el-table td) {
  padding: 12px 0;
}

:deep(.el-pagination) {
  justify-content: center;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
}

:deep(.el-upload__text) {
  margin-top: 20px;
}

.brand-date-selection {
  padding: 20px;
}

.brand-date-selection h4 {
  margin-bottom: 10px;
  color: #303133;
}

.brand-date-selection p {
  margin-bottom: 20px;
  color: #606266;
  font-size: 14px;
}

.step-actions {
  margin-top: 30px;
  text-align: right;
}

.step-actions .el-button {
  margin-left: 10px;
}

.form-tip {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>
