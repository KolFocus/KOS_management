# API接口契约 - 核心数据处理

## 接口概述

本文档定义了KOS管理系统的核心数据处理API接口，基于Supabase自动生成的REST API，前端直接调用Supabase服务。

## 通用规范

### 1. Supabase API基础信息
- **Base URL**: `https://your-project.supabase.co/rest/v1`
- **Content-Type**: application/json
- **字符编码**: UTF-8
- **认证方式**: Bearer Token (JWT)

### 2. 请求头
```javascript
{
  "apikey": "your-anon-key",
  "Authorization": "Bearer your-jwt-token",
  "Content-Type": "application/json"
}
```

### 3. 响应格式
Supabase自动生成的API响应格式：
```json
// 查询响应
[
  {
    "品牌": "品牌A",
    "品牌ID": "001",
    "用户ID": "1001",
    "昵称": "张三",
    "头像": "https://example.com/avatar1.jpg",
    "排序": "1",
    "所属用户": "李四",
    "所属店铺": "店铺A",
    "渠道": "小红书",
    "参与统计": 1,
    "AZ_批次号": "AZ20240101001",
    "创建时间": "2024-01-01T12:00:00Z",
    "更新时间": "2024-01-01T12:00:00Z"
  }
]

// 错误响应
{
  "code": "PGRST116",
  "details": "The result contains 0 rows",
  "hint": null,
  "message": "JSON object requested, multiple (or no) rows returned"
}
```

### 4. 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## KOS列表管理接口

### 1. 获取KOS列表

#### 1.1 接口信息
- **URL**: `/rest/v1/配置_小红书专业号_kos列表`
- **方法**: GET
- **描述**: 分页获取KOS列表

#### 1.2 请求参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| 品牌ID | String | 否 | - | 品牌ID筛选 |
| 渠道 | String | 否 | - | 渠道筛选 |
| 参与统计 | Integer | 否 | - | 参与统计状态：1-上线，0-下线 |
| 昵称 | String | 否 | - | 昵称模糊搜索 |
| 用户ID | String | 否 | - | 用户ID模糊搜索 |
| select | String | 否 | * | 选择字段 |
| order | String | 否 | 创建时间.desc | 排序 |
| limit | Integer | 否 | 20 | 每页条数 |
| offset | Integer | 否 | 0 | 偏移量 |

#### 1.3 请求示例
```http
GET /api/kos/list?brandId=001&channel=小红书&status=1&pageNum=1&pageSize=20
```

#### 1.4 响应示例
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "total": 100,
    "pageNum": 1,
    "pageSize": 20,
    "pages": 5,
    "list": [
      {
        "brand": "品牌A",
        "brandId": "001",
        "userId": "1001",
        "nickname": "张三",
        "avatar": "https://example.com/avatar1.jpg",
        "sortOrder": "1",
        "ownerUser": "李四",
        "ownerShop": "店铺A",
        "channel": "小红书",
        "participateStatistics": 1,
        "azBatchNo": "AZ20240101001",
        "createTime": "2024-01-01T10:00:00Z",
        "updateTime": "2024-01-01T10:00:00Z"
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 2. 新增KOS

#### 2.1 接口信息
- **URL**: `/api/kos/add`
- **方法**: POST
- **描述**: 新增KOS记录

#### 2.2 请求参数
```json
{
  "brand": "品牌A",
  "brandId": "001",
  "userId": "1001",
  "nickname": "张三",
  "avatar": "https://example.com/avatar1.jpg",
  "sortOrder": "1",
  "ownerUser": "李四",
  "ownerShop": "店铺A",
  "channel": "小红书",
  "participateStatistics": 1,
  "azBatchNo": "AZ20240101001"
}
```

#### 2.3 响应示例
```json
{
  "code": "200",
  "message": "新增成功",
  "data": null,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 3. 更新KOS

#### 3.1 接口信息
- **URL**: `/api/kos/update`
- **方法**: PUT
- **描述**: 更新KOS记录

#### 3.2 请求参数
```json
{
  "brandId": "001",
  "userId": "1001",
  "nickname": "张三",
  "avatar": "https://example.com/avatar1.jpg",
  "sortOrder": "1",
  "ownerUser": "李四",
  "ownerShop": "店铺A",
  "channel": "小红书",
  "participateStatistics": 1
}
```

#### 3.3 响应示例
```json
{
  "code": "200",
  "message": "更新成功",
  "data": null,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 4. 删除KOS

#### 4.1 接口信息
- **URL**: `/api/kos/delete`
- **方法**: DELETE
- **描述**: 删除KOS记录

#### 4.2 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| brandId | String | 是 | 品牌ID |
| userId | String | 是 | 用户ID |

#### 4.3 请求示例
```http
DELETE /api/kos/delete?brandId=001&userId=1001
```

#### 4.4 响应示例
```json
{
  "code": "200",
  "message": "删除成功",
  "data": null,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 5. 批量更新KOS状态

#### 5.1 接口信息
- **URL**: `/api/kos/batch-update-status`
- **方法**: PUT
- **描述**: 批量更新KOS参与统计状态

#### 5.2 请求参数
```json
{
  "kosList": [
    {
      "brandId": "001",
      "userId": "1001"
    },
    {
      "brandId": "001",
      "userId": "1002"
    }
  ],
  "status": 1
}
```

#### 5.3 响应示例
```json
{
  "code": "200",
  "message": "批量更新成功",
  "data": {
    "successCount": 2,
    "failCount": 0,
    "failList": []
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## KOS销售数据管理接口

### 1. 获取销售数据列表

#### 1.1 接口信息
- **URL**: `/api/sales/list`
- **方法**: GET
- **描述**: 分页获取销售数据列表

#### 1.2 请求参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| brandId | String | 否 | - | 品牌ID |
| cycleType | String | 否 | - | 周期类型 |
| startDate | String | 否 | - | 开始日期 |
| endDate | String | 否 | - | 结束日期 |
| employeeName | String | 否 | - | 员工姓名 |
| shopCode | String | 否 | - | 店铺编号 |
| pageNum | Integer | 否 | 1 | 页码 |
| pageSize | Integer | 否 | 50 | 每页大小 |

#### 1.3 请求示例
```http
GET /api/sales/list?brandId=001&cycleType=day&startDate=2024-01-01&endDate=2024-01-31&pageNum=1&pageSize=50
```

#### 1.4 响应示例
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "total": 1000,
    "pageNum": 1,
    "pageSize": 50,
    "pages": 20,
    "list": [
      {
        "id": 1,
        "brand": "品牌A",
        "brandId": "001",
        "cycleType": "day",
        "date": "2024-01-01",
        "shortDate": "2024-01-01",
        "employeeName": "张三",
        "shopCode": "001",
        "xiaohongshuOrder": 1000.00,
        "currentPeriodOrder": 100,
        "qiweiLeads": 10,
        "createTime": "2024-01-01T10:00:00Z",
        "updateTime": "2024-01-01T10:00:00Z"
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 2. Excel导入销售数据

#### 2.1 接口信息
- **URL**: `/api/sales/import`
- **方法**: POST
- **描述**: 通过Excel导入销售数据

#### 2.2 请求参数
- **Content-Type**: multipart/form-data
- **参数**:
  - file: Excel文件
  - importMode: 导入模式（cover-覆盖，append-追加，skip-跳过）

#### 2.3 请求示例
```http
POST /api/sales/import
Content-Type: multipart/form-data

file: [Excel文件]
importMode: cover
```

#### 2.4 响应示例
```json
{
  "code": "200",
  "message": "导入成功",
  "data": {
    "totalCount": 1000,
    "successCount": 950,
    "failCount": 50,
    "failList": [
      {
        "row": 10,
        "error": "数据格式错误"
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 3. 导出销售数据

#### 3.1 接口信息
- **URL**: `/api/sales/export`
- **方法**: GET
- **描述**: 导出销售数据为Excel文件

#### 3.2 请求参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| brandId | String | 否 | - | 品牌ID |
| cycleType | String | 否 | - | 周期类型 |
| startDate | String | 否 | - | 开始日期 |
| endDate | String | 否 | - | 结束日期 |
| format | String | 否 | xlsx | 导出格式：xlsx、csv |

#### 3.3 请求示例
```http
GET /api/sales/export?brandId=001&startDate=2024-01-01&endDate=2024-01-31&format=xlsx
```

#### 3.4 响应示例
- **Content-Type**: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- **Content-Disposition**: attachment; filename="sales_data_20240101_20240131.xlsx"

### 4. 获取销售统计

#### 4.1 接口信息
- **URL**: `/api/sales/statistics`
- **方法**: GET
- **描述**: 获取销售数据统计信息

#### 4.2 请求参数
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| brandId | String | 否 | - | 品牌ID |
| cycleType | String | 否 | - | 周期类型 |
| startDate | String | 否 | - | 开始日期 |
| endDate | String | 否 | - | 结束日期 |
| groupBy | String | 否 | - | 分组字段：brand、employee、shop、date |

#### 4.3 请求示例
```http
GET /api/sales/statistics?brandId=001&startDate=2024-01-01&endDate=2024-01-31&groupBy=date
```

#### 4.4 响应示例
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "totalOrderAmount": 1234567.89,
    "totalLeads": 1234,
    "averageOrderAmount": 1000.00,
    "orderRate": 85.6,
    "trendData": [
      {
        "date": "2024-01-01",
        "orderAmount": 10000.00,
        "leads": 100
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 通用接口

### 1. 获取字典数据

#### 1.1 接口信息
- **URL**: `/api/dict/{dictType}`
- **方法**: GET
- **描述**: 获取字典数据

#### 1.2 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dictType | String | 是 | 字典类型 |

#### 1.3 请求示例
```http
GET /api/dict/participate_status
```

#### 1.4 响应示例
```json
{
  "code": "200",
  "message": "操作成功",
  "data": [
    {
      "code": "1",
      "name": "上线",
      "description": "参与统计"
    },
    {
      "code": "0",
      "name": "下线",
      "description": "不参与统计"
    }
  ],
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 2. 文件上传

#### 2.1 接口信息
- **URL**: `/api/upload`
- **方法**: POST
- **描述**: 文件上传

#### 2.2 请求参数
- **Content-Type**: multipart/form-data
- **参数**:
  - file: 上传文件
  - type: 文件类型（avatar、excel、image等）

#### 2.3 请求示例
```http
POST /api/upload
Content-Type: multipart/form-data

file: [文件]
type: avatar
```

#### 2.4 响应示例
```json
{
  "code": "200",
  "message": "上传成功",
  "data": {
    "url": "https://example.com/uploads/avatar_20240101_123456.jpg",
    "filename": "avatar_20240101_123456.jpg",
    "size": 1024000
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 错误码说明

### 1. 业务错误码
| 错误码 | 说明 |
|--------|------|
| KOS_001 | KOS记录不存在 |
| KOS_002 | KOS记录已存在 |
| KOS_003 | 品牌ID不能为空 |
| KOS_004 | 用户ID不能为空 |
| SALES_001 | 销售数据不存在 |
| SALES_002 | Excel格式错误 |
| SALES_003 | 数据验证失败 |
| SALES_004 | 导入数据为空 |

### 2. 系统错误码
| 错误码 | 说明 |
|--------|------|
| SYS_001 | 系统异常 |
| SYS_002 | 数据库连接异常 |
| SYS_003 | 文件上传失败 |
| SYS_004 | 权限不足 |

## 接口测试

### 1. 测试环境
- **基础URL**: https://api-test.example.com
- **测试账号**: test@example.com
- **测试密码**: Test123456

### 2. 测试工具
- **Postman**: API接口测试
- **Swagger**: 接口文档和测试
- **JMeter**: 性能测试

### 3. 测试用例
- **功能测试**: 验证接口功能正确性
- **参数测试**: 验证参数验证逻辑
- **异常测试**: 验证异常处理逻辑
- **性能测试**: 验证接口响应时间
