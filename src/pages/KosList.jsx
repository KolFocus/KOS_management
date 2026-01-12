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
  InputNumber,
  message,
  Popconfirm,
  Upload,
  Row,
  Col,
  Statistic,
  Switch,
  DatePicker
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useKosListStore } from '../stores/kosListStore'
import { useBrandManagementStore } from '../stores/brandManagementStore'
import { STATUS } from '../utils/supabase'
import { exportToExcel, ExcelUtils } from '../utils/excel'
import { KosListAPI } from '../api/kosList'

const { Option } = Select

export default function KosList() {
  const {
    kosList,
    loading,
    total,
    currentPage,
    pageSize,
    searchParams,
    statistics,
    fetchKosList,
    fetchStatistics,
    createKos,
    updateKos,
    deleteKos,
    batchUpdateStatus,
    batchDeleteKos,
    batchImportKos,
    setSearchParams,
    setPagination,
    getOnlineCount,
    getOfflineCount,
    getChannelList
  } = useKosListStore()

  const { getBrandOptions } = useBrandManagementStore()

  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [searchForm] = Form.useForm()
  const [statusUpdating, setStatusUpdating] = useState(new Set())
  const [recordModalVisible, setRecordModalVisible] = useState(false)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordList, setRecordList] = useState([])
  const [currentKos, setCurrentKos] = useState(null)
  const [recordForm] = Form.useForm()
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [toggleReverting, setToggleReverting] = useState(new Set())
  
  // 导入相关
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importForm] = Form.useForm()
  const [importFile, setImportFile] = useState(null)
  const [importLoading, setImportLoading] = useState(false)

  // 页面加载时获取数据
  useEffect(() => {
    fetchKosList()
    fetchStatistics()
  }, [])

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
      title: '排序',
      dataIndex: '排序',
      key: '排序',
      width: 80,
      sorter: (a, b) => (a.排序 || 0) - (b.排序 || 0),
    },
    {
      title: '用户ID',
      dataIndex: '用户ID',
      key: '用户ID',
      width: 120,
    },
    {
      title: '所属用户',
      dataIndex: '所属用户',
      key: '所属用户',
      width: 100,
    },
    {
      title: '所属店铺',
      dataIndex: '所属店铺',
      key: '所属店铺',
      width: 120,
    },
    {
      title: '渠道',
      dataIndex: '渠道',
      key: '渠道',
      width: 100,
    },
    {
      title: '参与统计',
      dataIndex: '参与统计',
      key: '参与统计',
      width: 100,
      render: (status, record) => {
        const rowKey = `${record.品牌ID}-${record.用户ID}`
        return (
          <Space size={8}>
            <Switch
              checked={status === STATUS.ONLINE}
              checkedChildren="上线"
              unCheckedChildren="下线"
              loading={statusUpdating.has(rowKey)}
              onChange={(checked) => handleStatusToggle(record, checked)}
            />
          </Space>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
    width: 220,
      render: (_, record) => (
        <Space size="small">
        <Button
          type="link"
          onClick={() => openRecordModal(record)}
        >
          上下线记录
        </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个KOS吗？"
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
      await deleteKos(record.品牌ID, record.用户ID)
      message.success('删除成功')
      fetchStatistics()
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
        await updateKos(originalData.品牌ID, originalData.用户ID, values)
        message.success('更新成功')
      } else {
        await createKos(values)
        message.success('创建成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
      fetchStatistics()
    } catch (error) {
      message.error('操作失败: ' + error.message)
    }
  }

  // 处理搜索
  const handleSearch = (values) => {
    setSearchParams(values)
    fetchKosList()
    fetchStatistics()
  }

  // 处理分页
  const handleTableChange = (pagination) => {
    setPagination(pagination.current, pagination.pageSize)
    fetchKosList()
  }

  // 处理批量操作
  const handleBatchUpdateStatus = async (status) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的数据')
      return
    }

    try {
      const selectedKos = kosList.filter(kos => 
        selectedRowKeys.includes(`${kos.品牌ID}-${kos.用户ID}`)
      )
      await batchUpdateStatus(selectedKos, status)
      message.success('批量更新状态成功')
      setSelectedRowKeys([])
      fetchStatistics()
    } catch (error) {
      message.error('批量更新失败: ' + error.message)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的数据')
      return
    }

    try {
      const selectedKos = kosList.filter(kos => 
        selectedRowKeys.includes(`${kos.品牌ID}-${kos.用户ID}`)
      )
      await batchDeleteKos(selectedKos)
      message.success('批量删除成功')
      setSelectedRowKeys([])
      fetchStatistics()
    } catch (error) {
      message.error('批量删除失败: ' + error.message)
    }
  }

  // 获取上下线记录列表
  const fetchKosRecords = async (userId) => {
    setRecordLoading(true)
    try {
      const data = await KosListAPI.getKosOnOffRecords(userId)
      setRecordList(data)
    } catch (error) {
      message.error(error.message)
    } finally {
      setRecordLoading(false)
    }
  }

  // 打开上下线记录弹窗
  const openRecordModal = async (record) => {
    setCurrentKos(record)
    setRecordModalVisible(true)
    setEditingRecordId(null)
    recordForm.resetFields()
    await fetchKosRecords(record.用户ID)
  }

  const closeRecordModal = () => {
    setRecordModalVisible(false)
    setRecordList([])
    setCurrentKos(null)
    setEditingRecordId(null)
    recordForm.resetFields()
  }

  // 新增/编辑上下线记录提交
  const handleSubmitRecord = async () => {
    if (!currentKos) {
      message.warning('未找到当前KOS信息')
      return
    }

    try {
      const values = await recordForm.validateFields()
      const [start, end] = values.range || []
      if (!start || !end) {
        message.warning('请选择起止时间')
        return
      }
      if (dayjs(start).isAfter(dayjs(end))) {
        message.warning('起始时间需早于结束时间')
        return
      }

      const payload = {
        用户ID: currentKos.用户ID,
        起始时间: dayjs(start).format('YYYY-MM-DD HH:mm:ss'),
        结束时间: dayjs(end).format('YYYY-MM-DD HH:mm:ss')
      }

      if (editingRecordId) {
        await KosListAPI.updateKosOnOffRecord(editingRecordId, payload)
        message.success('记录已更新')
      } else {
        await KosListAPI.createKosOnOffRecord(payload)
        message.success('记录已新增')
      }

      setEditingRecordId(null)
      recordForm.resetFields()
      await fetchKosRecords(currentKos.用户ID)
    } catch (error) {
      message.error(error.message || '提交失败')
    }
  }

  // 编辑某条记录
  const handleEditRecord = (record) => {
    setEditingRecordId(record.id)
    recordForm.setFieldsValue({
      range: [dayjs(record.起始时间), dayjs(record.结束时间)]
    })
  }

  // 删除记录
  const handleDeleteRecord = async (id) => {
    try {
      await KosListAPI.deleteKosOnOffRecord(id)
      message.success('删除成功')
      if (currentKos?.用户ID) {
        await fetchKosRecords(currentKos.用户ID)
      }
    } catch (error) {
      message.error(error.message || '删除失败')
    }
  }

  const recordColumns = [
    {
      title: '起始时间',
      dataIndex: '起始时间',
      key: 'start',
    },
    {
      title: '结束时间',
      dataIndex: '结束时间',
      key: 'end',
    },
    {
      title: '操作',
      key: 'recordAction',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => handleEditRecord(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该记录吗？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleDeleteRecord(record.id)}
          >
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ]

  // 行内状态切换
  const handleStatusToggle = async (record, checked) => {
    const currentStatus = record.参与统计
    const nextStatus = checked ? STATUS.ONLINE : STATUS.OFFLINE
    const rowKey = `${record.品牌ID}-${record.用户ID}`

    if (currentStatus === nextStatus) {
      message.info('状态未变化，无需操作')
      return
    }

    setStatusUpdating(prev => new Set(prev).add(rowKey))

    try {
      // 留痕记录：上线创建未结束记录，下线补齐最近未结束记录
      if (nextStatus === STATUS.ONLINE) {
        await KosListAPI.createKosOnOffRecord({
          用户ID: record.用户ID,
          起始时间: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          结束时间: null
        })
      } else {
        const openRecord = await KosListAPI.getLatestOpenOnOffRecord(record.用户ID)
        if (openRecord) {
          await KosListAPI.updateKosOnOffRecord(openRecord.id, {
            结束时间: dayjs().format('YYYY-MM-DD HH:mm:ss')
          })
        }
      }

      await updateKos(record.品牌ID, record.用户ID, { 参与统计: nextStatus })
      message.success(`已${checked ? '上线' : '下线'}`)
      fetchStatistics()

      if (recordModalVisible && currentKos?.用户ID === record.用户ID) {
        await fetchKosRecords(record.用户ID)
      }
    } catch (error) {
      message.error('更新状态失败: ' + error.message)
    } finally {
      setStatusUpdating(prev => {
        const next = new Set(prev)
        next.delete(rowKey)
        return next
      })
    }
  }

  // 打开导入弹窗
  const openImportModal = () => {
    setImportModalVisible(true)
    importForm.resetFields()
    setImportFile(null)
    // 设置默认品牌为第一个
    const options = getBrandOptions()
    if (options && options.length > 0) {
      importForm.setFieldsValue({ brandId: options[0].value, brandName: options[0].label })
    }
  }

  // 选择导入文件
  const onBeforeUploadImport = (file) => {
    setImportFile(file)
    message.success(`已选择文件：${file.name}`)
    return false
  }

  // 提交导入
  const handleSubmitImport = async () => {
    try {
      setImportLoading(true)
      const values = await importForm.validateFields()
      
      if (!importFile) {
        message.warning('请先选择要导入的Excel文件')
        return
      }
      
      // 解析Excel文件
      const excelData = await ExcelUtils.parseExcelFile(importFile)
      console.log('导入原始Excel数据:', excelData)
      
      // 验证Excel数据
      const headers = ['用户ID', '排序', '所属用户', '所属店铺', '渠道', '参与统计']
      const { isValid, errors } = ExcelUtils.validateKosExcelData(excelData, headers)
      
      if (!isValid) {
        message.error(errors[0] || '模板校验失败')
        return
      }
      
      // 转换数据格式
      const list = ExcelUtils.convertToKosData(excelData).map(item => ({
        ...item,
        品牌: values.brandName || '',
        品牌ID: values.brandId || ''
      }))
      
      console.log('导入转换后的数据:', list)
      
      if (list.length === 0) {
        message.warning('没有可导入的数据')
        return
      }
      
      // 批量导入
      await batchImportKos(list)
      message.success(`成功导入 ${list.length} 条记录`)
      setImportModalVisible(false)
      setImportFile(null)
      fetchStatistics()
    } catch (error) {
      console.error('导入流程发生错误:', error)
      message.error('导入失败: ' + (error.message || '未知错误'))
    } finally {
      setImportLoading(false)
    }
  }

  // 处理Excel导出
  const handleExport = () => {
    try {
      exportToExcel(kosList, 'KOS列表')
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败: ' + error.message)
    }
  }

  // 下载导入模板
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        ['用户ID', '排序', '所属用户', '所属店铺', '渠道', '参与统计'],
        ['user123', '1', '张三', '北京旗舰店', '品牌商', '1'],
        ['user456', '2', '李四', '上海旗舰店', '经销商', '1']
      ]
      ExcelUtils.downloadTemplate(
        templateData,
        'KOS导入模板.xlsx',
        'KOS数据'
      )
      message.success('模板下载成功')
    } catch (error) {
      message.error('模板下载失败: ' + error.message)
    }
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      name: `${record.品牌ID}-${record.用户ID}`,
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
              placeholder="搜索品牌或用户ID"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="channel">
            <Select placeholder="选择渠道" style={{ width: 120 }} allowClear>
              {getChannelList().map(channel => (
                <Option key={channel} value={channel}>{channel}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="选择状态" style={{ width: 120 }} allowClear>
              <Option value={STATUS.ONLINE}>上线</Option>
              <Option value={STATUS.OFFLINE}>下线</Option>
            </Select>
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
            新增KOS
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
          >
            导出Excel
          </Button>
          <Button icon={<UploadOutlined />} onClick={openImportModal}>
            导入Excel
          </Button>
          {selectedRowKeys.length > 0 && (
            <>
              <Button 
                onClick={() => handleBatchUpdateStatus(STATUS.ONLINE)}
              >
                批量上线
              </Button>
              <Button 
                onClick={() => handleBatchUpdateStatus(STATUS.OFFLINE)}
              >
                批量下线
              </Button>
              <Popconfirm
                title="确定要删除选中的数据吗？"
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger>批量删除</Button>
              </Popconfirm>
            </>
          )}
        </Space>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="KOS总数" value={statistics.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="上线数量" 
                value={statistics.onlineCount} 
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="下线数量" 
                value={statistics.offlineCount}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="渠道数量" value={statistics.channelCount} />
            </Card>
          </Col>
        </Row>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={kosList}
          loading={loading}
          rowKey={(record) => `${record.品牌ID}-${record.用户ID}`}
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
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 上下线记录弹窗 */}
      <Modal
        title={`上下线记录 - ${currentKos?.用户ID || ''}`}
        open={recordModalVisible}
        onCancel={closeRecordModal}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form
          form={recordForm}
          layout="inline"
          style={{ marginBottom: 12 }}
        >
          <Form.Item
            name="range"
            label="起止时间"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <DatePicker.RangePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSubmitRecord}>
                {editingRecordId ? '保存修改' : '新增记录'}
              </Button>
              {editingRecordId && (
                <Button
                  onClick={() => {
                    setEditingRecordId(null)
                    recordForm.resetFields()
                  }}
                >
                  取消编辑
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>

        <Table
          size="small"
          rowKey="id"
          columns={recordColumns}
          dataSource={recordList}
          loading={recordLoading}
          pagination={false}
        />
      </Modal>

      {/* 新增/编辑对话框 */}
      <Modal
        title={isEdit ? '编辑KOS' : '新增KOS'}
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
            参与统计: STATUS.OFFLINE
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
            name="排序"
            label="排序"
          >
            <InputNumber placeholder="请输入排序" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="用户ID"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="请输入用户ID" />
          </Form.Item>
          <Form.Item
            name="所属用户"
            label="所属用户"
          >
            <Input placeholder="请输入所属用户" />
          </Form.Item>
          <Form.Item
            name="所属店铺"
            label="所属店铺"
          >
            <Input placeholder="请输入所属店铺" />
          </Form.Item>
          <Form.Item
            name="渠道"
            label="渠道"
          >
            <Input placeholder="请输入渠道" />
          </Form.Item>
          <Form.Item
            name="参与统计"
            label="参与统计"
            rules={[{ required: true, message: '请选择参与统计状态' }]}
          >
            <Select>
              <Option value={STATUS.ONLINE}>参与(1)</Option>
              <Option value={STATUS.OFFLINE}>不参与(0)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入对话框 */}
      <Modal
        title="导入KOS数据"
        open={importModalVisible}
        onOk={handleSubmitImport}
        onCancel={() => { setImportModalVisible(false); setImportFile(null) }}
        width={520}
        confirmLoading={importLoading}
      >
        <Form form={importForm} layout="vertical">
          <Form.Item 
            name="brandId" 
            label="品牌" 
            rules={[{ required: true, message: '请选择品牌' }]}
          > 
            <Select 
              placeholder="选择品牌" 
              options={getBrandOptions()}
              onChange={(val, option) => importForm.setFieldsValue({ brandName: option?.label })}
            />
          </Form.Item>
          <Form.Item name="brandName" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="Excel 文件" required>
            <Upload accept=".xlsx,.xls" beforeUpload={onBeforeUploadImport} showUploadList={false}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <div style={{ marginTop: 8, color: '#666' }}>
              {importFile ? `已选择：${importFile.name}` : '未选择文件'}
            </div>
          </Form.Item>
          <div style={{ color: '#999', fontSize: '12px' }}>
            <div style={{ marginBottom: 8 }}>模板字段说明：</div>
            <div>• 用户ID（必填）</div>
            <div>• 排序、所属用户、所属店铺、渠道（可选）</div>
            <div>• 参与统计：1=参与，0=不参与（可选，默认0）</div>
            <div style={{ marginBottom: 12 }}>• 品牌信息在上方选择器中指定</div>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownloadTemplate}
              type="dashed"
              block
            >
              下载导入模板
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}


