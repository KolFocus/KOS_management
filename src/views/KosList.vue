<template>
  <div class="kos-list-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>KOS列表管理</h1>
        <p>管理小红书专业号的KOS列表信息</p>
      </div>
      <div class="header-right">
        <el-button type="success" @click="showImportDialog = true">
          <el-icon><Upload /></el-icon>
          Excel导入
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增KOS
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
                  placeholder="品牌、昵称或用户ID"
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
              <el-form-item label="渠道">
                <el-select 
                  v-model="searchForm.channel" 
                  placeholder="选择渠道" 
                  clearable
                  class="filter-select"
                >
                  <el-option
                    v-for="channel in channelList"
                    :key="channel"
                    :label="channel"
                    :value="channel"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="5">
              <el-form-item label="状态">
                <el-select 
                  v-model="searchForm.status" 
                  placeholder="选择状态" 
                  clearable
                  class="filter-select"
                >
                  <el-option label="上线" :value="1" />
                  <el-option label="下线" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="24" :md="24" :lg="6" :xl="9">
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
              <div class="stats-icon online">
                <el-icon><User /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ onlineCount }}</div>
                <div class="stats-label">上线KOS</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon offline">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ offlineCount }}</div>
                <div class="stats-label">下线KOS</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon total">
                <el-icon><Users /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ total }}</div>
                <div class="stats-label">总KOS数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon channel">
                <el-icon><Platform /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ channelList.length }}</div>
                <div class="stats-label">渠道数量</div>
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
          <div class="table-title">KOS列表</div>
          <div class="table-actions">
            <el-button 
              type="success" 
              :disabled="selectedRows.length === 0"
              @click="handleBatchOnline"
            >
              <el-icon><Check /></el-icon>
              批量上线
            </el-button>
            <el-button 
              type="warning" 
              :disabled="selectedRows.length === 0"
              @click="handleBatchOffline"
            >
              <el-icon><Close /></el-icon>
              批量下线
            </el-button>
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
          :data="kosList"
          @selection-change="handleSelectionChange"
          stripe
          border
        >
          <el-table-column type="selection" min-width="55" />
          
          <el-table-column prop="品牌" label="品牌" min-width="120" />
          <el-table-column prop="品牌ID" label="品牌ID" min-width="100" />
          <el-table-column prop="用户ID" label="用户ID" min-width="120" />
          <el-table-column prop="昵称" label="昵称" min-width="120" />
          
          <el-table-column prop="头像" label="头像" min-width="80">
            <template #default="{ row }">
              <el-avatar 
                v-if="row.头像 && isValidAvatarUrl(row.头像)" 
                :src="row.头像" 
                :size="40"
                @error="handleAvatarError"
              />
              <el-avatar v-else :size="40">
                <el-icon><User /></el-icon>
              </el-avatar>
            </template>
          </el-table-column>
          
          <el-table-column prop="排序" label="排序" min-width="80" />
          <el-table-column prop="所属用户" label="所属用户" min-width="120" />
          <el-table-column prop="所属店铺" label="所属店铺" min-width="120" />
          <el-table-column prop="渠道" label="渠道" min-width="100" />
          
          <el-table-column prop="参与统计" label="状态" min-width="100">
            <template #default="{ row }">
              <el-tag :type="row.参与统计 === 1 ? 'success' : 'info'">
                {{ row.参与统计 === 1 ? '上线' : '下线' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="AZ_批次号" label="AZ批次号" min-width="150" />
          
          <el-table-column label="操作" min-width="180">
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
                
                <el-tooltip :content="row.参与统计 === 1 ? '下线' : '上线'" placement="top">
                  <el-button 
                    :type="row.参与统计 === 1 ? 'warning' : 'success'"
                    size="small" 
                    circle
                    @click="handleToggleStatus(row)"
                  >
                    <el-icon>
                      <component :is="row.参与统计 === 1 ? 'Close' : 'Check'" />
                    </el-icon>
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
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEdit ? '编辑KOS' : '新增KOS'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌" prop="品牌">
              <el-input v-model="formData.品牌" placeholder="请输入品牌名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌ID" prop="品牌ID">
              <el-input v-model="formData.品牌ID" placeholder="请输入品牌ID" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户ID" prop="用户ID">
              <el-input v-model="formData.用户ID" placeholder="请输入用户ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="昵称">
              <el-input v-model="formData.昵称" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="头像" prop="头像">
          <el-input v-model="formData.头像" placeholder="请输入头像URL" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序" prop="排序">
              <el-input-number v-model="formData.排序" :min="1" :max="9999" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渠道" prop="渠道">
              <el-input v-model="formData.渠道" placeholder="请输入渠道" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属用户" prop="所属用户">
              <el-input v-model="formData.所属用户" placeholder="请输入所属用户" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属店铺" prop="所属店铺">
              <el-input v-model="formData.所属店铺" placeholder="请输入所属店铺" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="参与统计" prop="参与统计">
          <el-radio-group v-model="formData.参与统计">
            <el-radio :label="1">上线</el-radio>
            <el-radio :label="2">下线</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="AZ批次号" prop="AZ_批次号">
          <el-input v-model="formData.AZ_批次号" placeholder="请输入AZ批次号" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

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
          
          <!-- 步骤2: 数据预览 -->
          <div v-if="importStep === 1" class="step-2">
            <div class="preview-header">
              <h4>数据预览 (共{{ previewData.length }}条记录)</h4>
              <el-button type="primary" @click="handleImport" :loading="importing">
                <el-icon><Upload /></el-icon>
                确认导入
              </el-button>
            </div>
            
            <el-table :data="previewData.slice(0, 10)" border max-height="400">
              <el-table-column prop="品牌" label="品牌" width="100" />
              <el-table-column prop="品牌ID" label="品牌ID" width="100" />
              <el-table-column prop="用户ID" label="用户ID" width="100" />
              <el-table-column prop="昵称" label="昵称" width="100" />
              <el-table-column prop="头像" label="头像" width="120" />
              <el-table-column prop="排序" label="排序" width="80" />
              <el-table-column prop="所属用户" label="所属用户" width="100" />
              <el-table-column prop="所属店铺" label="所属店铺" width="100" />
              <el-table-column prop="渠道" label="渠道" width="100" />
              <el-table-column prop="参与统计" label="参与统计" width="100" />
              <el-table-column prop="AZ_批次号" label="AZ批次号" width="120" />
            </el-table>
            
            <div v-if="previewData.length > 10" class="preview-tip">
              仅显示前10条记录，实际将导入{{ previewData.length }}条记录
            </div>
          </div>
          
          <!-- 步骤3: 导入完成 -->
          <div v-if="importStep === 2" class="step-3">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useKosListStore } from '@/stores/kosList'
import { MessageUtils, FormUtils, DataUtils } from '@/utils/common'
import { STATUS } from '@/utils/supabase'
import { ExcelUtils } from '@/utils/excel'
import * as XLSX from 'xlsx'

const kosListStore = useKosListStore()

// 响应式数据
const loading = computed(() => kosListStore.loading)
const kosList = computed(() => kosListStore.kosList)
const total = computed(() => kosListStore.total)
const currentPage = computed({
  get: () => kosListStore.currentPage,
  set: (value) => kosListStore.setPagination(value, pageSize.value)
})
const pageSize = computed({
  get: () => kosListStore.pageSize,
  set: (value) => kosListStore.setPagination(currentPage.value, value)
})
const channelList = computed(() => kosListStore.channelList)
const onlineCount = computed(() => kosListStore.onlineCount)
const offlineCount = computed(() => kosListStore.offlineCount)

// 搜索表单
const searchForm = reactive({
  search: '',
  channel: '',
  status: ''
})

// 表格选择
const selectedRows = ref([])

// 对话框状态
const showCreateDialog = ref(false)
const isEdit = ref(false)
const submitting = ref(false)

// 导入相关
const showImportDialog = ref(false)
const importStep = ref(0)
const previewData = ref([])
const importing = ref(false)
const importResult = ref({ success: false, message: '' })

// 表单数据
const formData = reactive({
  品牌: '',
  品牌ID: '',
  用户ID: '',
  昵称: '',
  头像: '',
  排序: 1,
  所属用户: '',
  所属店铺: '',
  渠道: '',
  参与统计: STATUS.ONLINE,
  AZ_批次号: ''
})

// 表单验证规则
const formRules = {
  品牌: [
    { required: true, message: '请输入品牌名称', trigger: 'blur' }
  ],
  品牌ID: [
    { required: true, message: '请输入品牌ID', trigger: 'blur' }
  ],
  用户ID: [
    { required: true, message: '请输入用户ID', trigger: 'blur' }
  ],
  AZ_批次号: [
    { required: true, message: '请输入AZ批次号', trigger: 'blur' }
  ],
  头像: [
    { 
      validator: (rule, value, callback) => {
        if (!value || value.trim() === '') {
          callback() // 空值通过验证
        } else {
          const error = FormUtils.validateUrl(value)
          if (error) {
            callback(new Error(error))
          } else {
            callback()
          }
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

const formRef = ref()
const uploadRef = ref()

// 方法
const fetchData = async () => {
  try {
    await kosListStore.fetchKosList()
  } catch (error) {
    MessageUtils.error(error.message)
  }
}

const handleSearch = () => {
  kosListStore.setSearchParams(searchForm)
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    channel: '',
    status: ''
  })
  kosListStore.setSearchParams(searchForm)
  fetchData()
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

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, row)
  showCreateDialog.value = true
}

const handleDelete = async (row) => {
  try {
    await MessageUtils.confirmDelete(`KOS "${row.昵称 || row.用户ID}"`)
    await kosListStore.deleteKos(row.品牌ID, row.用户ID)
    MessageUtils.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      MessageUtils.error(error.message)
    }
  }
}

const handleToggleStatus = async (row) => {
  try {
    const newStatus = row.参与统计 === STATUS.ONLINE ? STATUS.OFFLINE : STATUS.ONLINE
    const statusText = newStatus === STATUS.ONLINE ? '上线' : '下线'
    
    await MessageUtils.confirm(`确定要将KOS "${row.昵称 || row.用户ID}" ${statusText}吗？`)
    await kosListStore.updateKos(row.品牌ID, row.用户ID, { 参与统计: newStatus })
    MessageUtils.success(`${statusText}成功`)
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      MessageUtils.error(error.message)
    }
  }
}

const handleBatchOnline = async () => {
  try {
    await MessageUtils.confirmBatchOperation('上线', selectedRows.value.length)
    await kosListStore.batchUpdateStatus(selectedRows.value, STATUS.ONLINE)
    MessageUtils.success('批量上线成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      MessageUtils.error(error.message)
    }
  }
}

const handleBatchOffline = async () => {
  try {
    await MessageUtils.confirmBatchOperation('下线', selectedRows.value.length)
    await kosListStore.batchUpdateStatus(selectedRows.value, STATUS.OFFLINE)
    MessageUtils.success('批量下线成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      MessageUtils.error(error.message)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await MessageUtils.confirmBatchOperation('删除', selectedRows.value.length)
    await kosListStore.batchDeleteKos(selectedRows.value)
    MessageUtils.success('批量删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      MessageUtils.error(error.message)
    }
  }
}

const handleSubmit = async () => {
  console.log('=== 开始提交表单 ===')
  console.log('表单数据:', formData)
  console.log('是否为编辑模式:', isEdit.value)
  
  try {
    console.log('开始表单验证...')
    await formRef.value.validate()
    console.log('✓ 表单验证通过')
    
    submitting.value = true
    console.log('开始提交数据...')
    
    if (isEdit.value) {
      console.log('执行更新操作...')
      await kosListStore.updateKos(formData.品牌ID, formData.用户ID, formData)
      MessageUtils.success('更新成功')
      console.log('✓ 更新成功')
    } else {
      console.log('执行创建操作...')
      await kosListStore.createKos(formData)
      MessageUtils.success('创建成功')
      console.log('✓ 创建成功')
    }
    
    console.log('关闭对话框...')
    showCreateDialog.value = false
    console.log('刷新数据...')
    fetchData()
    console.log('=== 提交完成 ===')
  } catch (error) {
    console.error('提交失败:', error)
    if (error && error.message) {
      MessageUtils.error(error.message)
    } else {
      MessageUtils.error('操作失败，请检查表单数据')
    }
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  isEdit.value = false
  Object.assign(formData, {
    品牌: '',
    品牌ID: '',
    用户ID: '',
    昵称: '',
    头像: '',
    排序: 1,
    所属用户: '',
    所属店铺: '',
    渠道: '',
    参与统计: STATUS.ONLINE,
    AZ_批次号: ''
  })
  formRef.value?.resetFields()
}

const handleAvatarError = (event) => {
  // 静默处理头像加载失败，不显示警告
  // 让默认头像显示即可
  console.log('头像加载失败，使用默认头像')
}

// 验证头像URL是否有效
const isValidAvatarUrl = (url) => {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

const formatDateTime = DataUtils.formatDateTime

// 导入相关方法
const handleFileChange = async (file) => {
  try {
    const excelData = await ExcelUtils.parseExcelFile(file.raw)
    const headers = ['品牌', '品牌ID', '用户ID', '昵称', '头像', '排序', '所属用户', '所属店铺', '渠道', '参与统计', 'AZ_批次号']
    
    const validation = ExcelUtils.validateKosExcelData(excelData, headers)
    if (!validation.isValid) {
      MessageUtils.error(`数据验证失败:\n${validation.errors.join('\n')}`)
      return
    }
    
    previewData.value = ExcelUtils.convertToKosData(excelData)
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
    await kosListStore.batchImportKos(previewData.value)
    
    importResult.value = {
      success: true,
      message: `成功导入${previewData.value.length}条记录`
    }
    importStep.value = 2
    
    MessageUtils.success('导入成功')
    fetchData()
  } catch (error) {
    importResult.value = {
      success: false,
      message: error.message
    }
    importStep.value = 2
    MessageUtils.error(error.message)
  } finally {
    importing.value = false
  }
}

const handleImportDialogClose = () => {
  resetImport()
}

const resetImport = () => {
  importStep.value = 0
  previewData.value = []
  importResult.value = { success: false, message: '' }
  uploadRef.value?.clearFiles()
}

const downloadTemplate = () => {
  const templateData = [
    ['品牌', '品牌ID', '用户ID', '昵称', '头像', '排序', '所属用户', '所属店铺', '渠道', '参与统计', 'AZ_批次号'],
    ['示例品牌', '001', '1001', '张三', 'https://example.com/avatar.jpg', '1', '李四', '店铺A', '小红书', '1', 'AZ20240101001']
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KOS列表模板')
  
  XLSX.writeFile(workbook, 'KOS列表导入模板.xlsx')
  MessageUtils.success('模板下载成功')
}

// 生命周期
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.kos-list-container {
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

.stats-icon.online {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stats-icon.offline {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stats-icon.total {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stats-icon.channel {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
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
</style>
