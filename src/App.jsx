import React from 'react'
import { Layout, Menu, theme, Space, Button, Dropdown, Avatar } from 'antd'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  SettingOutlined
} from '@ant-design/icons'

import KosList from './pages/KosList'
import SalesData from './pages/SalesData'
import RetailAnalysis from './pages/RetailAnalysis'
import Login from './pages/Login'
import Profile from './pages/Profile'
import BrandManagement from './pages/BrandManagement'

import { supabase } from './utils/supabase'
import { useBrandManagementStore } from './stores/brandManagementStore'

const { Header, Sider, Content } = Layout

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const brandStore = useBrandManagementStore()

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data?.session?.user || null)
      setLoading(false)
      if (data?.session?.user) {
        // 登录后加载品牌列表
        brandStore.loadBrands()
      }
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        brandStore.loadBrands()
      }
    })
    return () => { sub.subscription?.unsubscribe?.() }
  }, [])

  // 简单路由保护：未登录访问业务页时跳转至登录
  React.useEffect(() => {
    if (loading) return
    const whitelist = ['/login', '/reset-password']
    if (!user && !whitelist.includes(location.pathname)) {
      navigate('/login')
    }
  }, [loading, user, location.pathname])
  const selected = React.useMemo(() => {
    if (location.pathname.startsWith('/sales-data')) return ['sales']
    if (location.pathname.startsWith('/retail-analysis')) return ['analysis']
    if (location.pathname.startsWith('/kos')) return ['kos']
    return []
  }, [location.pathname])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={64}>
        <div style={{ color: '#fff', padding: 16, fontWeight: 600 }}>KOS管理系统</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selected}
          items={[
            { key: 'kos', icon: <AppstoreOutlined />, label: <Link to="/kos">KOS列表管理</Link> },
            { key: 'sales', icon: <DatabaseOutlined />, label: <Link to="/sales-data">KOS销售数据管理</Link> },
            { key: 'analysis', icon: <BarChartOutlined />, label: <Link to="/retail-analysis">零售分析</Link> },
            { key: 'brands', icon: <SettingOutlined />, label: <Link to="/brands">品牌管理</Link> }
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingInline: 16 }}>
          {user ? (
            <Space>
              <Dropdown
                menu={{
                  items: [
                    { key: 'profile', label: <Link to="/profile">个人资料</Link> },
                    { type: 'divider' },
                    { key: 'logout', label: '退出登录', onClick: async () => { await supabase.auth.signOut(); navigate('/login') } }
                  ]
                }}
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar size={28} src={user?.user_metadata?.avatar_url}>
                    {(user?.email || 'U')[0].toUpperCase()}
                  </Avatar>
                  <span>{user?.user_metadata?.name || user?.email}</span>
                </Space>
              </Dropdown>
            </Space>
          ) : (
            <Space>
              <Button type="primary" onClick={() => navigate('/login')}>登录</Button>
            </Space>
          )}
        </Header>
        <Content style={{ margin: 16 }}>
          <Routes>
            <Route path="/" element={<KosList />} />
            <Route path="/kos" element={<KosList />} />
            <Route path="/sales-data" element={<SalesData />} />
            <Route path="/retail-analysis" element={<RetailAnalysis />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/brands" element={<BrandManagement />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}


