import React from 'react'
import { Card, Table, Button } from 'antd'

export default function SalesData() {
  return (
    <Card title="KOS销售数据管理" extra={<Button type="primary">新增销售数据</Button>}>
      <Table
        rowKey="id"
        columns={[
          { title: '品牌', dataIndex: 'brand' },
          { title: '日期', dataIndex: 'date' },
          { title: '员工', dataIndex: 'staff' }
        ]}
        dataSource={[]}
      />
    </Card>
  )
}


