# KOS管理系统

## 项目简介
KOS管理系统是一个基于Vue 3 + Element Plus + Supabase的全栈Web应用，用于管理小红书专业号的KOS列表和销售数据。

## 技术栈
- **前端**: Vue 3 + Element Plus + Vite
- **后端**: Supabase (PostgreSQL + Edge Functions)
- **部署**: Vercel
- **状态管理**: Pinia
- **路由**: Vue Router

## 功能模块
1. **KOS列表管理**: 管理小红书专业号的KOS列表
2. **KOS销售数据管理**: 管理品牌离线导入的KOS销售数据

## 开发环境要求
- Node.js 18+
- npm 或 yarn

## 安装和运行
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 环境变量
创建 `.env.local` 文件并配置以下变量：
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 项目结构
```
src/
├── components/     # 公共组件
├── views/         # 页面组件
├── router/        # 路由配置
├── stores/        # 状态管理
├── api/           # API接口
├── utils/         # 工具函数
└── assets/        # 静态资源
```

