# KOS销售数据管理业务逻辑

## 业务概述

KOS销售数据管理是系统的重要业务模块，负责管理品牌离线导入的KOS销售数据，包括数据导入、展示、更新、统计分析等核心业务逻辑。该模块处理大量的销售数据，需要保证数据的准确性、完整性和实时性。

## 核心业务实体

### 1. 销售数据实体定义

#### 1.1 实体属性
```java
public class SalesData {
    private Long id;                    // 主键ID
    private String brand;               // 品牌名称
    private String brandId;             // 品牌ID
    private String cycleType;           // 周期类型：day、week、month、quarter、year
    private String date;                // 日期
    private String shortDate;           // 短日期格式
    private String employeeName;        // 员工姓名
    private String shopCode;            // 店铺编号
    private BigDecimal xiaohongshuOrder; // 小红书成单金额
    private Integer currentPeriodOrder;  // 本期累计成单数量
    private Integer qiweiLeads;         // 企微留资数量
    private LocalDateTime createTime;   // 创建时间
    private LocalDateTime updateTime;   // 更新时间
    private String createBy;            // 创建人
    private String updateBy;            // 更新人
}
```

#### 1.2 业务规则
- **主键约束**: ID字段自增主键
- **必填字段**: 短日期、品牌ID、员工姓名
- **数据格式**: 金额字段保留2位小数，数量字段为整数
- **周期类型**: 只能是预定义的周期类型值

## 核心业务逻辑

### 1. 销售数据查询逻辑

#### 1.1 查询条件处理
```java
public class SalesDataQuery {
    private String brandId;        // 品牌ID筛选
    private String cycleType;      // 周期类型筛选
    private String startDate;      // 开始日期
    private String endDate;        // 结束日期
    private String employeeName;   // 员工姓名筛选
    private String shopCode;       // 店铺编号筛选
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
- **索引优化**: 在品牌ID、日期、员工姓名等字段上建立索引
- **分页查询**: 使用LIMIT和OFFSET进行分页，避免全表扫描
- **缓存策略**: 对热点查询结果进行缓存
- **查询条件优化**: 优先使用索引字段作为查询条件

### 2. Excel导入逻辑

#### 2.1 导入流程
```java
public ImportResult importSalesData(MultipartFile file, String importMode) {
    ImportResult result = new ImportResult();
    
    try {
        // 1. 文件验证
        validateFile(file);
        
        // 2. 解析Excel文件
        List<SalesDataDTO> dataList = parseExcelFile(file);
        
        // 3. 数据验证
        ValidationResult validationResult = validateData(dataList);
        if (!validationResult.isValid()) {
            result.setSuccess(false);
            result.setErrors(validationResult.getErrors());
            return result;
        }
        
        // 4. 根据导入模式处理数据
        switch (importMode) {
            case "cover":
                result = importWithCover(dataList);
                break;
            case "append":
                result = importWithAppend(dataList);
                break;
            case "skip":
                result = importWithSkip(dataList);
                break;
            default:
                // 默认使用覆盖模式
                result = importWithCover(dataList);
        }
        
        // 5. 记录导入日志
        logImportOperation(file.getOriginalFilename(), importMode, result);
        
    } catch (Exception e) {
        log.error("导入销售数据失败", e);
        result.setSuccess(false);
        result.setMessage("导入失败: " + e.getMessage());
    }
    
    return result;
}
```

#### 2.2 文件解析逻辑
```java
private List<SalesDataDTO> parseExcelFile(MultipartFile file) throws IOException {
    List<SalesDataDTO> dataList = new ArrayList<>();
    
    try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
        Sheet sheet = workbook.getSheetAt(0);
        
        // 跳过标题行
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;
            
            SalesDataDTO data = new SalesDataDTO();
            data.setBrand(getCellValue(row.getCell(0)));
            data.setBrandId(getCellValue(row.getCell(1)));
            data.setCycleType(getCellValue(row.getCell(2)));
            data.setDate(getCellValue(row.getCell(3)));
            data.setShortDate(getCellValue(row.getCell(4)));
            data.setEmployeeName(getCellValue(row.getCell(5)));
            data.setShopCode(getCellValue(row.getCell(6)));
            data.setXiaohongshuOrder(parseDecimal(getCellValue(row.getCell(7))));
            data.setCurrentPeriodOrder(parseInteger(getCellValue(row.getCell(8))));
            data.setQiweiLeads(parseInteger(getCellValue(row.getCell(9))));
            
            dataList.add(data);
        }
    }
    
    return dataList;
}
```

#### 2.3 数据验证逻辑
```java
private ValidationResult validateData(List<SalesDataDTO> dataList) {
    ValidationResult result = new ValidationResult();
    
    for (int i = 0; i < dataList.size(); i++) {
        SalesDataDTO data = dataList.get(i);
        List<String> errors = new ArrayList<>();
        
        // 必填字段验证
        if (StringUtils.isBlank(data.getShortDate())) {
            errors.add("第" + (i + 2) + "行：短日期不能为空");
        }
        if (StringUtils.isBlank(data.getBrandId())) {
            errors.add("第" + (i + 2) + "行：品牌ID不能为空");
        }
        if (StringUtils.isBlank(data.getEmployeeName())) {
            errors.add("第" + (i + 2) + "行：员工姓名不能为空");
        }
        
        // 格式验证
        if (!isValidDate(data.getShortDate())) {
            errors.add("第" + (i + 2) + "行：日期格式不正确");
        }
        if (!isValidCycleType(data.getCycleType())) {
            errors.add("第" + (i + 2) + "行：周期类型不正确");
        }
        if (data.getXiaohongshuOrder() != null && data.getXiaohongshuOrder().compareTo(BigDecimal.ZERO) < 0) {
            errors.add("第" + (i + 2) + "行：成单金额不能为负数");
        }
        
        if (!errors.isEmpty()) {
            result.addErrors(errors);
        }
    }
    
    return result;
}
```

#### 2.4 导入模式处理

**覆盖模式**
```java
private ImportResult importWithCover(List<SalesDataDTO> dataList) {
    ImportResult result = new ImportResult();
    int successCount = 0;
    int failCount = 0;
    
    for (SalesDataDTO data : dataList) {
        try {
            // 查找现有记录
            SalesData existing = findExistingData(data);
            if (existing != null) {
                // 更新现有记录
                updateSalesData(existing, data);
            } else {
                // 插入新记录
                insertSalesData(data);
            }
            successCount++;
        } catch (Exception e) {
            failCount++;
            result.addError("处理数据失败: " + e.getMessage());
        }
    }
    
    result.setSuccessCount(successCount);
    result.setFailCount(failCount);
    return result;
}
```

**追加模式**
```java
private ImportResult importWithAppend(List<SalesDataDTO> dataList) {
    ImportResult result = new ImportResult();
    int successCount = 0;
    int failCount = 0;
    
    for (SalesDataDTO data : dataList) {
        try {
            // 直接插入新记录
            insertSalesData(data);
            successCount++;
        } catch (Exception e) {
            failCount++;
            result.addError("插入数据失败: " + e.getMessage());
        }
    }
    
    result.setSuccessCount(successCount);
    result.setFailCount(failCount);
    return result;
}
```

**跳过模式**
```java
private ImportResult importWithSkip(List<SalesDataDTO> dataList) {
    ImportResult result = new ImportResult();
    int successCount = 0;
    int failCount = 0;
    
    for (SalesDataDTO data : dataList) {
        try {
            // 检查是否存在重复数据
            SalesData existing = findExistingData(data);
            if (existing == null) {
                // 插入新记录
                insertSalesData(data);
                successCount++;
            } else {
                // 跳过重复数据
                result.addSkipped("跳过重复数据: " + data.getShortDate() + "_" + data.getEmployeeName());
            }
        } catch (Exception e) {
            failCount++;
            result.addError("处理数据失败: " + e.getMessage());
        }
    }
    
    result.setSuccessCount(successCount);
    result.setFailCount(failCount);
    return result;
}
```

### 3. 数据更新逻辑

#### 3.1 单条记录更新
```java
public boolean updateSalesData(SalesDataDTO salesData) {
    // 1. 参数验证
    validateSalesData(salesData);
    
    // 2. 记录存在性检查
    SalesData existing = salesDataMapper.selectById(salesData.getId());
    if (existing == null) {
        throw new BusinessException("销售数据记录不存在");
    }
    
    // 3. 业务规则验证
    validateBusinessRules(salesData);
    
    // 4. 数据转换
    SalesData entity = convertToEntity(salesData);
    entity.setUpdateTime(LocalDateTime.now());
    entity.setUpdateBy(getCurrentUser());
    
    // 5. 更新数据
    int result = salesDataMapper.updateById(entity);
    
    // 6. 记录操作日志
    logOperation("UPDATE", entity);
    
    // 7. 更新相关统计
    updateRelatedStatistics(entity);
    
    return result > 0;
}
```

#### 3.2 批量更新逻辑
```java
public BatchUpdateResult batchUpdateSalesData(List<SalesDataDTO> salesDataList) {
    BatchUpdateResult result = new BatchUpdateResult();
    
    // 使用事务确保数据一致性
    TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
    
    return transactionTemplate.execute(status -> {
        for (SalesDataDTO data : salesDataList) {
            try {
                boolean success = updateSalesData(data);
                if (success) {
                    result.addSuccess(data);
                } else {
                    result.addFailure(data, "更新失败");
                }
            } catch (Exception e) {
                result.addFailure(data, e.getMessage());
            }
        }
        return result;
    });
}
```

### 4. 统计分析逻辑

#### 4.1 统计概览计算
```java
public SalesStatistics getSalesStatistics(SalesDataQuery query) {
    SalesStatistics statistics = new SalesStatistics();
    
    // 1. 基础统计
    statistics.setTotalOrderAmount(calculateTotalOrderAmount(query));
    statistics.setTotalLeads(calculateTotalLeads(query));
    statistics.setAverageOrderAmount(calculateAverageOrderAmount(query));
    statistics.setOrderRate(calculateOrderRate(query));
    
    // 2. 趋势数据
    statistics.setTrendData(getTrendData(query));
    
    // 3. 品牌分布
    statistics.setBrandDistribution(getBrandDistribution(query));
    
    // 4. 员工排名
    statistics.setEmployeeRanking(getEmployeeRanking(query));
    
    return statistics;
}
```

#### 4.2 趋势数据分析
```java
private List<TrendData> getTrendData(SalesDataQuery query) {
    List<TrendData> trendData = new ArrayList<>();
    
    // 根据周期类型确定时间间隔
    String interval = getTimeInterval(query.getCycleType());
    
    // 查询趋势数据
    List<Map<String, Object>> rawData = salesDataMapper.getTrendData(query, interval);
    
    for (Map<String, Object> row : rawData) {
        TrendData data = new TrendData();
        data.setDate((String) row.get("date"));
        data.setOrderAmount((BigDecimal) row.get("orderAmount"));
        data.setLeads((Integer) row.get("leads"));
        data.setOrderCount((Integer) row.get("orderCount"));
        trendData.add(data);
    }
    
    return trendData;
}
```

#### 4.3 员工排名计算
```java
private List<EmployeeRanking> getEmployeeRanking(SalesDataQuery query) {
    List<EmployeeRanking> ranking = new ArrayList<>();
    
    // 查询员工业绩数据
    List<Map<String, Object>> rawData = salesDataMapper.getEmployeeRanking(query);
    
    for (int i = 0; i < rawData.size(); i++) {
        Map<String, Object> row = rawData.get(i);
        EmployeeRanking data = new EmployeeRanking();
        data.setRank(i + 1);
        data.setEmployeeName((String) row.get("employeeName"));
        data.setOrderAmount((BigDecimal) row.get("orderAmount"));
        data.setLeads((Integer) row.get("leads"));
        data.setOrderCount((Integer) row.get("orderCount"));
        ranking.add(data);
    }
    
    return ranking;
}
```

### 5. 数据导出逻辑

#### 5.1 Excel导出
```java
public void exportSalesData(SalesDataQuery query, HttpServletResponse response) {
    try {
        // 1. 查询数据
        List<SalesData> dataList = getSalesDataList(query);
        
        // 2. 创建Excel工作簿
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("销售数据");
        
        // 3. 创建标题行
        createHeaderRow(sheet);
        
        // 4. 填充数据
        fillDataRows(sheet, dataList);
        
        // 5. 设置响应头
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=sales_data.xlsx");
        
        // 6. 输出文件
        workbook.write(response.getOutputStream());
        workbook.close();
        
    } catch (Exception e) {
        log.error("导出销售数据失败", e);
        throw new BusinessException("导出失败: " + e.getMessage());
    }
}
```

#### 5.2 CSV导出
```java
public void exportSalesDataToCSV(SalesDataQuery query, HttpServletResponse response) {
    try {
        // 1. 查询数据
        List<SalesData> dataList = getSalesDataList(query);
        
        // 2. 设置响应头
        response.setContentType("text/csv;charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=sales_data.csv");
        
        // 3. 创建CSV写入器
        PrintWriter writer = response.getWriter();
        
        // 4. 写入标题行
        writer.println("品牌,品牌ID,周期类型,日期,短日期,员工姓名,店铺编号,小红书成单,本期累计成单,企微留资数");
        
        // 5. 写入数据行
        for (SalesData data : dataList) {
            writer.println(String.format("%s,%s,%s,%s,%s,%s,%s,%.2f,%d,%d",
                data.getBrand(), data.getBrandId(), data.getCycleType(),
                data.getDate(), data.getShortDate(), data.getEmployeeName(),
                data.getShopCode(), data.getXiaohongshuOrder(),
                data.getCurrentPeriodOrder(), data.getQiweiLeads()));
        }
        
        writer.close();
        
    } catch (Exception e) {
        log.error("导出CSV数据失败", e);
        throw new BusinessException("导出失败: " + e.getMessage());
    }
}
```

### 6. 数据同步逻辑

#### 6.1 增量同步
```java
public void syncIncrementalData() {
    // 1. 获取上次同步时间
    LocalDateTime lastSyncTime = getLastSyncTime();
    
    // 2. 查询增量数据
    List<SalesData> incrementalData = salesDataMapper.getIncrementalData(lastSyncTime);
    
    // 3. 处理增量数据
    for (SalesData data : incrementalData) {
        try {
            syncSingleData(data);
        } catch (Exception e) {
            log.error("同步单条数据失败: {}", data.getId(), e);
        }
    }
    
    // 4. 更新同步时间
    updateLastSyncTime(LocalDateTime.now());
}
```

#### 6.2 全量同步
```java
public void syncFullData() {
    // 1. 备份现有数据
    backupCurrentData();
    
    // 2. 清空现有数据
    salesDataMapper.deleteAll();
    
    // 3. 重新导入数据
    importFullData();
    
    // 4. 验证数据完整性
    validateDataIntegrity();
}
```

### 7. 数据清理逻辑

#### 7.1 历史数据清理
```java
@Scheduled(cron = "0 0 2 * * ?") // 每天凌晨2点执行
public void cleanHistoricalData() {
    // 1. 获取清理配置
    int retentionDays = getDataRetentionDays();
    
    // 2. 计算清理时间点
    LocalDateTime cutoffTime = LocalDateTime.now().minusDays(retentionDays);
    
    // 3. 清理历史数据
    int deletedCount = salesDataMapper.deleteHistoricalData(cutoffTime);
    
    // 4. 记录清理日志
    log.info("清理历史数据完成，删除记录数: {}", deletedCount);
}
```

#### 7.2 重复数据清理
```java
public void cleanDuplicateData() {
    // 1. 查找重复数据
    List<DuplicateData> duplicates = salesDataMapper.findDuplicateData();
    
    // 2. 处理重复数据
    for (DuplicateData duplicate : duplicates) {
        try {
            // 保留最新记录，删除旧记录
            keepLatestRecord(duplicate);
        } catch (Exception e) {
            log.error("处理重复数据失败: {}", duplicate.getId(), e);
        }
    }
}
```

## 异常处理

### 1. 导入异常处理

#### 1.1 文件异常
```java
public class FileImportException extends BusinessException {
    
    public static final String FILE_FORMAT_ERROR = "FILE_001";
    public static final String FILE_SIZE_ERROR = "FILE_002";
    public static final String FILE_READ_ERROR = "FILE_003";
    
    public FileImportException(String code, String message) {
        super(code, message);
    }
}
```

#### 1.2 数据异常
```java
public class DataValidationException extends BusinessException {
    
    public static final String REQUIRED_FIELD_MISSING = "DATA_001";
    public static final String INVALID_FORMAT = "DATA_002";
    public static final String DUPLICATE_DATA = "DATA_003";
    
    public DataValidationException(String code, String message) {
        super(code, message);
    }
}
```

### 2. 系统异常处理

#### 2.1 数据库异常
- **连接异常**: 数据库连接失败时的处理
- **事务异常**: 事务回滚时的处理
- **锁异常**: 数据库锁冲突时的处理
- **超时异常**: 数据库操作超时时的处理

#### 2.2 文件异常
- **文件不存在**: 文件不存在时的处理
- **文件格式错误**: 文件格式不正确时的处理
- **文件大小超限**: 文件大小超过限制时的处理
- **文件读取失败**: 文件读取失败时的处理

## 性能优化

### 1. 查询优化

#### 1.1 索引优化
```sql
-- 主键索引
PRIMARY KEY (`id`)

-- 单列索引
KEY `idx_品牌ID` (`品牌ID`)
KEY `idx_周期类型` (`周期类型`)
KEY `idx_日期` (`日期`)
KEY `idx_短日期` (`短日期`)
KEY `idx_店铺编号` (`店铺编号`)
KEY `idx_员工姓名` (`员工姓名`)

-- 复合索引
KEY `idx_品牌_日期` (`品牌ID`, `日期`)
KEY `idx_员工_日期` (`员工姓名`, `日期`)
KEY `idx_店铺_日期` (`店铺编号`, `日期`)
```

#### 1.2 查询优化
- **分页查询**: 使用LIMIT和OFFSET进行分页
- **条件优化**: 优先使用索引字段作为查询条件
- **排序优化**: 使用索引字段进行排序
- **缓存策略**: 对热点查询结果进行缓存

### 2. 导入优化

#### 2.1 批量处理
```java
public void batchImportData(List<SalesDataDTO> dataList) {
    // 分批处理，每批1000条
    int batchSize = 1000;
    for (int i = 0; i < dataList.size(); i += batchSize) {
        int endIndex = Math.min(i + batchSize, dataList.size());
        List<SalesDataDTO> batch = dataList.subList(i, endIndex);
        
        // 批量插入
        salesDataMapper.batchInsert(batch);
    }
}
```

#### 2.2 异步处理
- **异步导入**: 大文件异步导入处理
- **队列处理**: 使用消息队列处理导入任务
- **进度通知**: 实时通知导入进度

### 3. 缓存策略

#### 3.1 查询缓存
```java
@Service
public class SalesDataService {
    
    @Cacheable(value = "salesStatistics", key = "#query.toString()")
    public SalesStatistics getSalesStatistics(SalesDataQuery query) {
        return calculateStatistics(query);
    }
    
    @CacheEvict(value = "salesStatistics", allEntries = true)
    public boolean updateSalesData(SalesDataDTO data) {
        return salesDataMapper.updateById(convertToEntity(data)) > 0;
    }
}
```

#### 3.2 缓存策略
- **统计缓存**: 缓存统计计算结果
- **查询缓存**: 缓存热点查询结果
- **更新缓存**: 更新时清除相关缓存
- **缓存预热**: 系统启动时预热缓存

## 监控和日志

### 1. 业务监控

#### 1.1 关键指标
- **导入成功率**: 数据导入的成功率
- **查询响应时间**: 查询接口的响应时间
- **数据准确性**: 数据导入的准确性
- **系统吞吐量**: 系统处理数据的能力

#### 1.2 监控告警
- **导入失败告警**: 导入失败时发送告警
- **性能告警**: 响应时间超过阈值时告警
- **数据异常告警**: 数据异常时发送告警
- **容量告警**: 数据量接近上限时告警

### 2. 操作日志

#### 2.1 导入日志
```java
public void logImportOperation(String filename, String importMode, ImportResult result) {
    ImportLog log = new ImportLog();
    log.setFilename(filename);
    log.setImportMode(importMode);
    log.setTotalCount(result.getTotalCount());
    log.setSuccessCount(result.getSuccessCount());
    log.setFailCount(result.getFailCount());
    log.setCreateTime(LocalDateTime.now());
    log.setCreateBy(getCurrentUser());
    
    importLogService.save(log);
}
```

#### 2.2 操作日志
```java
public void logOperation(String operation, SalesData data) {
    OperationLog log = new OperationLog();
    log.setOperation(operation);
    log.setTableName("品牌离线导入_kos销售数据");
    log.setRecordId(data.getId().toString());
    log.setOldValue(JsonUtils.toJson(data));
    log.setNewValue(JsonUtils.toJson(data));
    log.setCreateTime(LocalDateTime.now());
    log.setCreateBy(getCurrentUser());
    
    operationLogService.save(log);
}
```

### 3. 日志分析

#### 3.1 导入分析
- **导入成功率分析**: 分析导入成功率趋势
- **错误类型分析**: 分析导入错误类型分布
- **性能分析**: 分析导入性能瓶颈
- **用户行为分析**: 分析用户导入行为

#### 3.2 操作分析
- **操作频率分析**: 分析各种操作的频率
- **用户活跃度分析**: 分析用户活跃度
- **数据变化分析**: 分析数据变化趋势
- **异常操作分析**: 分析异常操作模式
