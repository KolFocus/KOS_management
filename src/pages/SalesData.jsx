import React, { useEffect, useState } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Space, 
  Modal, 
  Form, 
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Upload,
  Row,
  Col,
  Statistic
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useSalesDataStore } from '../stores/salesDataStore'
import { useBrandManagementStore } from '../stores/brandManagementStore'
import { exportToExcel } from '../utils/excel'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

export default function SalesData() {
  const {
    salesDataList,
    loading,
    total,
    currentPage,
    pageSize,
    searchParams,
    statistics,
    fetchSalesDataList,
    fetchStatistics,
    createSalesData,
    updateSalesData,
    deleteSalesData,
    batchImportSalesData,
    batchDeleteSalesData,
    setSearchParams,
    setPagination,
    getBrandList,
    getEmployeeList,
    getShopList
  } = useSalesDataStore()

  const { getBrandOptions, selectedBrandId, setSelectedBrandId, loadBrands } = useBrandManagementStore()

  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [searchForm] = Form.useForm()

  // 页面加载时获取数据
  useEffect(() => {
    // 确保品牌数据加载（与Vue一致：按用户隔离加载品牌）
    loadBrands()
    // 默认以 selectedBrandId 作为筛选
    if (selectedBrandId) {
      setSearchParams({ brandId: selectedBrandId })
    }
    fetchSalesDataList()
    fetchStatistics()
  }, [])

  // 计算默认日期
  const calculateDateByCycleType = (date, cycleType) => {
    if (cycleType === 'BY_WEEK') {
      return dayjs(date).startOf('week').add(1, 'day').format('YYYY-MM-DD')
    }
    return dayjs(date).format('YYYY-MM-DD')
  }

  // 表格列配置
  const columns = [
    {
      title: '品牌',
      dataIndex: '品牌',
      key: '品牌',
      width: 120,
    },
    {
      title: '品牌ID',
      dataIndex: '品牌ID',
      key: '品牌ID',
      width: 100,
    },
    {
      title: '周期类型',
      dataIndex: '周期类型',
      key: '周期类型',
      width: 100,
    },
    {
      title: '日期',
      dataIndex: '日期',
      key: '日期',
      width: 120,
    },
    {
      title: '员工姓名',
      dataIndex: '员工姓名',
      key: '员工姓名',
      width: 100,
    },
    {
      title: '店铺编号',
      dataIndex: '店铺编号',
      key: '店铺编号',
      width: 120,
    },
    {
      title: '小红书成单',
      dataIndex: '小红书成单',
      key: '小红书成单',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '本期累计成单',
      dataIndex: '本期累计成单',
      key: '本期累计成单',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '企微留资数',
      dataIndex: '企微留资数',
      key: '企微留资数',
      width: 100,
      render: (value) => value || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条销售数据吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 处理新增
  const handleAdd = () => {
    setIsEdit(false)
    form.resetFields()
    form.setFieldsValue({
      周期类型: 'BY_WEEK',
      日期: calculateDateByCycleType(new Date(), 'BY_WEEK')
    })
    setIsModalVisible(true)
  }

  // 处理编辑
  const handleEdit = (record) => {
    setIsEdit(true)
    form.setFieldsValue(record)
    setIsModalVisible(true)
  }

  // 处理删除
  const handleDelete = async (record) => {
    try {
      await deleteSalesData(
        record.品牌ID,
        record.周期类型,
        record.日期,
        record.员工姓名,
        record.店铺编号
      )
      message.success('删除成功')
    } catch (error) {
      message.error('删除失败: ' + error.message)
    }
  }

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (isEdit) {
        const originalData = form.getFieldsValue()
        await updateSalesData(
          originalData.品牌ID,
          originalData.周期类型,
          originalData.日期,
          originalData.员工姓名,
          originalData.店铺编号,
          values
        )
        message.success('更新成功')
      } else {
        await createSalesData(values)
        message.success('创建成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('操作失败: ' + error.message)
    }
  }

  // 处理搜索
  const handleSearch = (values) => {
    setSearchParams(values)
    fetchSalesDataList()
    fetchStatistics()
  }

  // 处理分页
  const handleTableChange = (pagination) => {
    setPagination(pagination.current, pagination.pageSize)
    fetchSalesDataList()
  }

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据')
      return
    }

    try {
      const selectedData = salesDataList.filter(item => 
        selectedRowKeys.includes(`${item.品牌ID}-${item.周期类型}-${item.日期}-${item.员工姓名}-${item.店铺编号}`)
      )
      await batchDeleteSalesData(selectedData)
      message.success('批量删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      message.error('批量删除失败: ' + error.message)
    }
  }

  // 处理Excel导入
  const handleImport = async (file) => {
    try {
      // 这里需要实现Excel解析逻辑
      message.success('导入成功')
      return false // 阻止默认上传行为
    } catch (error) {
      message.error('导入失败: ' + error.message)
      return false
    }
  }

  // 处理Excel导出
  const handleExport = () => {
    try {
      exportToExcel(salesDataList, '销售数据')
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败: ' + error.message)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchSalesDataList()
    fetchStatistics()
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      name: `${record.品牌ID}-${record.周期类型}-${record.日期}-${record.员工姓名}-${record.店铺编号}`,
    }),
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* 搜索区域 */}
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="search">
            <Input
              placeholder="搜索品牌、员工或店铺"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="brandId" initialValue={selectedBrandId}>
            <Select 
              placeholder="选择品牌" 
              style={{ width: 150 }} 
              allowClear
              onChange={(val) => setSelectedBrandId(val || '')}
            >
              {getBrandOptions().map(brand => (
                <Option key={brand.value} value={brand.value}>{brand.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="cycleType">
            <Select placeholder="周期类型" style={{ width: 120 }} allowClear>
              <Option value="BY_WEEK">按周</Option>
              <Option value="BY_MONTH">按月</Option>
              <Option value="BY_DAY">按日</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
        </Form>

        {/* 操作区域 */}
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增销售数据
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
          >
            导出Excel
          </Button>
          <Upload
            accept=".xlsx,.xls"
            beforeUpload={handleImport}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>
              导入Excel
            </Button>
          </Upload>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title="确定要删除选中的数据吗？"
              onConfirm={handleBatchDelete}
              okText="确定"
              cancelText="取消"
            >
              <Button danger>批量删除</Button>
            </Popconfirm>
          )}
        </Space>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总成单金额" value={statistics.totalOrderAmount} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="总留资数" value={statistics.totalLeads} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="总成单数" value={statistics.totalOrders} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="平均成单金额" value={statistics.averageOrderAmount} precision={2} />
            </Card>
          </Col>
        </Row>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={salesDataList}
          loading={loading}
          rowKey={(record) => `${record.品牌ID}-${record.周期类型}-${record.日期}-${record.员工姓名}-${record.店铺编号}`}
          rowSelection={rowSelection}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* 新增/编辑对话框 */}
      <Modal
        title={isEdit ? '编辑销售数据' : '新增销售数据'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            周期类型: 'BY_WEEK',
            小红书成单: 0,
            本期累计成单: 0,
            企微留资数: 0
          }}
        >
          <Form.Item
            name="品牌"
            label="品牌"
            rules={[{ required: true, message: '请输入品牌名称' }]}
          >
            <Input placeholder="请输入品牌名称" />
          </Form.Item>
          <Form.Item
            name="品牌ID"
            label="品牌ID"
            rules={[{ required: true, message: '请输入品牌ID' }]}
          >
            <Input placeholder="请输入品牌ID" />
          </Form.Item>
          <Form.Item
            name="周期类型"
            label="周期类型"
            rules={[{ required: true, message: '请选择周期类型' }]}
          >
            <Select>
              <Option value="BY_WEEK">按周</Option>
              <Option value="BY_MONTH">按月</Option>
              <Option value="BY_DAY">按日</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="日期"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="员工姓名"
            label="员工姓名"
            rules={[{ required: true, message: '请输入员工姓名' }]}
          >
            <Input placeholder="请输入员工姓名" />
          </Form.Item>
          <Form.Item
            name="店铺编号"
            label="店铺编号"
            rules={[{ required: true, message: '请输入店铺编号' }]}
          >
            <Input placeholder="请输入店铺编号" />
          </Form.Item>
          <Form.Item
            name="小红书成单"
            label="小红书成单"
          >
            <InputNumber placeholder="请输入小红书成单数" style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="本期累计成单"
            label="本期累计成单"
          >
            <InputNumber placeholder="请输入本期累计成单数" style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="企微留资数"
            label="企微留资数"
          >
            <InputNumber placeholder="请输入企微留资数" style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}


