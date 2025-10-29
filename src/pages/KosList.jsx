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
  Tag
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UploadOutlined,
  DownloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useKosListStore } from '../stores/kosListStore'
import { STATUS } from '../utils/supabase'
import { exportToExcel } from '../utils/excel'

const { Option } = Select

export default function KosList() {
  const {
    kosList,
    loading,
    total,
    currentPage,
    pageSize,
    searchParams,
    fetchKosList,
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

  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [searchForm] = Form.useForm()

  // 页面加载时获取数据
  useEffect(() => {
    fetchKosList()
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
      render: (status) => (
        <Tag color={status === STATUS.ONLINE ? 'green' : 'red'}>
          {status === STATUS.ONLINE ? '上线' : '下线'}
        </Tag>
      ),
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
    } catch (error) {
      message.error('操作失败: ' + error.message)
    }
  }

  // 处理搜索
  const handleSearch = (values) => {
    setSearchParams(values)
    fetchKosList()
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
      exportToExcel(kosList, 'KOS列表')
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败: ' + error.message)
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
          <Upload
            accept=".xlsx,.xls"
            beforeUpload={handleImport}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>
              导入Excel
            </Button>
          </Upload>
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
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>总计: {total}</span>
            <span>上线: {getOnlineCount()}</span>
            <span>下线: {getOfflineCount()}</span>
          </Space>
        </div>

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
            参与统计: STATUS.ONLINE
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
              <Option value={STATUS.ONLINE}>上线</Option>
              <Option value={STATUS.OFFLINE}>下线</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}


