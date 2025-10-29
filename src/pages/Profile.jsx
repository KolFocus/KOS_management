import React from 'react'
import { Card, Descriptions } from 'antd'

export default function Profile() {
  return (
    <Card title="个人资料">
      <Descriptions bordered column={1} items={[
        { key: '1', label: '用户名', children: '北熊' },
        { key: '2', label: '角色', children: '管理员' }
      ]} />
    </Card>
  )
}


