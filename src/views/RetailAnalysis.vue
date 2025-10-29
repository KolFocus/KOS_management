<template>
  <div class="retail-analysis">
    <el-card class="mb-16" shadow="hover">
      <div class="header-row">
        <div>
          <h2>零售分析</h2>
          <p class="subtitle">Retail Analysis Dashboard（模拟数据）</p>
        </div>
        <div class="filters">
          <span class="label">时间范围</span>
          <el-date-picker
            v-model="startWeek"
            type="week"
            format="gggg年第ww周"
            placeholder="开始周"
            @change="applyWeekRange"
          />
          <span class="ml-8">至</span>
          <el-date-picker
            v-model="endWeek"
            type="week"
            format="gggg年第ww周"
            placeholder="结束周"
            @change="applyWeekRange"
          />
          <el-button class="ml-8" type="primary" @click="refreshMockData">
            刷新模拟数据
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16" class="mb-16">
      <el-col :span="6" v-for="kpi in kpis" :key="kpi.key">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-title">{{ kpi.title }}</div>
          <div class="kpi-sub">{{ kpi.subtitle }}</div>
          <div class="kpi-value">{{ kpi.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mb-16" shadow="hover">
      <h3>Retail Piloting Performance</h3>
      <el-table :data="storeRows" border stripe class="mt-8">
        <el-table-column prop="store" label="Store Code / 所属店铺" min-width="180" />
        <el-table-column prop="notes" label="Notes Published / 发布笔记数" width="180" />
        <el-table-column prop="engagement" label="Engagement / 笔记互动量" width="160" />
        <el-table-column prop="inquiries" label="Inquires Received / 私信开口数" width="180" />
        <el-table-column prop="wecom" label="WeCom Recruitment / 企微留资数" width="180" />
        <el-table-column prop="turnover" label="Turnover / 期间成交量" width="180" />
      </el-table>
      <div class="table-footer">
        <el-pagination
          layout="prev, pager, next"
          :total="storeTotal"
          :page-size="10"
          v-model:current-page="storePage"
        />
      </div>
    </el-card>

    <el-card shadow="hover">
      <h3>Retail Performance (by Note)</h3>
      <el-table :data="noteRows" border stripe class="mt-8">
        <el-table-column prop="note" label="Note / 笔记" width="100" />
        <el-table-column label="Note Link / 笔记链接" width="120">
          <template #default="{ row }">
            <el-button type="primary" text @click="openLink(row.link)">Link</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="store" label="Store Code / 所属账号" width="160" />
        <el-table-column prop="cost" label="Cost / 投放消耗" width="140" />
        <el-table-column prop="engagement" label="Engagement / 笔记互动量" width="160" />
        <el-table-column prop="cpe" label="CPE / 互动成本" width="140" />
        <el-table-column prop="inquiries" label="Inquires Received / 私信开口数" width="180" />
        <el-table-column prop="inquiryCost" label="私信开口成本" width="140" />
        <el-table-column prop="summary" label="笔记内容总结" min-width="220" />
      </el-table>
      <div class="table-footer">
        <el-pagination
          layout="prev, pager, next"
          :total="noteTotal"
          :page-size="10"
          v-model:current-page="notePage"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'

const today = dayjs()
const startOfWeek = today.startOf('week').add(1, 'day') // 以周一为起始
const endOfWeek = startOfWeek.add(6, 'day')

const weekRange = ref([startOfWeek.format('YYYY-MM-DD'), endOfWeek.format('YYYY-MM-DD')])

// 以周为单位的起止选择（两个 week 选择器）
const startWeek = ref(startOfWeek.toDate())
const endWeek = ref(startOfWeek.toDate())

function applyWeekRange() {
  const s = dayjs(startWeek.value).startOf('week').add(1, 'day')
  const e = dayjs(endWeek.value).startOf('week').add(1, 'day').add(6, 'day')
  const from = s.isAfter(e) ? dayjs(endWeek.value).startOf('week').add(1, 'day') : s
  const to = s.isAfter(e) ? dayjs(startWeek.value).startOf('week').add(1, 'day').add(6, 'day') : e
  weekRange.value = [from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD')]
}

// 初始化时立即应用
applyWeekRange()

const dateShortcuts = [
  {
    text: '本周',
    value: () => {
      const s = dayjs().startOf('week').add(1, 'day')
      return [s.format('YYYY-MM-DD'), s.add(6, 'day').format('YYYY-MM-DD')]
    }
  },
  {
    text: '上周',
    value: () => {
      const s = dayjs().startOf('week').add(1, 'day').subtract(7, 'day')
      return [s.format('YYYY-MM-DD'), s.add(6, 'day').format('YYYY-MM-DD')]
    }
  }
]

// 模拟KPI
const kpis = ref([
  { key: 'accounts', title: 'Piloting Account', subtitle: '当前KOSA账号数', value: 23 },
  { key: 'paidAccounts', title: 'Account with Paid Promo', subtitle: '投广账号总数', value: 20 },
  { key: 'notes', title: 'Notes Published', subtitle: '发布笔记数', value: 101 },
  { key: 'paidNotes', title: 'Notes with Paid Promo', subtitle: '投广笔记数', value: 69 },
  { key: 'engagement', title: 'Engagement', subtitle: '笔记总互动数', value: '6,337' },
  { key: 'paidEngagement', title: 'Engagement from Paid', subtitle: '投广带来的互动量', value: 133 },
  { key: 'chats', title: 'Chats Initiated', subtitle: '私信进线数', value: 582 },
  { key: 'inquiries', title: 'Inquiries Received', subtitle: '私信开口数', value: 463 },
  { key: 'wecom', title: 'WeCom Recruitment', subtitle: '企微留资数', value: 107 },
  { key: 'efficiency', title: 'WeCom Recruitment Efficiency', subtitle: '企微留资率', value: '18.39%' },
  { key: 'cpr', title: 'CPR', subtitle: '企微留资成本', value: '¥65.87' },
  { key: 'turnover', title: 'Turnover', subtitle: '期间成交额', value: '¥348,200' }
])

// 模拟门店表
const storeAll = ref(Array.from({ length: 12 }).map((_, i) => ({
  store: ['A Ada Liu', 'G Guanguan', 'V Vanna Xue', 'B Bonnie Luo', 'S Sylvia Ma', 'A Aoki Li', 'A Amy Fan', 'S Summer Wang', 'E Eddie Yuan', 'A Adeline Lei', 'X Xuser', 'Y Yuser'][i],
  code: ['MNDJ','MQT','MNDJ','MZD','MNDJ','MCQM','MHMC','MBTK','MJC','MCS','MNDJ','MQT'][i],
  notes: [2,15,6,10,8,10,2,5,6,17,3,4][i],
  engagement: [12,17,7,15,5,14,13,12,14,19,8,6][i],
  inquiries: [15,6,4,4,6,7,7,4,5,7,3,2][i],
  wecom: [22,21,7,15,0,12,10,8,10,39,5,3][i],
  turnover: ['¥117,660','¥59,780','¥57,560','¥51,700','¥50,570','¥35,460','¥32,450','¥30,950','¥28,360','¥18,990','¥10,000','¥8,800'][i]
})))

const storePage = ref(1)
const storePageSize = 10
const storeTotal = computed(() => storeAll.value.length)
const storeRows = computed(() => {
  const start = (storePage.value - 1) * storePageSize
  return storeAll.value.slice(start, start + storePageSize)
})

// 模拟笔记表
const noteAll = ref(Array.from({ length: 12 }).map((_, i) => ({
  note: String.fromCharCode(65 + (i % 26)),
  link: 'https://example.com',
  store: ['Linda Luo','Bonnie Luo','Aoki Li','Test User 1','Test User 2','Test User 3','Test User 4','Test User 5','Test User 6','Test User 7','User 8','User 9'][i],
  cost: [0,0,0,100,150,200,120,180,160,140,80,60][i],
  engagement: [0,0,0,50,75,100,60,90,80,70,40,30][i],
  cpe: [ '-', '-', '-', 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0 ][i],
  inquiries: [0,0,0,5,8,10,6,9,8,7,4,3][i],
  inquiryCost: [ '-', '-', '-', 20.0, 18.75, 20.0, 20.0, 20.0, 20.0, 20.0, 20.0, 20.0 ][i],
  summary: ['真人试穿展示单品多功能性与高级感。','穿搭分享叩脑筋时尚性与个人风格','极简穿搭等韩版元素，突出品质时尚感。','测试笔记内容1','测试笔记内容2','测试笔记内容3','测试笔记内容4','测试笔记内容5','测试笔记内容6','测试笔记内容7','测试笔记内容8','测试笔记内容9'][i]
})))

const notePage = ref(1)
const notePageSize = 10
const noteTotal = computed(() => noteAll.value.length)
const noteRows = computed(() => {
  const start = (notePage.value - 1) * notePageSize
  return noteAll.value.slice(start, start + notePageSize)
})

function openLink(url) {
  window.open(url, '_blank')
}

function refreshMockData() {
  // 简单刷新: 修改某些KPI值产生变化
  kpis.value = kpis.value.map(k => ({
    ...k,
    value: typeof k.value === 'number' ? k.value + Math.round(Math.random()*5-2) : k.value
  }))
}

watch(weekRange, () => {
  // 切换日期时，这里预留未来接入真实数据的钩子
})
</script>

<style scoped>
.retail-analysis {
  padding: 8px;
}

.mb-16 { margin-bottom: 16px; }
.mt-8 { margin-top: 8px; }
.ml-8 { margin-left: 8px; }

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subtitle { color: #909399; font-size: 13px; margin-top: 4px; }

.filters { display: flex; align-items: center; gap: 8px; }
.label { color: #606266; }

.kpi-card { text-align: left; }
.kpi-title { color: #606266; font-size: 13px; }
.kpi-sub { color: #909399; font-size: 12px; }
.kpi-value { font-size: 22px; font-weight: 700; margin-top: 8px; }

.table-footer {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
</style>



