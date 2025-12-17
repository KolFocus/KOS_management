import React from 'react'
import { Card, Form, Input, Button, Result, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../utils/supabase'

const parseHashParams = () => {
  const hash = window.location.hash || ''
  return new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const updatePassword = useAuthStore(state => state.updatePassword)
  const [status, setStatus] = React.useState('checking') // checking | ready | success | error
  const [message, setMessage] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const handleAuthRedirect = async () => {
      const params = parseHashParams()
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      if (error) {
        setStatus('error')
        setMessage(decodeURIComponent(errorDescription || '链接无效或已过期，请重新发送重置邮件。'))
        return
      }

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (sessionError) {
          setStatus('error')
          setMessage(sessionError.message || '链接校验失败，请重新发送重置邮件。')
          return
        }
      }

      const { data: sessionData, error: sessionCheckError } = await supabase.auth.getSession()

      if (sessionCheckError) {
        setStatus('error')
        setMessage(sessionCheckError.message || '无法获取登录状态，请重试。')
        return
      }

      if (!sessionData?.session) {
        setStatus('error')
        setMessage('链接无效或已过期，请重新发送重置邮件。')
        return
      }

      setStatus('ready')
    }

    handleAuthRedirect()
  }, [])

  const handleSubmit = async ({ newPassword }) => {
    try {
      setLoading(true)
      await updatePassword(newPassword)
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || '密码更新失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (status === 'checking') {
      return (
        <Result
          title="正在验证重置链接..."
          subTitle="请稍候，该操作可能需要几秒钟。"
        />
      )
    }

    if (status === 'success') {
      return (
        <Result
          status="success"
          title="密码重置成功"
          subTitle="您可以使用新密码重新登录系统。"
          extra={[
            <Button type="primary" key="login" onClick={() => navigate('/login')}>
              返回登录
            </Button>
          ]}
        />
      )
    }

    if (status === 'error' && status !== 'ready') {
      return (
        <Result
          status="error"
          title="链接不可用"
          subTitle={message || '链接无效或已过期，请返回登录页重新发送重置邮件。'}
          extra={[
            <Button key="retry" onClick={() => navigate('/login')}>
              返回登录页
            </Button>
          ]}
        />
      )
    }

    return (
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Typography.Paragraph>
          请设置一个新的密码，长度至少 6 位，并妥善保管。
        </Typography.Paragraph>
        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度至少 6 位' }
          ]}
        >
          <Input.Password placeholder="请输入新密码" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="确认新密码"
          name="confirmPassword"
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
        <Button type="primary" htmlType="submit" block loading={loading}>
          提交
        </Button>
        <Button type="text" block style={{ marginTop: 8 }} onClick={() => navigate('/login')}>
          返回登录
        </Button>
      </Form>
    )
  }

  return (
    <Card
      title="重置密码"
      style={{
        width: '100%',
        maxWidth: 420,
        margin: 0,
        boxShadow: '0 24px 60px rgba(15, 64, 255, 0.12)'
      }}
    >
      {renderContent()}
    </Card>
  )
}


