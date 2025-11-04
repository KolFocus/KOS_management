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
  message,
  Spin,
  Select,
  Avatar,
  Image,
  Segmented
} from 'antd'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import isoWeek from 'dayjs/plugin/isoWeek'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekYear from 'dayjs/plugin/weekYear'
import { RetailDashboardAPI } from '../api/retailDashboard'
import { supabase, TABLES } from '../utils/supabase'
import { getCurrentUserId } from '../utils/userIsolation'
import { brandManagementAPI } from '../api/brandManagement'

dayjs.extend(isoWeek)
dayjs.extend(weekOfYear)
dayjs.extend(weekYear)
dayjs.locale('zh-cn')

const { RangePicker } = DatePicker

export default function RetailAnalysis() {
  const defaultChannel = '品牌商'
  const fixedChannels = ['品牌商', '经销商']
  const defaultKpis = [
    { key: 'accounts', title: 'Piloting Account', subtitle: '当前KOSA账号数', value: '-' },
    { key: 'paidAccounts', title: 'Account with Paid Promo', subtitle: '投广账号总数', value: '-' },
    { key: 'notes', title: 'Notes Published', subtitle: '发布笔记数', value: '-' },
    { key: 'paidNotes', title: 'Notes with Paid Promo', subtitle: '投广笔记数', value: '-' },
    { key: 'engagement', title: 'Engagement', subtitle: '笔记总互动数', value: '-' },
    { key: 'paidEngagement', title: 'Engagement from Paid', subtitle: '投广带来的互动量', value: '-' },
    { key: 'chats', title: 'Chats Initiated', subtitle: '私信进线数', value: '-' },
    { key: 'inquiries', title: 'Inquiries Received', subtitle: '私信开口数', value: '-' },
    { key: 'wecom', title: 'WeCom Recruitment', subtitle: '企微留资数', value: '-' },
    { key: 'efficiency', title: 'WeCom Recruitment Efficiency', subtitle: '企微留资率', value: '-' },
    { key: 'cpr', title: 'CPR', subtitle: '企微留资成本', value: '-' },
    { key: 'turnover', title: 'Turnover', subtitle: '期间成交额', value: '-' }
  ]

  const [weekRange, setWeekRange] = useState([
    dayjs().subtract(1,'week').startOf('isoWeek').format('YYYY-MM-DD'),
    dayjs().subtract(1,'week').endOf('isoWeek').format('YYYY-MM-DD')
  ])
  
  const [storePage, setStorePage] = useState(1)
  const [notePage, setNotePage] = useState(1)

  // KPI数据
  const [kpis, setKpis] = useState(defaultKpis)
  const [loading, setLoading] = useState(false)
  const [channel, setChannel] = useState(defaultChannel)
  const [channelOptions, setChannelOptions] = useState([])
  const [brandId, setBrandId] = useState('')
  const [brandOptions, setBrandOptions] = useState([])
  // KPI报表范围：所有/投放
  const [reportScope, setReportScope] = useState('all') // 'all' | 'paid'

  // 门店数据（达人表现数据）
  const [storeData, setStoreData] = useState([])
  const [storeDataLoading, setStoreDataLoading] = useState(false)

  // 笔记数据（笔记表现数据）
  const [noteData, setNoteData] = useState([])
  const [noteDataLoading, setNoteDataLoading] = useState(false)

  // 处理周范围变化（不自动触发查询）
  const handleWeekRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      const startWeek = dayjs(dates[0]).startOf('isoWeek')
      const endWeek = dayjs(dates[1]).endOf('isoWeek')
      setWeekRange([startWeek.format('YYYY-MM-DD'), endWeek.format('YYYY-MM-DD')])
    }
  }

  const fetchKpis = async (overrideScope) => {
    try {
      setLoading(true)
      const params = {
        startDate: weekRange[0],
        endDate: weekRange[1],
        channel: channel || '',
        brandId: brandId || '',
        reportScope: overrideScope || reportScope
      }
      const { kpis } = await RetailDashboardAPI.getKpis(params)
      setKpis(Array.isArray(kpis) && kpis.length === 12 ? kpis : defaultKpis)
    } catch (err) {
      console.error(err)
      message.error(err?.message || '获取仪表盘数据失败')
      setKpis(defaultKpis)
    } finally {
      setLoading(false)
    }
  }

  // 获取达人表现数据
  const fetchCreatorData = async () => {
    if (!brandId) {
      message.warning('请先选择品牌')
      return
    }
    try {
      setStoreDataLoading(true)
      const params = {
        startDate: weekRange[0],
        endDate: weekRange[1],
        channel: channel || '品牌商',
        brandId: brandId
      }
      const data = await RetailDashboardAPI.getCreatorPerformance(params)
      setStoreData(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      message.error(err?.message || '获取达人表现数据失败')
      setStoreData([])
    } finally {
      setStoreDataLoading(false)
    }
  }

  // 获取笔记表现数据
  const fetchNoteData = async () => {
    if (!brandId) {
      return // 不显示警告，因为可能达人数据已经提示过了
    }
    try {
      setNoteDataLoading(true)
      const params = {
        startDate: weekRange[0],
        endDate: weekRange[1],
        channel: channel || '品牌商',
        brandId: brandId,
        costMin: 0
      }
      const data = await RetailDashboardAPI.getNotePerformance(params)
      setNoteData(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      message.error(err?.message || '获取笔记表现数据失败')
      setNoteData([])
    } finally {
      setNoteDataLoading(false)
    }
  }

  const fetchChannels = async () => {
    try {
      const list = await RetailDashboardAPI.getChannels({ brandId: brandId || '' })
      const unique = Array.from(new Set(list))
      const merged = Array.from(new Set([ ...fixedChannels, ...unique ]))
      setChannelOptions(merged)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchBrands = async () => {
    try {
      // 优先从 用户品牌表 读取（更全），按排序升序
      const { data: apiBrands, error: brandsErr } = await brandManagementAPI.getBrands()
      let options = []
      if (!brandsErr && Array.isArray(apiBrands)) {
        options = (apiBrands || []).map(b => ({ label: b.品牌, value: String(b.ID), 排序: b.排序 ?? 999999 }))
      }

      // 若用户品牌表无数据，则回退从 KOS_LIST 推导
      if (options.length === 0) {
        const userId = await getCurrentUserId()
        if (userId) {
          const { data, error } = await supabase
            .from(TABLES.KOS_LIST)
            .select('品牌, 品牌ID, 排序')
            .eq('supabase_user_id', userId)
            .not('品牌ID', 'is', null)
            .order('排序', { ascending: true, nullsLast: true })
          if (!error) {
            const map = new Map()
            for (const row of data || []) {
              const id = String(row.品牌ID)
              if (!map.has(id)) {
                map.set(id, { label: row.品牌, value: id, 排序: row.排序 ?? 999999 })
              }
            }
            options = Array.from(map.values())
          }
        }
      }

      options.sort((a, b) => Number(a.排序) - Number(b.排序))
      setBrandOptions(options)
      // 若当前品牌未选或已不在列表中，则默认选第一项
      const exists = options.some(o => o.value === brandId)
      if ((!brandId || !exists) && options.length > 0) {
        setBrandId(options[0].value)
      }
    } catch (err) {
      console.error('获取品牌失败', err)
    }
  }

  // 首次加载品牌；当品牌变化时刷新渠道选项（不触发查询）
  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    fetchChannels()
  }, [brandId])

  // 首次加载：当品牌就绪后自动刷新一次（默认上周已在初始 weekRange 设置）
  useEffect(() => {
    if (brandId) {
      fetchKpis()
      fetchCreatorData()
      fetchNoteData()
    }
    // 仅在 brandId 变为有效时触发一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId])

  // 打开链接
  const openLink = (url) => {
    window.open(url, '_blank')
  }

  // 门店表格列配置
  const storeColumns = [
    { 
      title: 'Creator / 达人', 
      dataIndex: 'creatorName', 
      key: 'creatorName', 
      width: 180,
      render: (text, record) => (
        <Space>
          <Avatar size={32} src={record.avatar || null}>
            {text?.[0]?.toUpperCase()}
          </Avatar>
          <span>{text}</span>
        </Space>
      )
    },
    { 
      title: 'Store Code / 所属店铺', 
      dataIndex: 'storeCode', 
      key: 'storeCode', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'Notes Published / 发布笔记数', 
      dataIndex: 'notes', 
      key: 'notes', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'Engagement / 笔记互动量', 
      dataIndex: 'engagement', 
      key: 'engagement', 
      width: 160,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'Inquires Received / 私信开口数', 
      dataIndex: 'inquiries', 
      key: 'inquiries', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'WeCom Recruitment / 企微留资数', 
      dataIndex: 'wecom', 
      key: 'wecom', 
      width: 200,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'Turnover / 期间成交量', 
      dataIndex: 'turnover', 
      key: 'turnover', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    }
  ]

  // 笔记表格列配置
  const noteColumns = [
    { 
      title: 'Note / 笔记', 
      dataIndex: 'coverImage', 
      key: 'note', 
      width: 110,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } }),
      render: (imageUrl, record) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Image
            width={80}
            height={80}
            src={imageUrl || 'https://via.placeholder.com/80x80?text=No+Image'}
            alt={record.noteId || 'Note'}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3E暂无图片%3C/text%3E%3C/svg%3E"
            preview={false}
          />
        </div>
      )
    },
    { 
      title: 'Note Link / 笔记链接', 
      key: 'link', 
      width: 160,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } }),
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button type="primary" size="small" onClick={() => openLink(record.link)}>
          Link
        </Button>
        </div>
      )
    },
    { 
      title: 'Store Code / 所属账号', 
      dataIndex: 'store', 
      key: 'store', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: 'Cost / 投放消耗', 
      dataIndex: 'cost', 
      key: 'cost', 
      width: 150,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: 'Engagement / 笔记互动量', 
      dataIndex: 'engagement', 
      key: 'engagement', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: 'CPE / 互动成本', 
      dataIndex: 'cpe', 
      key: 'cpe', 
      width: 150,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: 'Inquires Received / 私信开口数', 
      dataIndex: 'inquiries', 
      key: 'inquiries', 
      width: 210,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: '私信开口成本', 
      dataIndex: 'inquiryCost', 
      key: 'inquiryCost', 
      width: 160,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    {
      title: '笔记内容总结',
      dataIndex: 'summary',
      key: 'summary',
      width: 260,
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } }),
      ellipsis: { showTitle: false },
      render: (text) => {
        const textStr = text || ''
        const content = (
          <span style={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
            {textStr}
          </span>
        )
        // 如果文本有内容，始终显示Tooltip以便查看完整内容
        if (textStr && textStr.trim().length > 0) {
          return (
            <Tooltip placement="topLeft" title={textStr}>{content}</Tooltip>
          )
        }
        return content
      }
    }
  ]

  return (
    <ConfigProvider locale={zhCN}>
    <div style={{ padding: '8px' }}>
      <style>{`
        .ant-table-tbody .top3-row > td {
          background-color: #fffbe6 !important;
        }
        .ant-table-tbody .top3-row:hover > td {
          background-color: #fff9d6 !important;
        }
      `}</style>
      {/* 头部卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>KOS分析</h2>
            <p style={{ margin: 0, color: '#909399', fontSize: '13px', marginTop: '4px' }}>
              Retail Analysis Dashboard（模拟数据）
            </p>
          </div>
          <Space>
            <Select
              allowClear={false}
              value={brandId || undefined}
              onChange={(val) => setBrandId(val || '')}
              placeholder="品牌（默认：排序为1）"
              options={brandOptions}
              style={{ width: 180 }}
            />
            <Select
              allowClear={false}
              value={channel || undefined}
              onChange={(val) => setChannel(val || '')}
              placeholder="渠道（全部）"
              options={channelOptions.map(c => ({ label: c, value: c }))}
              style={{ width: 156 }}
            />
            <RangePicker
              picker="week"
              value={[dayjs(weekRange[0]), dayjs(weekRange[1])]}
              onChange={handleWeekRangeChange}
              allowClear={false}
              format={(value) => {
                if (!value) return ''
                // 直接使用传入的value（已经是周的第一天或最后一天）
                return dayjs(value).format('YYYY-MM-DD')
              }}
            />
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={async () => {
                await Promise.all([fetchKpis(), fetchCreatorData(), fetchNoteData()])
              }} 
              loading={loading || storeDataLoading || noteDataLoading} 
              disabled={loading || storeDataLoading || noteDataLoading}
            >
              刷新数据
            </Button>
          </Space>
        </div>
      </Card>

      {/* KPI范围切换与统计卡片 */}
      <div style={{ marginBottom: 8 }}>
        <Segmented
          value={reportScope}
          onChange={(val) => { setReportScope(val); fetchKpis(val) }}
          options={[
            { label: '所有', value: 'all' },
            { label: '投放', value: 'paid' }
          ]}
        />
      </div>
      {/* KPI统计卡片 */}
      <Spin spinning={loading}>
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
      </Spin>

      {/* 门店表现表格 */}
      <Card style={{ marginBottom: 16 }}>
        <h3>零售表现（按达人） / Retail Performance (by Creator)</h3>
        <Spin spinning={storeDataLoading}>
        <Table
          dataSource={storeData.slice((storePage - 1) * 10, storePage * 10)}
          columns={storeColumns}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 8 }}
            rowClassName={(record) => record.isTop3 ? 'top3-row' : ''}
            rowKey={(record, index) => `${record.creatorName}-${record.storeCode}-${index}`}
            locale={{ emptyText: '暂无数据，请点击"刷新数据"按钮加载' }}
        />
        </Spin>
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
        <Spin spinning={noteDataLoading}>
        <Table
          dataSource={noteData.slice((notePage - 1) * 10, notePage * 10)}
          columns={noteColumns}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 8 }}
            rowKey={(record) => record.noteId || `${record.store}-${record.link}`}
            locale={{ emptyText: '暂无数据，请点击"刷新数据"按钮加载' }}
        />
        </Spin>
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
    </ConfigProvider>
  )
}


