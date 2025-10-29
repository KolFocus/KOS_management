import React from 'react'
import { Layout, Menu, theme } from 'antd'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import {
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined
} from '@ant-design/icons'

import KosList from './pages/KosList'
import SalesData from './pages/SalesData'
import RetailAnalysis from './pages/RetailAnalysis'
import Login from './pages/Login'
import Profile from './pages/Profile'

const { Header, Sider, Content } = Layout

export default function App() {
  const location = useLocation()
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
            { key: 'analysis', icon: <BarChartOutlined />, label: <Link to="/retail-analysis">零售分析</Link> }
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff' }} />
        <Content style={{ margin: 16 }}>
          <Routes>
            <Route path="/" element={<KosList />} />
            <Route path="/kos" element={<KosList />} />
            <Route path="/sales-data" element={<SalesData />} />
            <Route path="/retail-analysis" element={<RetailAnalysis />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}


