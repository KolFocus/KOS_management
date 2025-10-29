import React from 'react'
import { Card, Form, Input, Button } from 'antd'

export default function Login() {
  return (
    <Card title="登录" style={{ maxWidth: 360, margin: '48px auto' }}>
      <Form layout="vertical">
        <Form.Item label="邮箱" name="email" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="密码" name="password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>登录</Button>
      </Form>
    </Card>
  )
}


