import React from 'react'
import { Card, Form, Input, Button, Tabs, Alert, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = React.useState('login')
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()
  const login = useAuthStore(state => state.login)
  const register = useAuthStore(state => state.register)
  const loading = useAuthStore(state => state.loading)
  const authError = useAuthStore(state => state.authError)
  const clearError = useAuthStore(state => state.clearError)

  const handleLogin = async (values) => {
    try {
      await login(values)
      message.success('登录成功')
      loginForm.resetFields()
      navigate('/')
    } catch (error) {
      message.error(error.message || '登录失败')
    }
  }

  const handleRegister = async (values) => {
    try {
      await register(values)
      message.success('注册成功，请检查邮箱验证邮件')
      registerForm.resetFields()
      setActiveTab('login')
    } catch (error) {
      message.error(error.message || '注册失败')
    }
  }

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form layout="vertical" form={loginForm} onFinish={handleLogin} requiredMark={false}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input placeholder="you@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
      )
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form layout="vertical" form={registerForm} onFinish={handleRegister} requiredMark={false}>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input placeholder="you@example.com" autoComplete="email" />
          </Form.Item>
          <Form.Item label="姓名" name="name">
            <Input placeholder="请输入姓名（可选）" autoComplete="name" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入密码" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}
          >
            <Input.Password placeholder="请再次输入密码" autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            注册
          </Button>
        </Form>
      )
    }
  ]

  return (
    <Card
      title="账户中心"
      style={{
        width: '100%',
        maxWidth: 420,
        margin: 0,
        boxShadow: '0 24px 60px rgba(15, 64, 255, 0.12)'
      }}
    >
      {authError && (
        <Alert
          type="error"
          message={authError}
          showIcon
          closable
          onClose={clearError}
          style={{ marginBottom: 16 }}
        />
      )}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} destroyOnHide />
    </Card>
  )
}

