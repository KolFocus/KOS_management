<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <el-icon><User /></el-icon>
          <span>个人资料</span>
        </div>
      </template>

      <div class="profile-content">
        <!-- 基本信息 -->
        <div class="profile-section">
          <h3 class="section-title">基本信息</h3>
          
          <el-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            label-width="100px"
            class="profile-form"
          >
            <el-form-item label="头像" class="avatar-item">
              <div class="avatar-container">
                <el-avatar
                  :size="80"
                  :src="profileForm.avatar_url"
                  :icon="User"
                  class="avatar"
                />
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :http-request="handleAvatarUpload"
                >
                  <el-button type="primary" size="small" :loading="uploading">
                    <el-icon><Upload /></el-icon>
                    更换头像
                  </el-button>
                </el-upload>
              </div>
            </el-form-item>

            <el-form-item label="用户名" prop="name">
              <el-input
                v-model="profileForm.name"
                placeholder="请输入用户名"
                clearable
                :disabled="!editing"
              />
            </el-form-item>

            <el-form-item label="邮箱">
              <el-input
                v-model="profileForm.email"
                disabled
                class="disabled-input"
              />
              <span class="input-tip">邮箱不可修改</span>
            </el-form-item>

            <el-form-item label="个人简介" prop="bio">
              <el-input
                v-model="profileForm.bio"
                type="textarea"
                :rows="3"
                placeholder="请输入个人简介"
                :disabled="!editing"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-form-item>
              <div class="form-actions">
                <el-button
                  v-if="!editing"
                  type="primary"
                  @click="startEdit"
                >
                  <el-icon><Edit /></el-icon>
                  编辑资料
                </el-button>
                <template v-else>
                  <el-button
                    type="primary"
                    :loading="saving"
                    @click="saveProfile"
                  >
                    <el-icon><Check /></el-icon>
                    保存
                  </el-button>
                  <el-button @click="cancelEdit">
                    <el-icon><Close /></el-icon>
                    取消
                  </el-button>
                </template>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <!-- 安全设置 -->
        <div class="profile-section">
          <h3 class="section-title">安全设置</h3>
          
          <div class="security-items">
            <div class="security-item">
              <div class="item-info">
                <h4>密码</h4>
                <p>定期更新密码以确保账号安全</p>
              </div>
              <el-button type="primary" @click="showChangePassword = true">
                修改密码
              </el-button>
            </div>

            <div class="security-item">
              <div class="item-info">
                <h4>登录历史</h4>
                <p>查看最近的登录记录</p>
              </div>
              <el-button @click="handleShowLoginHistory">
                查看记录
              </el-button>
            </div>
          </div>
        </div>

        <!-- 账号信息 -->
        <div class="profile-section">
          <h3 class="section-title">账号信息</h3>
          
          <div class="account-info">
            <div class="info-item">
              <span class="label">注册时间：</span>
              <span class="value">{{ formatDate(profileForm.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">最后登录：</span>
              <span class="value">{{ formatDate(profileForm.last_sign_in_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">账号状态：</span>
              <el-tag :type="profileForm.email_confirmed_at ? 'success' : 'warning'">
                {{ profileForm.email_confirmed_at ? '已验证' : '未验证' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showChangePassword"
      title="修改密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showChangePassword = false">取消</el-button>
        <el-button
          type="primary"
          :loading="changingPassword"
          @click="changePassword"
        >
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <!-- 登录历史对话框 -->
    <el-dialog
      v-model="showLoginHistory"
      title="登录历史"
      width="600px"
    >
      <el-table :data="loginHistory" style="width: 100%">
        <el-table-column prop="created_at" label="登录时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="150" />
        <el-table-column prop="user_agent" label="设备信息" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/utils/supabase'
import { MessageUtils } from '@/utils/common'
import { User, Edit, Check, Close, Upload } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

// 表单引用
const profileFormRef = ref()
const passwordFormRef = ref()

// 状态
const editing = ref(false)
const saving = ref(false)
const uploading = ref(false)
const changingPassword = ref(false)
const showChangePassword = ref(false)
const showLoginHistory = ref(false)

// 个人资料表单
const profileForm = reactive({
  name: '',
  email: '',
  bio: '',
  avatar_url: '',
  created_at: '',
  last_sign_in_at: '',
  email_confirmed_at: null
})

// 密码修改表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 登录历史
const loginHistory = ref([])

// 表单验证规则
const profileRules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, message: '用户名长度不能少于2位', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '个人简介不能超过200个字符', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}


// 方法
const loadProfile = async () => {
  try {
    const user = authStore.user
    if (user) {
      profileForm.name = user.user_metadata?.name || user.email?.split('@')[0] || ''
      profileForm.email = user.email || ''
      profileForm.bio = user.user_metadata?.bio || ''
      profileForm.avatar_url = user.user_metadata?.avatar_url || ''
      profileForm.created_at = user.created_at || ''
      profileForm.last_sign_in_at = user.last_sign_in_at || ''
      profileForm.email_confirmed_at = user.email_confirmed_at
    }
  } catch (error) {
    console.error('加载个人资料失败:', error)
    MessageUtils.error('加载个人资料失败')
  }
}

const startEdit = () => {
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
  loadProfile() // 重新加载原始数据
}

const saveProfile = async () => {
  if (!profileFormRef.value) return
  
  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        saving.value = true
        
        const result = await authStore.updateProfile({
          name: profileForm.name,
          bio: profileForm.bio,
          avatar_url: profileForm.avatar_url
        })
        
        if (result.success) {
          editing.value = false
          // 移除重复提示，认证状态管理中已有提示
        }
      } catch (error) {
        console.error('保存个人资料失败:', error)
        MessageUtils.error('保存个人资料失败')
      } finally {
        saving.value = false
      }
    }
  })
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    MessageUtils.error('头像图片只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    MessageUtils.error('头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleAvatarUpload = async (options) => {
  try {
    uploading.value = true
    const file = options.file
    
    // 使用Supabase客户端上传文件
    const fileExt = file.name.split('.').pop()
    const fileName = `${authStore.user.id}/avatar.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      throw error
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    const avatarUrl = urlData.publicUrl
    
    // 更新用户元数据中的头像URL
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl
      }
    })

    if (updateError) {
      console.error('更新用户头像失败:', updateError)
      MessageUtils.warning('头像上传成功，但保存用户信息失败')
    } else {
      // 更新本地状态
      profileForm.avatar_url = avatarUrl
      // 同时更新认证状态中的用户信息
      if (authStore.user) {
        authStore.user.user_metadata = {
          ...authStore.user.user_metadata,
          avatar_url: avatarUrl
        }
      }
      MessageUtils.success('头像上传成功')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    MessageUtils.error('头像上传失败: ' + error.message)
  } finally {
    uploading.value = false
  }
}


const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        changingPassword.value = true
        
        // 验证当前密码
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authStore.userEmail,
          password: passwordForm.currentPassword
        })
        
        if (signInError) {
          MessageUtils.error('当前密码不正确')
          return
        }
        
        // 更新密码
        const { error: updateError } = await supabase.auth.updateUser({
          password: passwordForm.newPassword
        })
        
        if (updateError) {
          throw updateError
        }
        
        MessageUtils.success('密码修改成功')
        showChangePassword.value = false
        
        // 清空表单
        Object.assign(passwordForm, {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
      } catch (error) {
        console.error('修改密码失败:', error)
        MessageUtils.error(error.message || '修改密码失败')
      } finally {
        changingPassword.value = false
      }
    }
  })
}

const handleShowLoginHistory = async () => {
  console.log('=== 点击查看记录按钮 ===')
  showLoginHistory.value = true
  await loadLoginHistory()
}

const loadLoginHistory = async () => {
  try {
    console.log('=== 开始加载登录历史 ===')
    console.log('用户ID:', authStore.user.id)
    console.log('用户邮箱:', authStore.user.email)
    console.log('当前认证状态:', authStore.isAuthenticated)
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
    console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置')
    
    // 检查Supabase客户端状态
    console.log('Supabase客户端状态:', supabase)
    console.log('当前会话:', await supabase.auth.getSession())
    
    // 先测试简单的查询
    console.log('=== 测试简单查询 ===')
    const { data: testData, error: testError } = await supabase
      .from('user_login_history')
      .select('count')
      .eq('user_id', authStore.user.id)
    
    console.log('简单查询结果:', { testData, testError })
    console.log('简单查询错误详情:', testError ? {
      message: testError.message,
      code: testError.code,
      details: testError.details,
      hint: testError.hint
    } : '无错误')
    
    // 测试不带条件的查询
    console.log('=== 测试不带条件的查询 ===')
    const { data: allData, error: allError } = await supabase
      .from('user_login_history')
      .select('*')
      .limit(5)
    
    console.log('不带条件查询结果:', { allData, allError })
    console.log('不带条件查询错误详情:', allError ? {
      message: allError.message,
      code: allError.code,
      details: allError.details,
      hint: allError.hint
    } : '无错误')
    
    // 从自定义表获取登录历史
    console.log('=== 执行完整查询 ===')
    const { data, error } = await supabase
      .from('user_login_history')
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('login_time', { ascending: false })
      .limit(10)
    
    console.log('完整查询结果:', { data, error })
    console.log('数据长度:', data ? data.length : 0)
    console.log('完整查询错误详情:', error ? {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    } : '无错误')
    
    if (error) {
      console.error('获取登录历史失败:', error)
      console.error('错误详情:', error.message, error.code, error.details)
      // 如果表不存在或没有权限，使用模拟数据
      loginHistory.value = [
        {
          created_at: new Date().toISOString(),
          ip_address: '192.168.1.100',
          user_agent: navigator.userAgent
        }
      ]
      return
    }
    
    console.log('处理后的数据:', data)
    
    if (data && data.length > 0) {
      console.log('找到登录历史数据，数量:', data.length)
      // 处理登录历史数据
      loginHistory.value = data.map(log => ({
        created_at: log.login_time,
        ip_address: log.ip_address || '未知',
        user_agent: log.user_agent || '未知设备'
      }))
    } else {
      console.log('没有找到登录历史数据，使用模拟数据')
      // 如果没有数据，使用模拟数据
      loginHistory.value = [
        {
          created_at: new Date().toISOString(),
          ip_address: '192.168.1.100',
          user_agent: navigator.userAgent
        }
      ]
    }
    
    console.log('=== 登录历史加载完成 ===')
  } catch (error) {
    console.error('加载登录历史失败:', error)
    console.error('错误堆栈:', error.stack)
    // 出错时使用模拟数据
    loginHistory.value = [
      {
        created_at: new Date().toISOString(),
        ip_address: '192.168.1.100',
        user_agent: navigator.userAgent
      }
    ]
  }
}


const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 生命周期
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-header .el-icon {
  margin-right: 8px;
  color: #409eff;
}

.profile-content {
  padding: 20px 0;
}

.profile-section {
  margin-bottom: 40px;
}

.profile-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.profile-form {
  max-width: 500px;
}

.avatar-item {
  margin-bottom: 30px;
}

.avatar-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  border: 2px solid #e4e7ed;
}

.avatar-uploader {
  display: inline-block;
}

.disabled-input {
  background-color: #f5f7fa;
}

.input-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.security-items {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.item-info h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.item-info p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-weight: 500;
  color: #606266;
  min-width: 100px;
}

.info-item .value {
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-container {
    padding: 10px;
  }
  
  .avatar-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
