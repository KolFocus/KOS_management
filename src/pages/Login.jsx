import React from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function Login() {
  const navigate = useNavigate()

  const onFinish = async (values) => {
    try {
      const { email, password } = values
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      message.success('登录成功')
      navigate('/')
    } catch (err) {
      message.error(err.message || '登录失败')
    }
  }

  return (
    <Card title="登录" style={{ maxWidth: 360, margin: '48px auto' }}>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
          <Input placeholder="you@example.com" />
        </Form.Item>
        <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password placeholder="••••••••" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>登录</Button>
      </Form>
    </Card>
  )
}


