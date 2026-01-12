import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plvjtbzwbxmajnkanhbe.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdmp0Ynp3YnhtYWpua2FuaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzODE4NjUsImV4cCI6MjA3NTk1Nzg2NX0.oQVOyp-dGdUqctn6dfvhWnFp2TUDOwY_y0M5_vl9e7U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表名常量
export const TABLES = {
  KOS_LIST: '配置_小红书专业号_kos列表',
  SALES_DATA: '品牌离线导入_kos销售数据',
  KOS_ACCOUNT: '小红书专业号_kos账号数据',
  KOS_LEADS: '小红书专业号_kos线索统计',
  KOS_ON_OFF_RECORD: 'kos_on_off_record'
}

// 状态常量（1=参与，0=不参与）
export const STATUS = {
  ONLINE: 1,
  OFFLINE: 0
}

// 移除周期类型常量，允许自由输入

