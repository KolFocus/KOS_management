# KOS列表管理业务逻辑

## 业务概述

KOS列表管理是系统的核心业务模块，负责管理小红书专业号的KOS（Key Opinion Sales）信息，包括KOS的基本信息维护、用户关联、上下线状态管理等核心业务逻辑。

## 核心业务实体

### 1. KOS实体定义

#### 1.1 实体属性
```java
public class KosList {
    private String brand;              // 品牌名称
    private String brandId;            // 品牌ID（主键）
    private String userId;             // 用户ID（主键）
    private String nickname;           // 用户昵称
    private String avatar;             // 用户头像URL
    private String sortOrder;          // 排序字段
    private String ownerUser;          // 所属用户
    private String ownerShop;          // 所属店铺
    private String channel;            // 渠道标识
    private Integer participateStatistics; // 参与统计状态：1-上线，2-下线
    private String azBatchNo;          // AZ批次号
    private LocalDateTime createTime;  // 创建时间
    private LocalDateTime updateTime;  // 更新时间
    private String createBy;           // 创建人
    private String updateBy;           // 更新人
}
```

#### 1.2 业务规则
- **主键约束**: 品牌ID + 用户ID 组合唯一
- **必填字段**: 品牌ID、用户ID、AZ批次号
- **状态值**: 参与统计状态只能是1或2
- **排序规则**: 排序字段用于控制KOS在列表中的显示顺序

## 核心业务逻辑

### 1. KOS列表查询逻辑

#### 1.1 查询条件处理
```java
public class KosQuery {
    private String brandId;        // 品牌ID筛选
    private String channel;        // 渠道筛选
    private Integer status;        // 状态筛选
    private String keyword;        // 关键词搜索
    private Integer pageNum;       // 页码
    private Integer pageSize;      // 页大小
    private String sortField;      // 排序字段
    private String sortOrder;      // 排序方向
}
```

#### 1.2 查询逻辑流程
1. **参数验证**: 验证查询参数的有效性
2. **权限检查**: 检查用户是否有查询权限
3. **条件构建**: 根据查询条件构建SQL查询语句
4. **数据查询**: 执行数据库查询操作
5. **结果处理**: 处理查询结果，包括分页、排序等
6. **数据转换**: 将数据库实体转换为前端展示对象

#### 1.3 查询优化策略
- **索引优化**: 在品牌ID、用户ID、渠道等字段上建立索引
- **分页查询**: 使用LIMIT和OFFSET进行分页，避免全表扫描
- **缓存策略**: 对热点数据进行缓存，提高查询性能
- **查询条件优化**: 优先使用索引字段作为查询条件

### 2. KOS新增逻辑

#### 2.1 新增流程
```java
public boolean addKos(KosListDTO kosList) {
    // 1. 参数验证
    validateKosData(kosList);
    
    // 2. 重复性检查
    checkDuplicateKos(kosList.getBrandId(), kosList.getUserId());
    
    // 3. 业务规则验证
    validateBusinessRules(kosList);
    
    // 4. 数据转换
    KosList entity = convertToEntity(kosList);
    
    // 5. 保存数据
    int result = kosListMapper.insert(entity);
    
    // 6. 记录操作日志
    logOperation("ADD", entity);
    
    return result > 0;
}
```

#### 2.2 数据验证规则
- **必填字段验证**: 品牌ID、用户ID、AZ批次号不能为空
- **格式验证**: 用户ID格式验证，AZ批次号格式验证
- **重复性验证**: 检查品牌ID+用户ID组合是否已存在
- **业务规则验证**: 验证渠道、状态等业务规则

#### 2.3 异常处理
- **数据验证异常**: 返回具体的验证错误信息
- **重复数据异常**: 返回重复数据提示
- **系统异常**: 记录错误日志，返回通用错误信息

### 3. KOS更新逻辑

#### 3.1 更新流程
```java
public boolean updateKos(KosListDTO kosList) {
    // 1. 参数验证
    validateKosData(kosList);
    
    // 2. 记录存在性检查
    KosList existingKos = getKosByKey(kosList.getBrandId(), kosList.getUserId());
    if (existingKos == null) {
        throw new BusinessException("KOS记录不存在");
    }
    
    // 3. 业务规则验证
    validateBusinessRules(kosList);
    
    // 4. 数据转换
    KosList entity = convertToEntity(kosList);
    entity.setUpdateTime(LocalDateTime.now());
    entity.setUpdateBy(getCurrentUser());
    
    // 5. 更新数据
    int result = kosListMapper.updateById(entity);
    
    // 6. 记录操作日志
    logOperation("UPDATE", entity);
    
    return result > 0;
}
```

#### 3.2 更新策略
- **部分更新**: 只更新传入的非空字段
- **全量更新**: 更新所有字段，包括空值
- **乐观锁**: 使用版本号防止并发更新冲突
- **审计日志**: 记录更新前后的数据变化

#### 3.3 更新限制
- **主键不可更新**: 品牌ID和用户ID不能修改
- **创建信息不可更新**: 创建时间和创建人不能修改
- **权限控制**: 只有有权限的用户才能更新数据

### 4. KOS删除逻辑

#### 4.1 删除流程
```java
public boolean deleteKos(String brandId, String userId) {
    // 1. 参数验证
    if (StringUtils.isBlank(brandId) || StringUtils.isBlank(userId)) {
        throw new BusinessException("品牌ID和用户ID不能为空");
    }
    
    // 2. 记录存在性检查
    KosList existingKos = getKosByKey(brandId, userId);
    if (existingKos == null) {
        throw new BusinessException("KOS记录不存在");
    }
    
    // 3. 权限检查
    checkDeletePermission(existingKos);
    
    // 4. 关联数据检查
    checkRelatedData(brandId, userId);
    
    // 5. 执行删除
    int result = kosListMapper.deleteById(existingKos.getId());
    
    // 6. 记录操作日志
    logOperation("DELETE", existingKos);
    
    return result > 0;
}
```

#### 4.2 删除策略
- **物理删除**: 直接从数据库中删除记录
- **逻辑删除**: 标记删除状态，不实际删除数据
- **级联删除**: 删除关联的销售数据
- **软删除**: 保留数据但标记为已删除状态

#### 4.3 删除限制
- **权限限制**: 只有有权限的用户才能删除数据
- **关联限制**: 如果有关联数据，需要先处理关联关系
- **业务限制**: 某些状态下的数据不允许删除

### 5. 上下线管理逻辑

#### 5.1 状态切换流程
```java
public boolean updateKosStatus(String brandId, String userId, Integer status) {
    // 1. 参数验证
    validateStatus(status);
    
    // 2. 记录存在性检查
    KosList existingKos = getKosByKey(brandId, userId);
    if (existingKos == null) {
        throw new BusinessException("KOS记录不存在");
    }
    
    // 3. 状态变更检查
    if (existingKos.getParticipateStatistics().equals(status)) {
        throw new BusinessException("状态未发生变化");
    }
    
    // 4. 业务规则验证
    validateStatusChange(existingKos, status);
    
    // 5. 更新状态
    existingKos.setParticipateStatistics(status);
    existingKos.setUpdateTime(LocalDateTime.now());
    existingKos.setUpdateBy(getCurrentUser());
    
    int result = kosListMapper.updateById(existingKos);
    
    // 6. 记录操作日志
    logStatusChange(existingKos, status);
    
    // 7. 触发相关业务逻辑
    triggerStatusChangeEvent(existingKos, status);
    
    return result > 0;
}
```

#### 5.2 状态变更规则
- **状态值**: 只能是1（上线）或2（下线）
- **变更限制**: 某些条件下不允许状态变更
- **影响评估**: 评估状态变更对统计数据的影响
- **通知机制**: 状态变更后通知相关人员

#### 5.3 批量状态更新
```java
public BatchUpdateResult batchUpdateStatus(List<KosListDTO> kosList, Integer status) {
    BatchUpdateResult result = new BatchUpdateResult();
    
    for (KosListDTO kos : kosList) {
        try {
            boolean success = updateKosStatus(kos.getBrandId(), kos.getUserId(), status);
            if (success) {
                result.addSuccess(kos);
            } else {
                result.addFailure(kos, "更新失败");
            }
        } catch (Exception e) {
            result.addFailure(kos, e.getMessage());
        }
    }
    
    return result;
}
```

### 6. 用户关联逻辑

#### 6.1 关联关系管理
```java
public boolean associateUser(String brandId, String userId, String ownerUser, String ownerShop) {
    // 1. 参数验证
    validateAssociationData(brandId, userId, ownerUser, ownerShop);
    
    // 2. 用户存在性检查
    checkUserExists(ownerUser);
    checkShopExists(ownerShop);
    
    // 3. 关联关系验证
    validateAssociationRules(brandId, userId, ownerUser, ownerShop);
    
    // 4. 更新关联信息
    KosList kos = getKosByKey(brandId, userId);
    kos.setOwnerUser(ownerUser);
    kos.setOwnerShop(ownerShop);
    kos.setUpdateTime(LocalDateTime.now());
    kos.setUpdateBy(getCurrentUser());
    
    int result = kosListMapper.updateById(kos);
    
    // 5. 记录操作日志
    logAssociationChange(kos, ownerUser, ownerShop);
    
    return result > 0;
}
```

#### 6.2 关联规则
- **用户验证**: 验证所属用户是否存在
- **店铺验证**: 验证所属店铺是否存在
- **权限验证**: 验证用户是否有权限进行关联操作
- **业务规则**: 验证关联关系是否符合业务规则

### 7. 数据同步逻辑

#### 7.1 数据同步策略
```java
public void syncKosData() {
    // 1. 获取需要同步的数据
    List<KosList> kosList = getKosListForSync();
    
    // 2. 批量处理同步
    for (KosList kos : kosList) {
        try {
            syncSingleKos(kos);
        } catch (Exception e) {
            log.error("同步KOS数据失败: {}", kos.getUserId(), e);
        }
    }
    
    // 3. 更新同步状态
    updateSyncStatus();
}
```

#### 7.2 同步规则
- **增量同步**: 只同步有变化的数据
- **全量同步**: 定期进行全量数据同步
- **冲突处理**: 处理数据同步冲突
- **错误重试**: 同步失败时进行重试

### 8. 业务规则引擎

#### 8.1 规则定义
```java
public class KosBusinessRules {
    
    // 状态变更规则
    public boolean canChangeStatus(KosList kos, Integer newStatus) {
        // 规则1: 已删除的KOS不能上线
        if (kos.isDeleted() && newStatus == 1) {
            return false;
        }
        
        // 规则2: 某些特殊状态的KOS不能下线
        if (kos.getSpecialStatus() == 1 && newStatus == 0) {
            return false;
        }
        
        return true;
    }
    
    // 关联规则
    public boolean canAssociate(KosList kos, String ownerUser, String ownerShop) {
        // 规则1: 用户和店铺必须属于同一组织
        if (!isSameOrganization(ownerUser, ownerShop)) {
            return false;
        }
        
        // 规则2: 用户不能关联超过限制数量的KOS
        if (getKosCountByUser(ownerUser) >= MAX_KOS_PER_USER) {
            return false;
        }
        
        return true;
    }
}
```

#### 8.2 规则执行
- **规则引擎**: 使用规则引擎执行业务规则
- **规则配置**: 支持动态配置业务规则
- **规则版本**: 支持业务规则的版本管理
- **规则测试**: 提供规则测试功能

## 异常处理

### 1. 业务异常

#### 1.1 异常分类
```java
public class KosBusinessException extends BusinessException {
    
    // 数据验证异常
    public static final String VALIDATION_ERROR = "KOS_001";
    
    // 重复数据异常
    public static final String DUPLICATE_ERROR = "KOS_002";
    
    // 权限异常
    public static final String PERMISSION_ERROR = "KOS_003";
    
    // 状态异常
    public static final String STATUS_ERROR = "KOS_004";
    
    // 关联异常
    public static final String ASSOCIATION_ERROR = "KOS_005";
}
```

#### 1.2 异常处理策略
- **异常捕获**: 在业务逻辑层捕获异常
- **异常转换**: 将系统异常转换为业务异常
- **异常记录**: 记录异常日志用于问题排查
- **异常通知**: 重要异常通知相关人员

### 2. 系统异常

#### 2.1 数据库异常
- **连接异常**: 数据库连接失败
- **事务异常**: 事务回滚异常
- **锁异常**: 数据库锁冲突
- **超时异常**: 数据库操作超时

#### 2.2 网络异常
- **连接超时**: 网络连接超时
- **请求失败**: HTTP请求失败
- **响应异常**: 响应数据异常
- **服务不可用**: 外部服务不可用

## 性能优化

### 1. 查询优化

#### 1.1 索引优化
```sql
-- 主键索引
PRIMARY KEY (`品牌ID`, `用户ID`)

-- 单列索引
KEY `idx_品牌ID` (`品牌ID`)
KEY `idx_用户ID` (`用户ID`)
KEY `idx_渠道` (`渠道`)
KEY `idx_参与统计` (`参与统计`)

-- 复合索引
KEY `idx_品牌_渠道` (`品牌ID`, `渠道`)
KEY `idx_品牌_状态` (`品牌ID`, `参与统计`)
```

#### 1.2 查询优化
- **分页查询**: 使用LIMIT和OFFSET进行分页
- **条件优化**: 优先使用索引字段作为查询条件
- **排序优化**: 使用索引字段进行排序
- **缓存策略**: 对热点查询结果进行缓存

### 2. 更新优化

#### 2.1 批量操作
```java
public boolean batchUpdateKos(List<KosListDTO> kosList) {
    // 使用批量更新提高性能
    return kosListMapper.updateBatchById(kosList) > 0;
}
```

#### 2.2 异步处理
- **异步更新**: 非关键数据异步更新
- **队列处理**: 使用消息队列处理批量操作
- **定时任务**: 使用定时任务处理数据同步

### 3. 缓存策略

#### 3.1 缓存设计
```java
@Service
public class KosListService {
    
    @Cacheable(value = "kosList", key = "#brandId + '_' + #userId")
    public KosList getKosByKey(String brandId, String userId) {
        return kosListMapper.selectByKey(brandId, userId);
    }
    
    @CacheEvict(value = "kosList", key = "#kos.brandId + '_' + #kos.userId")
    public boolean updateKos(KosList kos) {
        return kosListMapper.updateById(kos) > 0;
    }
}
```

#### 3.2 缓存策略
- **查询缓存**: 缓存热点查询结果
- **更新缓存**: 更新时清除相关缓存
- **缓存预热**: 系统启动时预热缓存
- **缓存监控**: 监控缓存命中率和性能

## 监控和日志

### 1. 业务监控

#### 1.1 关键指标
- **操作成功率**: 各种操作的成功率
- **响应时间**: 接口响应时间
- **并发数**: 系统并发用户数
- **错误率**: 系统错误率

#### 1.2 监控告警
- **性能告警**: 响应时间超过阈值时告警
- **错误告警**: 错误率超过阈值时告警
- **容量告警**: 系统容量接近上限时告警
- **业务告警**: 业务指标异常时告警

### 2. 操作日志

#### 2.1 日志记录
```java
public void logOperation(String operation, KosList kos) {
    OperationLog log = new OperationLog();
    log.setOperation(operation);
    log.setTableName("配置_小红书专业号_kos列表");
    log.setRecordId(kos.getBrandId() + "_" + kos.getUserId());
    log.setOldValue(JsonUtils.toJson(kos));
    log.setNewValue(JsonUtils.toJson(kos));
    log.setCreateTime(LocalDateTime.now());
    log.setCreateBy(getCurrentUser());
    
    operationLogService.save(log);
}
```

#### 2.2 日志分析
- **操作统计**: 统计各种操作的频率
- **用户行为**: 分析用户操作行为
- **异常分析**: 分析异常操作和错误
- **性能分析**: 分析操作性能瓶颈
