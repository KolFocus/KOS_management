import React from 'react'
import { Card, DatePicker, Space, Statistic, Row, Col } from 'antd'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function RetailAnalysis() {
  const [range, setRange] = React.useState([dayjs().startOf('week'), dayjs().endOf('week')])
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="零售分析">
        <Space>
          <span>时间范围</span>
          <RangePicker value={range} onChange={setRange} picker="week" />
        </Space>
      </Card>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="发布笔记数" value={101} /></Card></Col>
        <Col span={6}><Card><Statistic title="投广笔记数" value={69} /></Card></Col>
        <Col span={6}><Card><Statistic title="企微留资数" value={107} /></Card></Col>
        <Col span={6}><Card><Statistic title="期间成交额" value={348200} prefix="¥" /></Card></Col>
      </Row>
    </Space>
  )
}


