# Supabase API 使用示例

## 概述

本文档提供KOS管理系统使用Supabase API的具体示例，展示如何直接在前端调用Supabase服务。

## 前端调用示例

### 1. KOS列表管理

#### 1.1 获取KOS列表
```typescript
// 基础查询
const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .select('*')

// 分页查询
const { data, error, count } = await supabase
  .from('配置_小红书专业号_kos列表')
  .select('*', { count: 'exact' })
  .range(0, 19) // 第1页，每页20条

// 条件查询
const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .select('*')
  .eq('品牌ID', '001')
  .eq('参与统计', 1)

// 模糊搜索
const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .select('*')
  .or('昵称.ilike.%张三%,用户ID.ilike.%1001%')

// 排序
const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .select('*')
  .order('创建时间', { ascending: false })
```

#### 1.2 新增KOS
```typescript
const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .insert([{
    品牌: '品牌A',
    品牌ID: '001',
    用户ID: '1001',
    昵称: '张三',
    头像: 'https://example.com/avatar1.jpg',
    排序: '1',
    所属用户: '李四',
    所属店铺: '店铺A',
    渠道: '小红书',
    参与统计: 1,
    AZ_批次号: 'AZ20240101001',
    创建人: 'admin',
    更新人: 'admin'
  }])
```

#### 1.3 更新KOS
```typescript
const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .update({
    昵称: '张三更新',
    参与统计: 0,
    更新人: 'admin'
  })
  .eq('品牌ID', '001')
  .eq('用户ID', '1001')
```

#### 1.4 删除KOS
```typescript
const { error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .delete()
  .eq('品牌ID', '001')
  .eq('用户ID', '1001')
```

#### 1.5 批量更新状态
```typescript
const updates = [
  { 品牌ID: '001', 用户ID: '1001', 参与统计: 1 },
  { 品牌ID: '001', 用户ID: '1002', 参与统计: 1 }
]

const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .upsert(updates)
```

### 2. 销售数据管理

#### 2.1 获取销售数据
```typescript
// 基础查询
const { data, error } = await supabase
  .from('品牌离线导入_kos销售数据')
  .select('*')

// 按品牌和日期查询
const { data, error } = await supabase
  .from('品牌离线导入_kos销售数据')
  .select('*')
  .eq('品牌ID', '001')
  .eq('短日期', '2024-01-01')

// 按员工查询
const { data, error } = await supabase
  .from('品牌离线导入_kos销售数据')
  .select('*')
  .eq('员工姓名', '张三')
  .order('短日期', { ascending: false })
```

#### 2.2 新增销售数据
```typescript
const { data, error } = await supabase
  .from('品牌离线导入_kos销售数据')
  .insert([{
    品牌: '品牌A',
    品牌ID: '001',
    周期类型: 'day',
    日期: '2024-01-01',
    短日期: '2024-01-01',
    员工姓名: '张三',
    店铺编号: '001',
    小红书成单: 1000.00,
    本期累计成单: 10,
    企微留资数: 5,
    创建人: 'admin',
    更新人: 'admin'
  }])
```

#### 2.3 批量导入销售数据
```typescript
// 从Excel解析的数据
const salesData = [
  {
    品牌: '品牌A',
    品牌ID: '001',
    周期类型: 'day',
    日期: '2024-01-01',
    短日期: '2024-01-01',
    员工姓名: '张三',
    店铺编号: '001',
    小红书成单: 1000.00,
    本期累计成单: 10,
    企微留资数: 5
  },
  // ... 更多数据
]

const { data, error } = await supabase
  .from('品牌离线导入_kos销售数据')
  .upsert(salesData)
```

### 3. 实时订阅

#### 3.1 订阅KOS列表变化
```typescript
const subscription = supabase
  .channel('kos-list-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: '配置_小红书专业号_kos列表'
  }, (payload) => {
    console.log('KOS列表变化:', payload)
    // 更新UI
    updateKosList(payload)
  })
  .subscribe()

// 取消订阅
subscription.unsubscribe()
```

#### 3.2 订阅销售数据变化
```typescript
const subscription = supabase
  .channel('sales-data-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: '品牌离线导入_kos销售数据'
  }, (payload) => {
    console.log('销售数据变化:', payload)
    // 更新UI
    updateSalesData(payload)
  })
  .subscribe()
```

### 4. 用户认证

#### 4.1 用户登录
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

#### 4.2 用户注册
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
```

#### 4.3 用户登出
```typescript
const { error } = await supabase.auth.signOut()
```

#### 4.4 获取当前用户
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### 5. 文件上传

#### 5.1 上传Excel文件
```typescript
const file = event.target.files[0]
const fileName = `${Date.now()}-${file.name}`

const { data, error } = await supabase.storage
  .from('uploads')
  .upload(fileName, file)

if (data) {
  // 获取文件URL
  const { data: urlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName)
  
  console.log('文件URL:', urlData.publicUrl)
}
```

#### 5.2 下载文件
```typescript
const { data, error } = await supabase.storage
  .from('uploads')
  .download('file-name.xlsx')
```

### 6. 错误处理

#### 6.1 统一错误处理
```typescript
async function handleSupabaseCall(operation: () => Promise<any>) {
  try {
    const { data, error } = await operation()
    
    if (error) {
      console.error('Supabase错误:', error)
      throw new Error(error.message)
    }
    
    return data
  } catch (error) {
    console.error('操作失败:', error)
    throw error
  }
}

// 使用示例
const kosList = await handleSupabaseCall(() => 
  supabase.from('配置_小红书专业号_kos列表').select('*')
)
```

#### 6.2 常见错误码处理
```typescript
function handleSupabaseError(error: any) {
  switch (error.code) {
    case 'PGRST116':
      return '没有找到数据'
    case 'PGRST301':
      return '权限不足'
    case 'PGRST301':
      return '数据已存在'
    default:
      return error.message || '未知错误'
  }
}
```

### 7. 性能优化

#### 7.1 查询优化
```typescript
// 只选择需要的字段
const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .select('品牌ID,用户ID,昵称,参与统计')

// 使用索引字段进行查询
const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .select('*')
  .eq('品牌ID', '001') // 使用索引字段
  .eq('参与统计', 1)   // 使用索引字段
```

#### 7.2 分页优化
```typescript
// 使用游标分页
const { data, error } = await supabase
  .from('配置_小红书专业号_kos列表')
  .select('*')
  .order('创建时间', { ascending: false })
  .limit(20)
  .gte('创建时间', lastCreatedTime) // 游标分页
```

## 总结

通过直接调用Supabase API，我们可以：

1. **简化架构**: 无需独立的API服务
2. **提高性能**: 直接数据库连接
3. **实时功能**: 内置的实时数据同步
4. **类型安全**: 自动生成的TypeScript类型
5. **自动扩展**: 无需手动管理服务器

这种架构更适合现代Web应用的需求，提供了更好的开发体验和用户体验。

