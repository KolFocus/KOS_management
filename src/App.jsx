import React from 'react'
import { Layout, Menu, Space, Button, Dropdown, Avatar, message } from 'antd'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  SettingOutlined,
  FilterOutlined
} from '@ant-design/icons'

import KosList from './pages/KosList'
import SalesData from './pages/SalesData'
import RetailAnalysis from './pages/RetailAnalysis'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import BrandManagement from './pages/BrandManagement'
import PromotionDashboard from './pages/PromotionDashboard'

import { useBrandManagementStore } from './stores/brandManagementStore'
import { useAuthStore } from './stores/authStore'

const { Header, Sider, Content } = Layout
const AUTH_WHITELIST = ['/login', '/reset-password']
const renderAuthLayout = (content) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f62fe 0%, #6f20ff 100%)',
      padding: '48px 16px'
    }}
  >
    <div
      style={{
        width: '100%',
        maxWidth: 1080,
        display: 'grid',
        gap: 32,
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        alignItems: 'center'
      }}
    >
      <div style={{ color: '#fff', paddingRight: 24 }}>
        <div style={{ fontSize: 36, fontWeight: 600, marginBottom: 16 }}>KOS 管理系统</div>
        <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.9, marginBottom: 32 }}>
          统一管理品牌、渠道与达人数据，实时掌握 KOS 运营指标。
          通过 Supabase 提供的认证与数据库服务，保障数据安全与可追溯性。
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 16
          }}
        >
          {[
            { label: '品牌数据', value: '360+' },
            { label: '达人账号', value: '2,400+' },
            { label: '实时指标', value: '18 项' }
          ].map(item => (
            <div
              key={item.label}
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: 16
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 600 }}>{item.value}</div>
              <div style={{ opacity: 0.85 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>{content}</div>
    </div>
  </div>
)

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const loadBrands = useBrandManagementStore(state => state.loadBrands)
  const user = useAuthStore(state => state.user)
  const initialized = useAuthStore(state => state.initialized)
  const initAuth = useAuthStore(state => state.initAuth)
  const logout = useAuthStore(state => state.logout)
  const initRef = React.useRef(false)

  React.useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    initAuth()
  }, [initAuth])

  React.useEffect(() => {
    if (user) {
      loadBrands()
    }
  }, [user, loadBrands])

  // 简单路由保护：未登录访问业务页时跳转至登录
  React.useEffect(() => {
    if (!initialized) return
    if (!user && !AUTH_WHITELIST.includes(location.pathname)) {
      navigate('/login')
    }
  }, [initialized, user, location.pathname, navigate])
  const selected = React.useMemo(() => {
    if (location.pathname.startsWith('/sales-data')) return ['sales']
    if (location.pathname.startsWith('/retail-analysis')) return ['analysis']
    if (location.pathname.startsWith('/promotion')) return ['promotion']
    if (location.pathname.startsWith('/kos')) return ['kos']
    return []
  }, [location.pathname])

  const isAuthRoute = AUTH_WHITELIST.includes(location.pathname)

  if (isAuthRoute) {
    const authContent = location.pathname === '/reset-password' ? <ResetPassword /> : <Login />
    return renderAuthLayout(authContent)
  }

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider 
        breakpoint="lg" 
        collapsedWidth={64}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          overflow: 'auto'
        }}
      >
        <div style={{ color: '#fff', padding: 16, fontWeight: 600 }}>KOS管理系统</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selected}
          items={[
            { key: 'kos', icon: <AppstoreOutlined />, label: <Link to="/kos">KOS列表管理</Link> },
            { key: 'sales', icon: <DatabaseOutlined />, label: <Link to="/sales-data">KOS销售管理</Link> },
            { key: 'promotion', icon: <FilterOutlined />, label: <Link to="/promotion">KOS推广筛选</Link> },
            { key: 'analysis', icon: <BarChartOutlined />, label: <Link to="/retail-analysis">KOS分析</Link> },
            { key: 'brands', icon: <SettingOutlined />, label: <Link to="/brands">品牌管理</Link> }
          ]}
        />
      </Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Header 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 200,
            right: 0,
            zIndex: 1000,
            background: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-end', 
            paddingInline: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {user ? (
            <Space>
              <Dropdown
                menu={{
                  items: [
                    { key: 'profile', label: <Link to="/profile">个人资料</Link> },
                    { type: 'divider' },
                    { 
                      key: 'logout',
                      label: '退出登录',
                      onClick: async () => {
                        await logout()
                        message.success('已退出登录')
                        navigate('/login')
                      }
                    }
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
        <Content 
          style={{ 
            marginTop: 64,
            marginLeft: 16,
            marginRight: 16,
            marginBottom: 16,
            overflow: 'auto',
            height: 'calc(100vh - 64px)'
          }}
        >
          <Routes>
            <Route path="/" element={<KosList />} />
            <Route path="/kos" element={<KosList />} />
            <Route path="/sales-data" element={<SalesData />} />
            <Route path="/retail-analysis" element={<RetailAnalysis />} />
            <Route path="/promotion" element={<PromotionDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/brands" element={<BrandManagement />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}


