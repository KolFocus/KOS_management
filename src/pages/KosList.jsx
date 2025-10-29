import React from 'react'
import { Card, Table } from 'antd'

export default function KosList() {
  return (
    <Card title="KOS列表管理">
      <Table
        rowKey="id"
        columns={[
          { title: '昵称', dataIndex: 'name' },
          { title: '店铺', dataIndex: 'store' },
          { title: '渠道', dataIndex: 'channel' }
        ]}
        dataSource={[]}
      />
    </Card>
  )
}


