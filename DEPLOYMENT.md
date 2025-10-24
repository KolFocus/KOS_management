# KOS管理系统部署说明

## 项目概述

KOS管理系统是一个基于Vue 3 + Element Plus + Supabase的全栈Web应用，用于管理小红书专业号的KOS列表和销售数据。

## 技术栈

- **前端**: Vue 3 + Element Plus + Vite
- **后端**: Supabase (PostgreSQL + Edge Functions)
- **部署**: Vercel
- **状态管理**: Pinia
- **路由**: Vue Router

## 功能特性

### 1. KOS列表管理
- ✅ 列表展示和分页
- ✅ 搜索和筛选功能
- ✅ 新增、编辑、删除KOS
- ✅ 批量上下线操作
- ✅ 状态统计展示

### 2. KOS销售数据管理
- ✅ 销售数据列表展示
- ✅ Excel导入功能（支持覆盖模式）
- ✅ Excel导出功能
- ✅ 数据统计和分析
- ✅ 批量操作功能

### 3. 系统特性
- ✅ 响应式设计
- ✅ 现代化UI界面
- ✅ 实时数据同步
- ✅ 完善的错误处理
- ✅ 操作日志记录

## 部署步骤

### 1. 环境准备

#### 开发环境要求
- Node.js 18+
- npm 或 yarn
- Git

#### Supabase配置
1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 获取项目URL和API密钥
3. 执行数据库初始化脚本

### 2. 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd kos-management-system

# 安装依赖
npm install

# 配置环境变量
cp env.example .env.local
# 编辑.env.local文件，填入Supabase配置信息

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 3. 数据库初始化

在Supabase SQL编辑器中执行 `supabase/init.sql` 文件：

```sql
-- 执行数据库初始化脚本
\i supabase/init.sql
```

### 4. Vercel部署

#### 方法一：通过Vercel CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel

# 配置环境变量
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

#### 方法二：通过GitHub集成

1. 将代码推送到GitHub仓库
2. 在Vercel控制台导入GitHub仓库
3. 配置环境变量
4. 自动部署

#### 环境变量配置

在Vercel项目设置中配置以下环境变量：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. 域名配置

1. 在Vercel项目设置中添加自定义域名
2. 配置DNS记录指向Vercel
3. 启用HTTPS（Vercel自动配置）

## 项目结构

```
kos-management-system/
├── src/
│   ├── components/          # 公共组件
│   │   └── Layout.vue      # 主布局组件
│   ├── views/              # 页面组件
│   │   ├── KosList.vue     # KOS列表管理
│   │   └── SalesData.vue   # 销售数据管理
│   ├── router/             # 路由配置
│   ├── stores/             # 状态管理
│   ├── api/                # API接口
│   ├── utils/              # 工具函数
│   └── assets/             # 静态资源
├── supabase/               # 数据库脚本
│   └── init.sql            # 初始化脚本
├── public/                 # 公共资源
├── package.json            # 项目配置
├── vite.config.js          # Vite配置
├── vercel.json             # Vercel配置
└── README.md               # 项目说明
```

## 数据库设计

### 核心表结构

#### 1. 配置_小红书专业号_kos列表
- 品牌、品牌ID、用户ID（复合主键）
- 昵称、头像、排序
- 所属用户、所属店铺、渠道
- 参与统计状态（1-上线，2-下线）
- AZ批次号

#### 2. 品牌离线导入_kos销售数据
- 自增主键ID
- 品牌、品牌ID、周期类型
- 日期、短日期、员工姓名、店铺编号
- 小红书成单、本期累计成单、企微留资数

### 索引优化
- 主键索引
- 单列索引（品牌ID、用户ID、渠道等）
- 复合索引（品牌+日期、员工+日期等）

## 性能优化

### 前端优化
- 组件懒加载
- 图片懒加载
- 代码分割
- 缓存策略

### 后端优化
- 数据库索引
- 分页查询
- 数据缓存
- API优化

## 安全配置

### 数据安全
- Row Level Security (RLS)
- API密钥保护
- 数据加密传输
- 操作日志记录

### 访问控制
- 基于角色的权限管理
- 操作权限验证
- 数据访问控制

## 监控和维护

### 性能监控
- Vercel Analytics
- Supabase Dashboard
- 错误日志监控

### 数据备份
- Supabase自动备份
- 定期数据导出
- 版本控制

## 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查Supabase配置
- 验证API密钥
- 确认网络连接

#### 2. 导入功能异常
- 检查文件格式
- 验证数据格式
- 查看错误日志

#### 3. 部署失败
- 检查环境变量
- 验证构建配置
- 查看部署日志

### 日志查看
- Vercel: 项目控制台 → Functions → Logs
- Supabase: 项目控制台 → Logs
- 浏览器: 开发者工具 → Console

## 更新和维护

### 版本更新
1. 更新代码
2. 测试功能
3. 部署到生产环境
4. 验证功能正常

### 数据维护
1. 定期备份数据
2. 清理过期数据
3. 优化数据库性能
4. 监控系统状态

## 联系支持

如有问题，请通过以下方式联系：

- 项目Issues: GitHub Issues
- 技术支持: 开发团队
- 文档更新: 项目Wiki

---

**部署完成后的访问地址**: https://your-project.vercel.app

**系统管理**: https://supabase.com/dashboard/project/your-project

