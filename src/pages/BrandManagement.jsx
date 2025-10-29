import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useBrandManagementStore } from '../stores/brandManagementStore'

export default function BrandManagement() {
  const {
    brands,
    loading,
    loadBrands,
    addBrand,
    updateBrand,
    deleteBrand,
    platforms,
    loadPlatforms,
    addPlatform,
    updatePlatform,
    deletePlatform
  } = useBrandManagementStore()

  const [form] = Form.useForm()
  const [visible, setVisible] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [platformForm] = Form.useForm()
  const [platformVisible, setPlatformVisible] = useState(false)
  const [platformIsEdit, setPlatformIsEdit] = useState(false)
  const [platformEditingKey, setPlatformEditingKey] = useState(null)
  const [deletingBrandId, setDeletingBrandId] = useState(null)
  const [deletingPlatformKey, setDeletingPlatformKey] = useState(null)
  const [submittingBrand, setSubmittingBrand] = useState(false)
  const [submittingPlatform, setSubmittingPlatform] = useState(false)

  useEffect(() => {
    loadBrands()
    loadPlatforms()
  }, [])

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text))
      message.success('已复制到剪贴板')
    } catch (_) {
      message.warning('复制失败，请手动选择复制')
    }
  }

  // 品牌管理列表列（显示：品牌 -> 品牌ID -> 排序 -> 操作）
  const columns = [
    { title: '品牌', dataIndex: '品牌', key: '品牌', width: 200, align: 'center' },
    { 
      title: '品牌ID', 
      dataIndex: '品牌ID', 
      key: '品牌ID', 
      width: 220, 
      align: 'center', 
      render: (_, record) => String((record.品牌ID || record.ID || '')).toUpperCase() 
    },
    { title: '排序', dataIndex: '排序', key: '排序', width: 100, align: 'center' },
    {
      title: '操作',
      key: 'action',
      width: 220,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该品牌？" okText="删除" cancelText="取消" onConfirm={() => handleDelete(record)}>
            <Button type="link" danger icon={<DeleteOutlined />} loading={deletingBrandId === record.ID}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const handleAdd = () => {
    setIsEdit(false)
    setEditingId(null)
    form.resetFields()
    setVisible(true)
  }

  const handleEdit = (record) => {
    setIsEdit(true)
    setEditingId(record.ID)
    form.setFieldsValue({ 品牌: record.品牌, 排序: record.排序 })
    setVisible(true)
  }

  

  const handleDelete = async (record) => {
    try {
      setDeletingBrandId(record.ID)
      // 删除品牌前检查是否有关联平台（与原版一致）
      // 这里调用 store.deleteBrand 已经包含 Supabase 级联检查；若要前置拦截可先过滤 platforms
      const hasRelated = platforms.some(p => p.品牌ID === record.ID)
      if (hasRelated) {
        message.error('该品牌下存在平台关联数据，无法删除')
        return
      }
      await deleteBrand(record.ID)
      message.success('删除成功')
    } catch (e) {
      message.error(e.message || '删除失败')
    } finally {
      setDeletingBrandId(null)
    }
  }

  const handleOk = async () => {
    try {
      setSubmittingBrand(true)
      const values = await form.validateFields()
      if (isEdit && editingId) {
        await updateBrand(editingId, values)
        message.success('更新成功')
      } else {
        await addBrand(values)
        message.success('创建成功')
      }
      setVisible(false)
      form.resetFields()
    } catch (e) {
      // 校验或接口错误已提示
    } finally {
      setSubmittingBrand(false)
    }
  }

  // 平台操作
  const handleAddPlatform = () => {
    setPlatformIsEdit(false)
    setPlatformEditingKey(null)
    platformForm.resetFields()
    setPlatformVisible(true)
  }

  const handleEditPlatform = (record) => {
    setPlatformIsEdit(true)
    setPlatformEditingKey({ 品牌ID: record.品牌ID, 平台类型: record.平台类型, 平台ID: record.平台ID })
    platformForm.setFieldsValue({
      ...record,
      品牌选择: record.品牌ID,
      品牌ID: record.品牌ID,
      品牌: record.品牌
    })
    setPlatformVisible(true)
  }

  const handleDeletePlatform = async (record) => {
    try {
      const key = `${record.品牌ID}-${record.平台类型}-${record.平台ID}`
      setDeletingPlatformKey(key)
      await deletePlatform(record.品牌ID, record.平台类型, record.平台ID)
      message.success('删除成功')
    } catch (e) {
      message.error(e.message || '删除失败')
    } finally {
      setDeletingPlatformKey(null)
    }
  }

  const handlePlatformOk = async () => {
    try {
      setSubmittingPlatform(true)
      const values = await platformForm.validateFields()
      // 统一由选择框填充品牌名称与品牌ID
      if (values.品牌选择) {
        const b = brands.find(x => x.ID === values.品牌选择)
        values.品牌ID = b?.ID || values.品牌ID
        values.品牌 = b?.品牌 || values.品牌
      }
      if (platformIsEdit && platformEditingKey) {
        await updatePlatform(platformEditingKey.品牌ID, platformEditingKey.平台类型, platformEditingKey.平台ID, values)
        message.success('更新成功')
      } else {
        // 新增按选择自动填充
        await addPlatform(values)
        message.success('创建成功')
      }
      setPlatformVisible(false)
      platformForm.resetFields()
    } catch (e) {
      // 校验或接口错误已提示
    } finally {
      setSubmittingPlatform(false)
    }
  }

  return (
    <div style={{ padding: 8 }}>
      <Card title="品牌管理" extra={<Space><Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增品牌</Button></Space>}>
        <Table
          rowKey={(r) => r.ID}
          loading={loading}
          dataSource={brands}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card title="平台管理" extra={<Space><Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlatform}>新增平台</Button></Space>} style={{ marginTop: 16 }}>
        <Table
          rowKey={(r) => `${r.品牌ID}-${r.平台类型}-${r.平台ID}`}
          loading={loading}
          dataSource={platforms}
          columns={[
            { title: '品牌', dataIndex: '品牌', key: '品牌', width: 160, align: 'center' },
            { title: '平台', dataIndex: '平台', key: '平台', width: 140, align: 'center' },
            { title: '平台类型', dataIndex: '平台类型', key: '平台类型', width: 140, align: 'center' },
            { title: '平台ID', dataIndex: '平台ID', key: '平台ID', width: 220, align: 'center' },
            {
              title: '操作', key: 'action', width: 200, align: 'center', render: (_, record) => (
                <Space>
                  <Button type="link" icon={<EditOutlined />} onClick={() => handleEditPlatform(record)}>编辑</Button>
                  <Popconfirm title="确认删除该平台？" okText="删除" cancelText="取消" onConfirm={() => handleDeletePlatform(record)}>
                    <Button type="link" danger icon={<DeleteOutlined />} loading={deletingPlatformKey === `${record.品牌ID}-${record.平台类型}-${record.平台ID}`}>删除</Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={isEdit ? '编辑品牌' : '新增品牌'}
        open={visible}
        onOk={handleOk}
        onCancel={() => { setVisible(false); form.resetFields() }}
        confirmLoading={submittingBrand}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="品牌" label="品牌" rules={[{ required: true, message: '请输入品牌名称' }]}>
            <Input placeholder="请输入品牌名称" />
          </Form.Item>
          <Form.Item name="排序" label="排序">
            <InputNumber style={{ width: '100%' }} placeholder="排序（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={platformIsEdit ? '编辑平台' : '新增平台'}
        open={platformVisible}
        onOk={handlePlatformOk}
        onCancel={() => { setPlatformVisible(false); platformForm.resetFields() }}
        confirmLoading={submittingPlatform}
        destroyOnClose
      >
        <Form form={platformForm} layout="vertical">
          <Form.Item name="品牌选择" label="品牌" rules={[{ required: true, message: '请选择品牌' }]}>
            <Select placeholder="请选择品牌" onChange={(val) => {
              const b = brands.find(x => x.ID === val)
              platformForm.setFieldsValue({ 品牌ID: b?.ID || '', 品牌: b?.品牌 || '' })
            }}>
              {brands.map(b => (
                <Select.Option key={b.ID} value={b.ID}>{b.品牌}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {/* 品牌ID/品牌名称字段在新增与编辑中均不展示，内部由选择自动填充并提交 */}
          <Form.Item name="平台" label="平台" rules={[{ required: true, message: '请输入平台名' }]}>
            <Input placeholder="如 小红书/抖音/快手 等" />
          </Form.Item>
          <Form.Item name="平台类型" label="平台类型" rules={[{ required: true, message: '请输入平台类型' }]}>
            <Input placeholder="如 RED/DOU/KS 等类型码" />
          </Form.Item>
          <Form.Item name="平台ID" label="平台ID" rules={[{ required: true, message: '请输入平台ID' }]}>
            <Input placeholder="平台账户唯一标识" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}


