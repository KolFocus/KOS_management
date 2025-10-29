import React, { useState, useEffect } from 'react'
import { 
  Card, 
  DatePicker, 
  Space, 
  Button, 
  Table, 
  Pagination,
  Row, 
  Col,
  Tooltip,
  message
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

export default function RetailAnalysis() {
  const [weekRange, setWeekRange] = useState([
    dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'),
    dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD')
  ])
  
  const [storePage, setStorePage] = useState(1)
  const [notePage, setNotePage] = useState(1)

  // KPI数据
  const [kpis, setKpis] = useState([
    { key: 'accounts', title: 'Piloting Account', subtitle: '当前KOSA账号数', value: 23 },
    { key: 'paidAccounts', title: 'Account with Paid Promo', subtitle: '投广账号总数', value: 20 },
    { key: 'notes', title: 'Notes Published', subtitle: '发布笔记数', value: 101 },
    { key: 'paidNotes', title: 'Notes with Paid Promo', subtitle: '投广笔记数', value: 69 },
    { key: 'engagement', title: 'Engagement', subtitle: '笔记总互动数', value: '6,337' },
    { key: 'paidEngagement', title: 'Engagement from Paid', subtitle: '投广带来的互动量', value: 133 },
    { key: 'chats', title: 'Chats Initiated', subtitle: '私信进线数', value: 582 },
    { key: 'inquiries', title: 'Inquiries Received', subtitle: '私信开口数', value: 463 },
    { key: 'wecom', title: 'WeCom Recruitment', subtitle: '企微留资数', value: 107 },
    { key: 'efficiency', title: 'WeCom Recruitment Efficiency', subtitle: '企微留资率', value: '18.39%' },
    { key: 'cpr', title: 'CPR', subtitle: '企微留资成本', value: '¥65.87' },
    { key: 'turnover', title: 'Turnover', subtitle: '期间成交额', value: '¥348,200' }
  ])

  // 门店数据
  const [storeData] = useState([
    { store: 'A Ada Liu', code: 'MNDJ', notes: 2, engagement: 12, inquiries: 15, wecom: 22, turnover: '¥117,660' },
    { store: 'G Guanguan', code: 'MQT', notes: 15, engagement: 17, inquiries: 6, wecom: 21, turnover: '¥59,780' },
    { store: 'V Vanna Xue', code: 'MNDJ', notes: 6, engagement: 7, inquiries: 4, wecom: 7, turnover: '¥57,560' },
    { store: 'B Bonnie Luo', code: 'MZD', notes: 10, engagement: 15, inquiries: 4, wecom: 15, turnover: '¥51,700' },
    { store: 'S Sylvia Ma', code: 'MNDJ', notes: 8, engagement: 5, inquiries: 6, wecom: 0, turnover: '¥50,570' },
    { store: 'A Aoki Li', code: 'MCQM', notes: 10, engagement: 14, inquiries: 7, wecom: 12, turnover: '¥35,460' },
    { store: 'A Amy Fan', code: 'MHMC', notes: 2, engagement: 13, inquiries: 7, wecom: 10, turnover: '¥32,450' },
    { store: 'S Summer Wang', code: 'MBTK', notes: 5, engagement: 12, inquiries: 4, wecom: 8, turnover: '¥30,950' },
    { store: 'E Eddie Yuan', code: 'MJC', notes: 6, engagement: 14, inquiries: 5, wecom: 10, turnover: '¥28,360' },
    { store: 'A Adeline Lei', code: 'MCS', notes: 17, engagement: 19, inquiries: 7, wecom: 39, turnover: '¥18,990' },
    { store: 'X Xuser', code: 'MNDJ', notes: 3, engagement: 8, inquiries: 3, wecom: 5, turnover: '¥10,000' },
    { store: 'Y Yuser', code: 'MQT', notes: 4, engagement: 6, inquiries: 2, wecom: 3, turnover: '¥8,800' }
  ])

  // 笔记数据
  const [noteData] = useState([
    { note: 'A', link: 'https://example.com', store: 'Linda Luo', cost: 0, engagement: 0, cpe: '-', inquiries: 0, inquiryCost: '-', summary: '真人试穿展示单品多功能性与高级感。' },
    { note: 'B', link: 'https://example.com', store: 'Bonnie Luo', cost: 0, engagement: 0, cpe: '-', inquiries: 0, inquiryCost: '-', summary: '穿搭分享叩脑筋时尚性与个人风格' },
    { note: 'C', link: 'https://example.com', store: 'Aoki Li', cost: 0, engagement: 0, cpe: '-', inquiries: 0, inquiryCost: '-', summary: '极简穿搭等韩版元素，突出品质时尚感。' },
    { note: 'D', link: 'https://example.com', store: 'Test User 1', cost: 100, engagement: 50, cpe: 2.0, inquiries: 5, inquiryCost: 20.0, summary: '测试笔记内容1测试笔记内容1测试笔记内容1测试笔记内容1测试笔记内容1测试笔记内容1' },
    { note: 'E', link: 'https://example.com', store: 'Test User 2', cost: 150, engagement: 75, cpe: 2.0, inquiries: 8, inquiryCost: 18.75, summary: '测试笔记内容2' },
    { note: 'F', link: 'https://example.com', store: 'Test User 3', cost: 200, engagement: 100, cpe: 2.0, inquiries: 10, inquiryCost: 20.0, summary: '测试笔记内容3' },
    { note: 'G', link: 'https://example.com', store: 'Test User 4', cost: 120, engagement: 60, cpe: 2.0, inquiries: 6, inquiryCost: 20.0, summary: '测试笔记内容4' },
    { note: 'H', link: 'https://example.com', store: 'Test User 5', cost: 180, engagement: 90, cpe: 2.0, inquiries: 9, inquiryCost: 20.0, summary: '测试笔记内容5' },
    { note: 'I', link: 'https://example.com', store: 'Test User 6', cost: 160, engagement: 80, cpe: 2.0, inquiries: 8, inquiryCost: 20.0, summary: '测试笔记内容6' },
    { note: 'J', link: 'https://example.com', store: 'Test User 7', cost: 140, engagement: 70, cpe: 2.0, inquiries: 7, inquiryCost: 20.0, summary: '测试笔记内容7' },
    { note: 'K', link: 'https://example.com', store: 'User 8', cost: 80, engagement: 40, cpe: 2.0, inquiries: 4, inquiryCost: 20.0, summary: '测试笔记内容8' },
    { note: 'L', link: 'https://example.com', store: 'User 9', cost: 60, engagement: 30, cpe: 2.0, inquiries: 3, inquiryCost: 20.0, summary: '测试笔记内容9' }
  ])

  // 处理周范围变化
  const handleWeekRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      const startWeek = dayjs(dates[0]).startOf('week').add(1, 'day')
      const endWeek = dayjs(dates[1]).startOf('week').add(1, 'day').add(6, 'day')
      setWeekRange([startWeek.format('YYYY-MM-DD'), endWeek.format('YYYY-MM-DD')])
    }
  }

  // 刷新模拟数据
  const refreshMockData = () => {
    setKpis(prevKpis => 
      prevKpis.map(kpi => ({
        ...kpi,
        value: typeof kpi.value === 'number' ? kpi.value + Math.round(Math.random() * 5 - 2) : kpi.value
      }))
    )
    message.success('数据已刷新')
  }

  // 打开链接
  const openLink = (url) => {
    window.open(url, '_blank')
  }

  // 门店表格列配置
  const storeColumns = [
    { title: 'Store Code / 所属店铺', dataIndex: 'store', key: 'store', width: 180 },
    { title: 'Notes Published / 发布笔记数', dataIndex: 'notes', key: 'notes', width: 180 },
    { title: 'Engagement / 笔记互动量', dataIndex: 'engagement', key: 'engagement', width: 160 },
    { title: 'Inquires Received / 私信开口数', dataIndex: 'inquiries', key: 'inquiries', width: 180 },
    { title: 'WeCom Recruitment / 企微留资数', dataIndex: 'wecom', key: 'wecom', width: 180 },
    { title: 'Turnover / 期间成交量', dataIndex: 'turnover', key: 'turnover', width: 180 }
  ]

  // 笔记表格列配置
  const noteColumns = [
    { title: 'Note / 笔记', dataIndex: 'note', key: 'note', width: 110, onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
    { 
      title: 'Note Link / 笔记链接', 
      key: 'link', 
      width: 160,
      render: (_, record) => (
        <Button type="primary" size="small" onClick={() => openLink(record.link)}>
          Link
        </Button>
      )
    },
    { title: 'Store Code / 所属账号', dataIndex: 'store', key: 'store', width: 180, onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
    { title: 'Cost / 投放消耗', dataIndex: 'cost', key: 'cost', width: 150, onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
    { title: 'Engagement / 笔记互动量', dataIndex: 'engagement', key: 'engagement', width: 180, onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
    { title: 'CPE / 互动成本', dataIndex: 'cpe', key: 'cpe', width: 150, onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
    { title: 'Inquires Received / 私信开口数', dataIndex: 'inquiries', key: 'inquiries', width: 200, onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
    { title: '私信开口成本', dataIndex: 'inquiryCost', key: 'inquiryCost', width: 160, onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }) },
    {
      title: '笔记内容总结',
      dataIndex: 'summary',
      key: 'summary',
      width: 260,
      onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
      ellipsis: { showTitle: false },
      render: (text) => {
        const content = (
          <span style={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
            {text}
          </span>
        )
        const shouldTooltip = typeof text === 'string' && text.length > 28
        return shouldTooltip ? (
          <Tooltip placement="topLeft" title={text}>{content}</Tooltip>
        ) : content
      }
    }
  ]

  return (
    <div style={{ padding: '8px' }}>
      {/* 头部卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>零售分析</h2>
            <p style={{ margin: 0, color: '#909399', fontSize: '13px', marginTop: '4px' }}>
              Retail Analysis Dashboard（模拟数据）
            </p>
          </div>
          <Space>
            <span style={{ color: '#606266' }}>时间范围</span>
            <RangePicker
              picker="week"
              value={[dayjs(weekRange[0]), dayjs(weekRange[1])]}
              onChange={handleWeekRangeChange}
              allowClear={false}
              format="gggg年第ww周"
            />
            <Button type="primary" icon={<ReloadOutlined />} onClick={refreshMockData}>
              刷新模拟数据
            </Button>
          </Space>
        </div>
      </Card>

      {/* KPI统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {kpis.map(kpi => (
          <Col span={6} key={kpi.key}>
            <Card style={{ textAlign: 'left' }}>
              <div style={{ color: '#606266', fontSize: '13px' }}>{kpi.title}</div>
              <div style={{ color: '#909399', fontSize: '12px' }}>{kpi.subtitle}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px' }}>{kpi.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 门店表现表格 */}
      <Card style={{ marginBottom: 16 }}>
        <h3>零售表现（按达人） / Retail Performance (by Creator)</h3>
        <Table
          dataSource={storeData.slice((storePage - 1) * 10, storePage * 10)}
          columns={storeColumns}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Pagination
            current={storePage}
            total={storeData.length}
            pageSize={10}
            showSizeChanger={false}
            onChange={setStorePage}
          />
        </div>
      </Card>

      {/* 笔记表现表格 */}
      <Card>
        <h3>零售表现（按笔记） / Retail Performance (by Note)</h3>
        <Table
          dataSource={noteData.slice((notePage - 1) * 10, notePage * 10)}
          columns={noteColumns}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Pagination
            current={notePage}
            total={noteData.length}
            pageSize={10}
            showSizeChanger={false}
            onChange={setNotePage}
          />
        </div>
      </Card>
    </div>
  )
}


