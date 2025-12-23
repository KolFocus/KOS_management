import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Table,
  Image,
  Row,
  Col,
  Statistic,
  message,
  Tag,
  Tooltip,
  ConfigProvider
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  LinkOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import { useBrandManagementStore } from '../stores/brandManagementStore'
import { PromotionDashboardAPI } from '../api/promotionDashboard'
import { exportToExcel } from '../utils/excel'

dayjs.extend(isoWeek)
dayjs.locale('zh-cn')

const { RangePicker } = DatePicker

const getLastWeekRange = () => ([
  dayjs().subtract(1, 'week').startOf('isoWeek'),
  dayjs().subtract(1, 'week').endOf('isoWeek')
])

const formatDate = (value) => (value ? dayjs(value).format('YYYY.MM.DD') : null)

const formatNumber = (num, fraction = 0) => {
  const n = Number(num)
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction
  })
}

const formatPercent = (num) => {
  const n = Number(num)
  if (!Number.isFinite(n)) return '-'
  return `${(n * 100).toFixed(2)}%`
}

export default function PromotionDashboard() {
  const { brands, platforms, loadBrands, loadPlatforms, getBrandOptions } = useBrandManagementStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [autoQueried, setAutoQueried] = useState(false)

  const setDefaultRanges = useCallback(() => {
    const [promotionStart, promotionEnd] = getLastWeekRange()
    const [noteStart, noteEnd] = getLastWeekRange()
    form.setFieldsValue({
      promotionRange: [promotionStart, promotionEnd],
      noteRange: [noteStart, noteEnd]
    })
  }, [form])

  useEffect(() => {
    loadBrands()
    loadPlatforms()
    setDefaultRanges()
  }, [loadBrands, loadPlatforms, setDefaultRanges])

  const brandOptions = useMemo(() => {
    return getBrandOptions().map(opt => ({
      label: opt.label,
      value: String(opt.value)
    }))
  }, [brands, getBrandOptions])

  useEffect(() => {
    const current = form.getFieldValue('brands') || []
    if (!current.length && brandOptions.length > 0) {
      form.setFieldsValue({ brands: [brandOptions[0].value] })
    }
  }, [brandOptions, form])

  const buildIdList = useCallback((selectedBrandIds = []) => {
    const ids = new Set((selectedBrandIds || []).map(id => String(id)))
    platforms
      .filter(p => ids.has(String(p.品牌ID)))
      .forEach(p => {
        if (p.平台ID) ids.add(String(p.平台ID))
      })
    return Array.from(ids)
  }, [platforms])

  const handleQuery = useCallback(async (silent = false) => {
    try {
      const values = await form.validateFields()
      const { brands: selectedBrandIds = [], promotionRange, noteRange } = values

      if (!promotionRange || promotionRange.length !== 2 || !noteRange || noteRange.length !== 2) {
        message.warning('请完整选择推广日期与笔记日期范围')
        return
      }

      if (!selectedBrandIds || selectedBrandIds.length === 0) {
        message.warning('请选择品牌')
        return
      }

      const idList = buildIdList(selectedBrandIds)
      if (idList.length === 0) {
        message.warning('未找到品牌的关联平台ID，请先在品牌管理中维护')
        return
      }

      const params = {
        brandIds: idList,
        promotionStart: formatDate(promotionRange[0]),
        promotionEnd: formatDate(promotionRange[1]),
        noteStart: formatDate(noteRange[0]),
        noteEnd: formatDate(noteRange[1])
      }

      setLoading(true)
      const res = await PromotionDashboardAPI.fetchPromotionDashboard(params)
      setData(Array.isArray(res) ? res : [])
      setPage(1)
      if (!silent) {
        message.success('数据已更新')
      }
      setAutoQueried(true)
    } catch (err) {
      if (err?.error?.message) {
        message.error(err.error.message)
      } else {
        message.error(err?.message || '获取推广数据失败')
      }
    } finally {
      setLoading(false)
    }
  }, [buildIdList, form])

  useEffect(() => {
    if (!autoQueried && brandOptions.length > 0) {
      handleQuery(true)
    }
  }, [autoQueried, brandOptions, handleQuery])

  const handleReset = () => {
    const defaultBrand = brandOptions[0]?.value ? [brandOptions[0].value] : []
    form.resetFields()
    setDefaultRanges()
    form.setFieldsValue({
      brands: defaultBrand
    })
    setPage(1)
    setPageSize(20)
    handleQuery(true)
  }

  const tableData = useMemo(() => {
    return (Array.isArray(data) ? data : []).map((item, idx) => {
      const engagementRateRaw = item?.['互动率_out']
      return {
        key: item?.note_id_out || `${item?.note_url_out || 'row'}-${idx}`,
        user: item?.['所属用户_out'] || '-',
        store: item?.['所属店铺_out'] || '-',
        channel: item?.['渠道_out'] || '-',
        noteUrl: item?.note_url_out || '',
        cover: item?.cover_image_out || '',
        noteId: item?.note_id_out || '-',
        publishDate: item?.['发布日期_out'] || '-',
        engagement: item?.['互动量_out'] ?? '-',
        readCount: item?.['预估阅读数_out'] ?? '-',
        engagementRateValue: Number(engagementRateRaw),
        cost: item?.['笔记投广消耗_out'] ?? '-'
      }
    })
  }, [data])

  const summary = useMemo(() => {
    const totalEngagement = tableData.reduce((sum, row) => sum + (Number(row.engagement) || 0), 0)
    const totalRead = tableData.reduce((sum, row) => sum + (Number(row.readCount) || 0), 0)
    const totalCost = tableData.reduce((sum, row) => sum + (Number(row.cost) || 0), 0)
    const avgRate = totalRead > 0 ? totalEngagement / totalRead : 0
    return { totalEngagement, totalRead, totalCost, avgRate }
  }, [tableData])

  const columns = [
    { title: '所属用户', dataIndex: 'user', key: 'user', width: 140, ellipsis: true },
    { title: '所属店铺', dataIndex: 'store', key: 'store', width: 160, ellipsis: true },
    { title: '渠道', dataIndex: 'channel', key: 'channel', width: 120, render: (text) => text ? <Tag color="blue">{text}</Tag> : '-' },
    { title: '笔记链接', dataIndex: 'noteUrl', key: 'noteUrl', width: 120, render: (url) => url ? (
      <Button type="link" icon={<LinkOutlined />} size="small" onClick={() => window.open(url, '_blank')}>
        打开
      </Button>
    ) : '-' },
    { title: '封面图', dataIndex: 'cover', key: 'cover', width: 110, render: (url) => url ? (
      <Image
        width={72}
        height={72}
        src={url}
        style={{ objectFit: 'cover', borderRadius: 6 }}
        placeholder
      />
    ) : <div style={{ color: '#999' }}>无</div> },
    { title: '笔记ID', dataIndex: 'noteId', key: 'noteId', width: 180, ellipsis: true },
    { title: '发布日期', dataIndex: 'publishDate', key: 'publishDate', width: 140 },
    { title: '互动量', dataIndex: 'engagement', key: 'engagement', width: 120, sorter: (a, b) => (Number(a.engagement) || 0) - (Number(b.engagement) || 0), render: (val) => formatNumber(val) },
    { title: '预估阅读数', dataIndex: 'readCount', key: 'readCount', width: 140, sorter: (a, b) => (Number(a.readCount) || 0) - (Number(b.readCount) || 0), render: (val) => formatNumber(val) },
    { title: '互动率', dataIndex: 'engagementRateValue', key: 'engagementRateValue', width: 120, sorter: (a, b) => (a.engagementRateValue || 0) - (b.engagementRateValue || 0), render: (val) => formatPercent(val) },
    { title: '笔记投广消耗', dataIndex: 'cost', key: 'cost', width: 150, sorter: (a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0), render: (val) => formatNumber(val, 2) }
  ]

  const paginationConfig = {
    current: page,
    pageSize,
    total: tableData.length,
    showSizeChanger: true,
    pageSizeOptions: ['20', '50', '100'],
    onChange: (p, ps) => {
      setPage(p)
      setPageSize(ps)
    },
    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`
  }

  const handleExport = () => {
    if (!tableData.length) {
      message.warning('暂无数据可导出')
      return
    }
    try {
      const rows = tableData.map(row => ({
        所属用户: row.user,
        所属店铺: row.store,
        渠道: row.channel,
        笔记链接: row.noteUrl,
        封面图: row.cover,
        笔记ID: row.noteId,
        发布日期: row.publishDate,
        互动量: Number(row.engagement) || 0,
        预估阅读数: Number(row.readCount) || 0,
        '互动率(%)': row.engagementRateValue !== undefined && row.engagementRateValue !== null
          ? Number(row.engagementRateValue * 100).toFixed(2)
          : '',
        笔记投广消耗: Number(row.cost) || 0
      }))
      exportToExcel(rows, 'KOS推广筛选')
      message.success('导出成功')
    } catch (err) {
      message.error(err?.message || '导出失败')
    }
  }

  return (
    <ConfigProvider locale={zhCN}>
    <div style={{ padding: 16 }}>
      <Card
        title={(
          <Space>
            <FilterOutlined />
            <span>KOS 推广筛选</span>
          </Space>
        )}
        style={{ marginBottom: 12 }}
      >
        <Form
          layout="inline"
          form={form}
          onFinish={() => handleQuery(false)}
          requiredMark={false}
          style={{ rowGap: 12 }}
        >
          <Form.Item
            name="brands"
            label="品牌/平台"
            rules={[{ required: true, message: '请选择品牌' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择品牌（自动带出平台ID）"
              style={{ minWidth: 260 }}
              options={brandOptions}
              allowClear
              maxTagCount="responsive"
            />
          </Form.Item>
          <Form.Item
            name="promotionRange"
            label="推广日期"
            rules={[{ required: true, message: '请选择推广日期范围' }]}
          >
            <RangePicker
              allowClear={false}
              format="YYYY.MM.DD"
            />
          </Form.Item>
          <Form.Item
            name="noteRange"
            label="笔记日期"
            rules={[{ required: true, message: '请选择笔记日期范围' }]}
          >
            <RangePicker
              allowClear={false}
              format="YYYY.MM.DD"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
                查询
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />} disabled={loading}>
                重置
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={loading}>
                导出
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={12} style={{ marginBottom: 12 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总互动量" value={formatNumber(summary.totalEngagement)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="预估阅读数" value={formatNumber(summary.totalRead)} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="平均互动率" value={summary.avgRate ? formatPercent(summary.avgRate) : '-'} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="笔记投广消耗" value={formatNumber(summary.totalCost, 2)} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={paginationConfig}
          scroll={{ x: 1300 }}
        />
        {!tableData.length && (
          <div style={{ textAlign: 'center', padding: 16, color: '#888' }}>
            <Tooltip title="尝试调整日期或品牌筛选">
              暂无数据
            </Tooltip>
          </div>
        )}
      </Card>
    </div>
    </ConfigProvider>
  )
}


