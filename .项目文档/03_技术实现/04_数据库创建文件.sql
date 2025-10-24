-- KOS管理系统数据库表创建脚本（最终版本）
-- 适用于Supabase PostgreSQL数据库
-- 请在Supabase Dashboard的SQL编辑器中执行此脚本

-- 1. 创建KOS列表表
CREATE TABLE IF NOT EXISTS "配置_小红书专业号_kos列表" (
  "品牌" TEXT,
  "品牌ID" VARCHAR(64) NOT NULL,
  "用户ID" VARCHAR(64) NOT NULL,
  "昵称" TEXT,
  "头像" TEXT,
  "排序" VARCHAR(4),
  "所属用户" TEXT,
  "所属店铺" TEXT,
  "渠道" VARCHAR(64),
  "参与统计" INTEGER DEFAULT 1,
  "AZ_批次号" VARCHAR(64) NOT NULL,
  "创建时间" TIMESTAMPTZ DEFAULT NOW(),
  "更新时间" TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY ("品牌ID", "用户ID")
);

-- 2. 创建销售数据表
CREATE TABLE IF NOT EXISTS "品牌离线导入_kos销售数据" (
  "id" BIGSERIAL PRIMARY KEY,
  "品牌" TEXT,
  "品牌ID" VARCHAR(64),
  "周期类型" VARCHAR(64),
  "日期" VARCHAR(64),
  "短日期" VARCHAR(64) NOT NULL,
  "员工姓名" VARCHAR(64),
  "店铺编号" VARCHAR(64),
  "小红书成单" DECIMAL(12,2) DEFAULT 0.00,
  "本期累计成单" INTEGER DEFAULT 0,
  "企微留资数" INTEGER DEFAULT 0,
  "创建时间" TIMESTAMPTZ DEFAULT NOW(),
  "更新时间" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建基础索引
CREATE INDEX IF NOT EXISTS "idx_kos_品牌ID" ON "配置_小红书专业号_kos列表" ("品牌ID");
CREATE INDEX IF NOT EXISTS "idx_kos_用户ID" ON "配置_小红书专业号_kos列表" ("用户ID");
CREATE INDEX IF NOT EXISTS "idx_kos_渠道" ON "配置_小红书专业号_kos列表" ("渠道");
CREATE INDEX IF NOT EXISTS "idx_kos_参与统计" ON "配置_小红书专业号_kos列表" ("参与统计");
CREATE INDEX IF NOT EXISTS "idx_kos_创建时间" ON "配置_小红书专业号_kos列表" ("创建时间");

CREATE INDEX IF NOT EXISTS "idx_sales_品牌ID" ON "品牌离线导入_kos销售数据" ("品牌ID");
CREATE INDEX IF NOT EXISTS "idx_sales_周期类型" ON "品牌离线导入_kos销售数据" ("周期类型");
CREATE INDEX IF NOT EXISTS "idx_sales_日期" ON "品牌离线导入_kos销售数据" ("日期");
CREATE INDEX IF NOT EXISTS "idx_sales_短日期" ON "品牌离线导入_kos销售数据" ("短日期");
CREATE INDEX IF NOT EXISTS "idx_sales_店铺编号" ON "品牌离线导入_kos销售数据" ("店铺编号");
CREATE INDEX IF NOT EXISTS "idx_sales_员工姓名" ON "品牌离线导入_kos销售数据" ("员工姓名");
CREATE INDEX IF NOT EXISTS "idx_sales_创建时间" ON "品牌离线导入_kos销售数据" ("创建时间");

-- 4. 创建复合索引（优化查询性能）
CREATE INDEX IF NOT EXISTS "idx_sales_brand_date" ON "品牌离线导入_kos销售数据" ("品牌ID", "短日期");
CREATE INDEX IF NOT EXISTS "idx_sales_employee_date" ON "品牌离线导入_kos销售数据" ("员工姓名", "短日期");
CREATE INDEX IF NOT EXISTS "idx_sales_cycle_date" ON "品牌离线导入_kos销售数据" ("周期类型", "短日期");

-- 5. 启用Row Level Security
ALTER TABLE "配置_小红书专业号_kos列表" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "品牌离线导入_kos销售数据" ENABLE ROW LEVEL SECURITY;

-- 6. 创建RLS策略 - 允许所有人读写（开发环境）
-- 生产环境建议修改为更严格的权限控制
CREATE POLICY "KOS列表_所有人可读写" ON "配置_小红书专业号_kos列表"
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "销售数据_所有人可读写" ON "品牌离线导入_kos销售数据"
    FOR ALL USING (true) WITH CHECK (true);

-- 7. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."更新时间" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. 创建更新时间触发器
CREATE TRIGGER update_kos_list_updated_at 
    BEFORE UPDATE ON "配置_小红书专业号_kos列表" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_data_updated_at 
    BEFORE UPDATE ON "品牌离线导入_kos销售数据" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 插入示例数据（与API代码中的模拟数据保持一致）
INSERT INTO "配置_小红书专业号_kos列表" (
  "品牌", "品牌ID", "用户ID", "昵称", "头像", "排序", 
  "所属用户", "所属店铺", "渠道", "参与统计", "AZ_批次号"
) VALUES 
('品牌A', '001', '1001', '张三', 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1', '1', '李四', '店铺A', '小红书', 1, 'AZ20240101001'),
('品牌A', '001', '1002', '李四', 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar2', '2', '王五', '店铺B', '小红书', 1, 'AZ20240101002'),
('品牌B', '002', '1003', '王五', 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar3', '1', '赵六', '店铺C', '抖音', 2, 'AZ20240101003'),
('品牌C', '003', '1004', '赵六', 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar4', '1', '孙七', '店铺D', '小红书', 2, 'AZ20240101004'),
('品牌D', '004', '1005', '孙七', 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar5', '1', '周八', '店铺E', '抖音', 1, 'AZ20240101005')
ON CONFLICT ("品牌ID", "用户ID") DO NOTHING;

INSERT INTO "品牌离线导入_kos销售数据" (
  "品牌", "品牌ID", "周期类型", "日期", "短日期", 
  "员工姓名", "店铺编号", "小红书成单", "本期累计成单", "企微留资数"
) VALUES 
('品牌A', '001', 'day', '2024-01-01', '2024-01-01', '张三', '001', 1000.00, 100, 10),
('品牌A', '001', 'day', '2024-01-02', '2024-01-02', '李四', '002', 2000.00, 200, 20),
('品牌B', '002', 'week', '2024-01-01', '2024-01-01', '王五', '003', 3000.00, 300, 30),
('品牌C', '003', 'month', '2024-01-01', '2024-01-01', '赵六', '004', 4000.00, 400, 40),
('品牌D', '004', 'day', '2024-01-01', '2024-01-01', '孙七', '005', 5000.00, 500, 50)
ON CONFLICT DO NOTHING;


-- 10. 完成提示
DO $$
BEGIN
    RAISE NOTICE 'KOS管理系统数据库表创建完成！';
    RAISE NOTICE '已创建表：配置_小红书专业号_kos列表, 品牌离线导入_kos销售数据';
    RAISE NOTICE '已创建索引和RLS策略';
    RAISE NOTICE '已插入示例数据';
    RAISE NOTICE '数据类型已修正为PostgreSQL兼容格式';
    RAISE NOTICE '参与统计状态：1=上线, 2=下线（前端硬编码）';
END $$;
