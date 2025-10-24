<template>
  <div class="reset-container">
    <el-card class="reset-card">
      <div class="title">重置密码</div>
      <el-alert
        v-if="errorMessage"
        type="error"
        :closable="false"
        class="mb-12"
        :title="errorMessage"
        show-icon
      />
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item prop="confirm">
          <el-input
            v-model="form.confirm"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        <el-button type="primary" :loading="authStore.loading" :disabled="!canReset" @click="onSubmit" class="submit-btn">
          确认重置
        </el-button>
      </el-form>
      <div class="tips">
        {{ canReset ? '请设置新密码完成重置。' : '请从邮箱中的“Reset Password”链接进入本页，链接有效期有限。' }}
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { MessageUtils } from '@/utils/common'
import { supabase } from '@/utils/supabase'

const authStore = useAuthStore()
const router = useRouter()
const formRef = ref()
const canReset = ref(false)
const errorMessage = ref('')

const form = reactive({
  password: '',
  confirm: ''
})

const rules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirm: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

const onSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid || !canReset.value) return
    const ok = await authStore.updatePassword(form.password)
    if (ok) {
      MessageUtils.success('密码已重置，请使用新密码登录')
      router.replace('/login')
    }
  })
}

// 验证来自邮箱的链接是否有效：
// - Supabase 会在链接中带上#access_token 等片段，客户端据此建立临时会话
// - 如果链接过期/无效，URL 会包含 error 与 error_code
onMounted(async () => {
  // 1) 链接错误提示
  const hash = window.location.hash || ''
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  if (params.get('error')) {
    const desc = params.get('error_description') || '邮箱链接无效或已过期'
    errorMessage.value = decodeURIComponent(desc)
  }

  // 2) 检查是否已建立恢复会话
  const { data: { session } } = await supabase.auth.getSession()
  canReset.value = !!session?.user

  // 3) 监听恢复事件（部分环境需要依赖该事件）
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
      canReset.value = true
      errorMessage.value = ''
    } else if (event === 'SIGNED_OUT') {
      canReset.value = false
    }
  })
})
</script>

<style scoped>
.reset-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 20px;
}
.reset-card {
  width: 100%;
  max-width: 420px;
}
.title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}
.submit-btn {
  width: 100%;
}
.tips {
  margin-top: 12px;
  color: #909399;
  font-size: 12px;
  text-align: center;
}
.mb-12 { margin-bottom: 12px; }
</style>


