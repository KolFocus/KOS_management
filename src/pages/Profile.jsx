import React from 'react'
import { Card, Descriptions, Form, Input, Button, Divider, Typography, message, Upload, Avatar, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../utils/supabase'

export default function Profile() {
  const user = useAuthStore(state => state.user)
  const updateProfile = useAuthStore(state => state.updateProfile)
  const updatePassword = useAuthStore(state => state.updatePassword)
  const loading = useAuthStore(state => state.loading)
  const [avatarUploading, setAvatarUploading] = React.useState(false)
  const [avatarFeedback, setAvatarFeedback] = React.useState(null)

  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  React.useEffect(() => {
    profileForm.setFieldsValue({
      name: user?.user_metadata?.name || ''
    })
  }, [user, profileForm])

  if (!user) {
    return (
      <Card title="个人资料">
        <Typography.Paragraph>请先登录后再查看个人资料。</Typography.Paragraph>
      </Card>
    )
  }

  const handleProfileUpdate = async (values) => {
    try {
      await updateProfile({ name: values.name })
      message.success('个人信息更新成功')
    } catch (error) {
      message.error(error.message || '更新个人信息失败')
    }
  }

  const handlePasswordUpdate = async (values) => {
    try {
      await updatePassword(values.newPassword)
      passwordForm.resetFields()
      message.success('密码更新成功')
    } catch (error) {
      message.error(error.message || '密码更新失败')
    }
  }

  const uploadAvatarFile = async (file) => {
    try {
      setAvatarUploading(true)
      const fileExt = file.name?.split('.').pop() || 'png'
      const filePath = `${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })
      if (uploadError) throw uploadError
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = publicData?.publicUrl
      if (!publicUrl) {
        throw new Error('无法获取头像地址')
      }
      await updateProfile({ avatar_url: publicUrl })
      setAvatarFeedback({ type: 'success', text: '头像更新成功' })
      message.success('头像更新成功')
    } catch (error) {
      console.error('头像上传失败:', error)
      let friendlyMessage = '头像上传失败，请稍后重试'
      const rawMessage = error?.message || ''
      if (rawMessage.includes('row-level security')) {
        friendlyMessage = '没有权限上传头像，请重新登录或联系管理员检查存储策略'
      } else if (rawMessage.toLowerCase().includes('payload too large')) {
        friendlyMessage = '头像文件过大，请选择 5MB 以下的图片'
      } else if (rawMessage) {
        friendlyMessage = rawMessage
      }
      setAvatarFeedback({ type: 'error', text: friendlyMessage })
      message.error(friendlyMessage)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleAvatarBeforeUpload = async (file) => {
    await uploadAvatarFile(file)
    return false
  }

  const profileItems = [
    {
      key: 'avatar',
      label: '头像',
      children: (
        <Space size="middle">
          <Avatar size={64} src={user.user_metadata?.avatar_url}>
            {(user.email || 'U')[0].toUpperCase()}
          </Avatar>
          <Upload
            showUploadList={false}
            accept="image/*"
            beforeUpload={handleAvatarBeforeUpload}
            disabled={avatarUploading}
          >
            <Button icon={<UploadOutlined />} loading={avatarUploading}>
              {avatarUploading ? '上传中...' : '更换头像'}
            </Button>
          </Upload>
          {avatarFeedback && (
            <Typography.Text type={avatarFeedback.type === 'error' ? 'danger' : 'success'}>
              {avatarFeedback.text}
            </Typography.Text>
          )}
        </Space>
      )
    },
    { key: 'email', label: '邮箱', children: user.email },
    { key: 'name', label: '姓名', children: user.user_metadata?.name || '未填写' },
    { key: 'last', label: '上次登录', children: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '暂无记录' }
  ]

  return (
    <Card title="个人资料" style={{ maxWidth: 720, margin: '0 auto' }}>
      <Descriptions bordered column={1} items={profileItems} />

      <Divider />
      <Typography.Title level={5}>更新基本信息</Typography.Title>
      <Form
        layout="vertical"
        form={profileForm}
        onFinish={handleProfileUpdate}
        requiredMark={false}
        style={{ maxWidth: 360 }}
      >
        <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
          <Input placeholder="请输入姓名" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          保存
        </Button>
      </Form>

      <Divider />
      <Typography.Title level={5}>修改密码</Typography.Title>
      <Form
        layout="vertical"
        form={passwordForm}
        onFinish={handlePasswordUpdate}
        requiredMark={false}
        style={{ maxWidth: 360 }}
      >
        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度至少6位' }
          ]}
        >
          <Input.Password placeholder="请输入新密码" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="确认新密码"
          name="confirmNewPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              }
            })
          ]}
        >
          <Input.Password placeholder="请再次输入新密码" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          更新密码
        </Button>
      </Form>
    </Card>
  )
}

