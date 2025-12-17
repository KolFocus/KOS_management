import { supabase, TABLES } from '../utils/supabase'
import { getCurrentUserId } from '../utils/userIsolation'
import dayjs from 'dayjs'

// 零售仪表盘聚合服务（方式1：只看有投放消耗的账号）
export class RetailDashboardAPI {
  static async getKpis(params = {}) {
    const { brandId = '', startDate, endDate, cycleType = '', channel = '', reportScope = 'all' } = params

    const supaUserId = await getCurrentUserId()
    if (!supaUserId) {
      throw new Error('用户未登录，无法获取零售仪表盘数据')
    }

    // 0) 品牌ID过滤：通过 用户平台表 把品牌映射为 平台ID集合 → 品牌ID IN (平台ID集合)
    let allowedBrandIds = []
    let brandFilterStrategy = 'none'
    if (brandId) {
      const { data: platformRows, error: platformErr } = await supabase
        .from('用户平台表')
        .select('平台ID')
        .eq('supabase_user_id', supaUserId)
        .eq('品牌ID', brandId)
      if (platformErr) {
        throw new Error(`获取品牌平台映射失败: ${platformErr.message}`)
      }
      allowedBrandIds = (platformRows || []).map(r => r.平台ID).filter(Boolean)
      if (brandId && !allowedBrandIds.includes(brandId)) {
        allowedBrandIds.push(brandId)
      }
      brandFilterStrategy = allowedBrandIds.length > 0 ? 'platformIds' : 'brandId'
    }

    // 优先走后端单次查询（RPC：kos_summary_report_v2/kos_summary_report_v2_1），由后端完成聚合与口径统一
    try {
      const rpcName = reportScope === 'paid' ? 'kos_summary_report_v2_1' : 'kos_summary_report_v2'
      const resolvedBrandIds = (allowedBrandIds.length > 0 ? allowedBrandIds : (brandId ? [brandId] : null))
      // 重要：PostgREST 要求参数名与函数签名严格匹配。不要混传两套参数名。
      const rpcParams = rpcName === 'kos_summary_report_v2_1'
        ? {
            p_brand_ids: resolvedBrandIds,
            p_start_date: startDate || null,
            p_end_date: endDate || null,
            p_channel: channel || null
          }
        : {
            brand_ids: resolvedBrandIds,
        start_date: startDate || null,
        end_date: endDate || null,
        channel: channel || null
      }
      const { data: rpcData, error: rpcError } = await supabase.rpc(rpcName, rpcParams)
      if (rpcError) throw rpcError
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      if (row && typeof row === 'object') {
        // 兼容不同 RPC 字段名（语义名/别名），并做一次包含词的兜底匹配
        const v = (primary, alias) => {
          const v1 = row[primary]
          if (v1 !== undefined && v1 !== null) return v1
          return row[alias]
        }
        const pickByTokens = (tokens = []) => {
          const keys = Object.keys(row)
          const lt = tokens.map(t => String(t).toLowerCase())
          for (const k of keys) {
            const lk = k.toLowerCase()
            if (lt.every(t => lk.includes(t))) return row[k]
        }
          return undefined
        }

        const num = (val, fallbackKeys = []) => {
          let n = Number(val)
          if (!isNaN(n)) return n
          for (const [p, a] of fallbackKeys) {
            const vv = v(p, a)
            n = Number(vv)
            if (!isNaN(n)) return n
          }
          return 0
        }

        let currentKosAccounts, paidAccounts, sumPublishedNotes, sumPaidNotes, sumTotalEngagement,
            sumPaidEngagement, sumInboundChats, sumInquiries, sumWecomLeads, efficiency, cpr, sumOrderAmount

        if (rpcName === 'kos_summary_report_v2_1') {
          // 明确映射：投放口径（你提供的字段）
          currentKosAccounts = Number(row.t_acc_6 || 0)
          paidAccounts = Number(row.t_ac6_7 || 0)
          sumPublishedNotes = Number(row.t_ab2_8 || 0)
          sumPaidNotes = Number(row.t_a33_9 || 0)
          sumTotalEngagement = Number(row.t_aea_10 || 0)
          sumPaidEngagement = Number(row.t_abf_11 || 0)
          sumInboundChats = Number(row.t_afe_12 || 0)
          sumInquiries = Number(row.t_a4a_13 || 0)
          sumWecomLeads = Number(row.t_a7f_14 || 0)
          efficiency = row.t_a4f_15 ?? null
          cpr = row.t_a62_16 ?? null
          sumOrderAmount = Number(row.t_aec_17 || 0)
        } else {
          // 语义优先 + 旧别名/包含词兜底（全部口径）
          currentKosAccounts = num(v('current_accounts', 't_acc_6'), [['current_accounts','t_acc_6']])
          paidAccounts = num(v('paid_accounts', 't_ac6_7'), [['paid_accounts','t_ac6_7']])
          sumPublishedNotes = num(
            v('published_notes', 't_a2e_8') ?? pickByTokens(['published','notes']),
            [['published_notes','t_a2e_8']]
          )
          sumPaidNotes = num(
            v('paid_notes', 't_a33_9') ?? pickByTokens(['paid','notes']),
            [['paid_notes','t_a33_9']]
          )
          sumTotalEngagement = num(
            v('total_engagement', 't_a97_10') ?? pickByTokens(['total','engagement']) ?? row['engagement'],
            [['total_engagement','t_a97_10']]
          )
          sumPaidEngagement = num(
            v('paid_engagement', 't_a39_11') ?? pickByTokens(['paid','engagement']),
            [['paid_engagement','t_a39_11']]
          )
          sumInboundChats = num(
            v('inbound_chats', 't_ae3_12') ?? pickByTokens(['chats','initiated']) ?? row['chats'],
            [['inbound_chats','t_ae3_12']]
          )
          sumInquiries = num(
            v('inquiries', 't_a88_13') ?? pickByTokens(['inquiries']),
            [['inquiries','t_a88_13']]
          )
          sumWecomLeads = num(
            v('wecom_leads', 't_a4a_14') ?? pickByTokens(['wecom','lead']),
            [['wecom_leads','t_a4a_14']]
          )
          efficiency = (v('efficiency', 't_adb_15') ?? row['wecom_recruitment_efficiency']) ?? null
          cpr = (v('cpr', 't_ad0_16') ?? row['wecom_recruitment_cpr']) ?? null
          sumOrderAmount = num(
            v('turnover', 't_a21_17') ?? pickByTokens(['turnover']) ?? row['order_amount'],
            [['turnover','t_a21_17']]
          )
        }

        return {
          ...RetailDashboardAPI._formatKpis(
            currentKosAccounts,
            paidAccounts,
            sumPublishedNotes,
            sumPaidNotes,
            sumTotalEngagement,
            sumPaidEngagement,
            sumInboundChats,
            sumInquiries,
            sumWecomLeads,
            efficiency,
            cpr,
            sumOrderAmount
          ),
          meta: { source: 'rpc', functionName: rpcName }
        }
      }
    } catch (e) {
      // 如果 RPC 不可用，则回退到前端组合查询
    }

    // 1) 读取参与统计账号（枢纽表）
    let kosListQuery = supabase
      .from(TABLES.KOS_LIST)
      .select('品牌ID, 用户ID, 所属用户, 所属店铺', { count: 'exact' })
      .eq('supabase_user_id', supaUserId)
      .eq('参与统计', 1)

    if (allowedBrandIds.length > 0) kosListQuery = kosListQuery.in('品牌ID', allowedBrandIds)
    else if (brandId) kosListQuery = kosListQuery.eq('品牌ID', brandId)
    if (channel) kosListQuery = kosListQuery.eq('渠道', channel)

    const { data: kosList, error: kosListError } = await kosListQuery
    if (kosListError) throw new Error(`获取KOS列表失败: ${kosListError.message}`)
    if (!kosList || kosList.length === 0) {
      return { ...RetailDashboardAPI._formatKpis(0,0,0,0,0,0,0,0,0,null,null), meta: { brandIds: [], brandCount: 0 } }
    }

    const userIds = kosList.map(k => k.用户ID)
    const storeCodes = kosList.map(k => k.所属店铺).filter(Boolean)
    const employeeNames = kosList.map(k => k.所属用户).filter(Boolean)

    // 2) 账号投放与互动（发布笔记数/投广笔记数/总互动数/消耗）
    const toShort = (d) => dayjs(d).format('YYYYMMDD')
    const startShort = startDate ? toShort(startDate) : ''
    const endShort = endDate ? toShort(endDate) : ''

    let accountQuery = supabase
      .from(TABLES.KOS_ACCOUNT)
      .select('用户ID, 品牌ID, 周期类型, 日期, 短日期, 发布笔记数, 投广笔记数, 总互动数, 笔记投广消耗')
      .in('用户ID', userIds)

    if (allowedBrandIds.length > 0) accountQuery = accountQuery.in('品牌ID', allowedBrandIds)
    else if (brandId) accountQuery = accountQuery.eq('品牌ID', brandId)
    if (cycleType) accountQuery = accountQuery.eq('周期类型', cycleType)
    if (startDate && endDate) accountQuery = accountQuery.gte('短日期', startShort).lte('短日期', endShort)

    let { data: accountRows, error: accountError } = await accountQuery
    if (accountError) throw new Error(`获取账号投放数据失败: ${accountError.message}`)

    // 短日期无数据则回退到 日期 字段
    if ((accountRows || []).length === 0 && startDate && endDate) {
      let fallbackQuery = supabase
        .from(TABLES.KOS_ACCOUNT)
        .select('用户ID, 品牌ID, 周期类型, 日期, 发布笔记数, 投广笔记数, 总互动数, 笔记投广消耗')
        .in('用户ID', userIds)
      if (allowedBrandIds.length > 0) fallbackQuery = fallbackQuery.in('品牌ID', allowedBrandIds)
      else if (brandId) fallbackQuery = fallbackQuery.eq('品牌ID', brandId)
      if (cycleType) fallbackQuery = fallbackQuery.eq('周期类型', cycleType)
      fallbackQuery = fallbackQuery.gte('日期', startDate).lte('日期', endDate)
      const { data: fallbackRows } = await fallbackQuery
      if (Array.isArray(fallbackRows)) accountRows = fallbackRows
    }

    const filteredAccountRows = (accountRows || []).filter(r => {
      const paidNotes = Number(r.投广笔记数 || 0)
      const spend = Number(r.笔记投广消耗 || 0)
      return paidNotes > 0 || spend > 0
    })

    // 3) 线索统计（进线/开口）
    let leadsQuery = supabase
      .from(TABLES.KOS_LEADS)
      .select('用户ID, 品牌ID, 日期, 私信进线人数, 私信开口人数')
      .in('用户ID', userIds)

    if (allowedBrandIds.length > 0) leadsQuery = leadsQuery.in('品牌ID', allowedBrandIds)
    else if (brandId) leadsQuery = leadsQuery.eq('品牌ID', brandId)
    if (startDate && endDate) leadsQuery = leadsQuery.gte('日期', startDate).lte('日期', endDate)

    const { data: leadsRows, error: leadsError } = await leadsQuery
    if (leadsError) throw new Error(`获取线索统计失败: ${leadsError.message}`)

    // 4) 销售数据（企微留资数/小红书成单）
    let salesQuery = supabase
      .from(TABLES.SALES_DATA)
      .select('品牌ID, 周期类型, 日期, 员工姓名, 店铺编号, 小红书成单, 企微留资数')
      .eq('supabase_user_id', supaUserId)

    if (allowedBrandIds.length > 0) salesQuery = salesQuery.in('品牌ID', allowedBrandIds)
    else if (brandId) salesQuery = salesQuery.eq('品牌ID', brandId)
    if (cycleType) salesQuery = salesQuery.eq('周期类型', cycleType)
    if (startDate && endDate) salesQuery = salesQuery.gte('日期', startDate).lte('日期', endDate)
    if (storeCodes.length > 0) salesQuery = salesQuery.in('店铺编号', storeCodes)
    if (employeeNames.length > 0) salesQuery = salesQuery.in('员工姓名', employeeNames)

    const { data: salesRows, error: salesError } = await salesQuery
    if (salesError) throw new Error(`获取销售数据失败: ${salesError.message}`)

    // 5) 聚合
    const participatingAccountUserIds = new Set(filteredAccountRows.map(r => r.用户ID))
    const currentKosAccounts = new Set(
      kosList.filter(k => participatingAccountUserIds.has(k.用户ID)).map(k => k.用户ID)
    ).size
    const paidAccounts = currentKosAccounts

    let sumPublishedNotes = 0, sumPaidNotes = 0, sumTotalEngagement = 0, sumSpend = 0
    for (const row of filteredAccountRows) {
      sumPublishedNotes += Number(row.发布笔记数 || 0)
      sumPaidNotes += Number(row.投广笔记数 || 0)
      sumTotalEngagement += Number(row.总互动数 || 0)
      sumSpend += Number(row.笔记投广消耗 || 0)
    }

    let sumInboundChats = 0, sumInquiries = 0
    for (const row of (leadsRows || [])) {
      if (!participatingAccountUserIds.has(row.用户ID)) continue
      sumInboundChats += Number(row.私信进线人数 || 0)
      sumInquiries += Number(row.私信开口人数 || 0)
    }

    let sumWecomLeads = 0, sumOrderAmount = 0
    for (const row of (salesRows || [])) {
      sumWecomLeads += Number(row.企微留资数 || 0)
      sumOrderAmount += Number(row.小红书成单 || 0)
    }

    const efficiency = (sumInboundChats > 0) ? (sumWecomLeads * 1.0) / sumInboundChats : null
    const cpr = (sumWecomLeads > 0) ? (sumSpend * 1.0) / sumWecomLeads : null

    const brandIdsSet = new Set(kosList.map(k => k.品牌ID).filter(Boolean))
    const meta = {
      brandIds: Array.from(brandIdsSet),
      brandCount: brandIdsSet.size,
      brandFilterStrategy,
      allowedBrandIdsCount: allowedBrandIds.length,
      kosListCount: (kosList || []).length,
      accountRowsCount: (accountRows || []).length,
      filteredAccountRowsCount: (filteredAccountRows || []).length,
      leadsRowsCount: (leadsRows || []).length,
      salesRowsCount: (salesRows || []).length,
      channelApplied: !!channel,
      timeRange: { startDate, endDate }
    }

    return {
      ...RetailDashboardAPI._formatKpis(
        currentKosAccounts,
        paidAccounts,
        sumPublishedNotes,
        sumPaidNotes,
        sumTotalEngagement,
        null,
        sumInboundChats,
        sumInquiries,
        sumWecomLeads,
        efficiency,
        cpr,
        sumOrderAmount
      ),
      meta
    }
  }

  static _formatKpis(
    currentKosAccounts,
    paidAccounts,
    sumPublishedNotes,
    sumPaidNotes,
    sumTotalEngagement,
    sumPaidEngagement,
    sumInboundChats,
    sumInquiries,
    sumWecomLeads,
    efficiency,
    cpr,
    sumOrderAmount
  ) {
    const formatMoney = (n) => {
      if (n === null || n === undefined) return '-'
      return `¥${Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
    }
    const formatPercent = (n) => {
      if (n === null || n === undefined) return '-'
      return `${(n * 100).toFixed(2)}%`
    }

    const kpis = [
      { key: 'accounts', title: 'Piloting Account', subtitle: '当前KOSA账号数', value: currentKosAccounts },
      { key: 'paidAccounts', title: 'Account with Paid Promo', subtitle: '投广账号总数', value: paidAccounts },
      { key: 'notes', title: 'Notes Published', subtitle: '发布笔记数', value: sumPublishedNotes },
      { key: 'paidNotes', title: 'Notes with Paid Promo', subtitle: '投广笔记数', value: sumPaidNotes },
      { key: 'engagement', title: 'Engagement', subtitle: '笔记总互动数', value: sumTotalEngagement },
      { key: 'paidEngagement', title: 'Engagement from Paid', subtitle: '投广带来的互动量', value: sumPaidEngagement ?? '-' },
      { key: 'chats', title: 'Chats Initiated', subtitle: '私信进线数', value: sumInboundChats },
      { key: 'inquiries', title: 'Inquiries Received', subtitle: '私信开口数', value: sumInquiries },
      { key: 'wecom', title: 'WeCom Recruitment', subtitle: '企微留资数', value: sumWecomLeads },
      { key: 'efficiency', title: 'WeCom Recruitment Efficiency', subtitle: '企微留资率', value: efficiency === null ? '-' : formatPercent(efficiency) },
      { key: 'cpr', title: 'CPR', subtitle: '企微留资成本', value: cpr === null ? '-' : formatMoney(cpr) },
      { key: 'turnover', title: 'Turnover', subtitle: '期间成交额', value: formatMoney(sumOrderAmount) }
    ]

    return { kpis }
  }

  // 获取渠道选项（默认仅返回参与统计=1账号的渠道）
  static async getChannels(params = {}) {
    const { brandId = '' } = params
    const supaUserId = await getCurrentUserId()
    if (!supaUserId) {
      throw new Error('用户未登录，无法获取渠道列表')
    }

    // 品牌映射到平台ID集合
    let allowedBrandIds = []
    if (brandId) {
      const { data: platformRows, error: platformErr } = await supabase
        .from('用户平台表')
        .select('平台ID')
        .eq('supabase_user_id', supaUserId)
        .eq('品牌ID', brandId)
      if (platformErr) throw new Error(`获取品牌平台映射失败: ${platformErr.message}`)
      allowedBrandIds = (platformRows || []).map(r => r.平台ID).filter(Boolean)
      if (brandId && !allowedBrandIds.includes(brandId)) {
        allowedBrandIds.push(brandId)
      }
      if (allowedBrandIds.length === 0) return []
    }

    let query = supabase
      .from(TABLES.KOS_LIST)
      .select('渠道', { count: 'exact' })
      .eq('supabase_user_id', supaUserId)
      .eq('参与统计', 1)
      .not('渠道', 'is', null)

    if (allowedBrandIds.length > 0) query = query.in('品牌ID', allowedBrandIds)

    const { data, error } = await query
    if (error) throw new Error(`获取渠道失败: ${error.message}`)

    const set = new Set()
    for (const row of data || []) {
      if (row.渠道 && String(row.渠道).trim()) set.add(String(row.渠道).trim())
    }
    return Array.from(set)
  }

  // 获取达人零售表现数据（按达人）
  static async getCreatorPerformance(params = {}) {
    const { brandId = '', startDate, endDate, channel = '品牌商' } = params

    const supaUserId = await getCurrentUserId()
    if (!supaUserId) {
      throw new Error('用户未登录，无法获取达人表现数据')
    }

    // 品牌ID处理：单品牌查询，需要转换为UUID数组
    let brandIds = []
    if (brandId) {
      // 先尝试品牌ID映射到平台ID集合
      const { data: platformRows, error: platformErr } = await supabase
        .from('用户平台表')
        .select('平台ID')
        .eq('supabase_user_id', supaUserId)
        .eq('品牌ID', brandId)
      if (platformErr) {
        throw new Error(`获取品牌平台映射失败: ${platformErr.message}`)
      }
      brandIds = (platformRows || []).map(r => r.平台ID).filter(Boolean)
      // 如果品牌ID本身不在映射列表中，也加入
      if (brandId && !brandIds.includes(brandId)) {
        brandIds.push(brandId)
      }
    }

    // 如果没有品牌ID，返回空数组
    if (brandIds.length === 0 && !brandId) {
      return []
    }

    // 确保brandIds不为空（至少包含brandId本身）
    const finalBrandIds = brandIds.length > 0 ? brandIds : [brandId]

    try {
      // 调用 RPC 函数 kos_summary_report
      const { data, error } = await supabase.rpc('kos_summary_report', {
        p_brand_ids: finalBrandIds,
        p_channel: channel || '品牌商',
        p_period: 'BY_WEEK',
        p_start_date: startDate || null,
        p_end_date: endDate || null
      })

      if (error) {
        throw new Error(`获取达人表现数据失败: ${error.message}`)
      }

      if (!data || !Array.isArray(data)) {
        return []
      }

      // 数据映射和格式化
      const formatMoney = (n) => {
        if (n === null || n === undefined || n === 0) return '¥0'
        return `¥${Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
      }

      // 按成交量降序排序（SQL已排序，但确保前端也排序）
      const sortedData = [...data].sort((a, b) => {
        const turnoverA = Number(a.t_a4a_13 || 0)
        const turnoverB = Number(b.t_a4a_13 || 0)
        return turnoverB - turnoverA
      })

      // 标记前3名
      return sortedData.map((row, index) => {
        const avatarUrl = row.t_ac9_6 && String(row.t_ac9_6).trim() ? String(row.t_ac9_6).trim() : null
        return {
          creatorName: row.t_aa3_7 || '',
          storeCode: row.t_a85_8 || '',
          notes: Number(row.t_aad_9 || 0),
          engagement: Number(row.t_a15_10 || 0),
          inquiries: Number(row.t_a85_11 || 0),
          wecom: Number(row.t_abd_12 || 0),
          turnover: formatMoney(row.t_a4a_13),
          avatar: avatarUrl,
          isTop3: index < 3,
          sort: row.t_a1f_5 || null
        }
      })
    } catch (err) {
      console.error('获取达人表现数据失败', err)
      throw err
    }
  }

  /**
   * 仪表盘用达人表现数据：
   * - 起始/结束时间完全使用页面传入的时间（一般为周选择器计算出的整周）
   * - 不做任何「本月第一周」之类的时间口径修正
   */
  static async getCreatorPerformanceForDashboard(params = {}) {
    const { brandId, startDate, endDate, channel = '品牌商' } = params
    console.log('[CreatorDashboard] 请求参数', {
      brandId,
      startDate,
      endDate,
      channel
    })
    return RetailDashboardAPI.getCreatorPerformance({
      brandId,
      startDate,
      endDate,
      channel
    })
  }

  /**
   * 导出 PPT（Retail / Wholesale Piloting Performance）用达人表现数据：
   * - 起始时间使用「用户选择的开始日期所在月份的第一周的第一天」
   * - 结束时间使用用户选择的结束日期
   */
  static async getCreatorPerformanceForExport(params = {}) {
    const { brandId, startDate, endDate, channel = '品牌商' } = params

    if (!startDate || !endDate) {
      // 参数不完整时，直接退回空结果，避免时间计算出错
      return []
    }

    const userStartDate = dayjs(startDate, 'YYYY.MM.DD')
    const firstDayOfUserMonth = userStartDate.startOf('month')
    const firstWeekStartOfUserMonth = firstDayOfUserMonth.startOf('isoWeek')
    const creatorStartDate = firstWeekStartOfUserMonth.format('YYYY.MM.DD')

    console.log('[CreatorExport] 请求参数', {
      brandId,
      startDate: creatorStartDate,
      endDate,
      channel,
      userStartDate: startDate
    })

    return RetailDashboardAPI.getCreatorPerformance({
      brandId,
      startDate: creatorStartDate,
      endDate,
      channel
    })
  }

  // 获取笔记表现数据（按笔记）
  static async getNotePerformance(params = {}) {
    const { brandId = '', startDate, endDate, channel = '品牌商', costMin = 0 } = params

    const supaUserId = await getCurrentUserId()
    if (!supaUserId) {
      throw new Error('用户未登录，无法获取笔记表现数据')
    }

    // 品牌ID处理：单品牌查询，需要转换为数组
    if (!brandId) {
      return []
    }

    let brandIds = []
    // 先尝试品牌ID映射到平台ID集合
    const { data: platformRows, error: platformErr } = await supabase
      .from('用户平台表')
      .select('平台ID')
      .eq('supabase_user_id', supaUserId)
      .eq('品牌ID', brandId)
    
    if (platformErr) {
      throw new Error(`获取品牌平台映射失败: ${platformErr.message}`)
    }
    
    brandIds = (platformRows || []).map(r => r.平台ID).filter(Boolean)
    // 如果品牌ID本身不在映射列表中，也加入
    if (brandId && !brandIds.includes(brandId)) {
      brandIds.push(brandId)
    }

    // 确保brandIds不为空（至少包含brandId本身）
    const finalBrandIds = brandIds.length > 0 ? brandIds : [brandId]

    try {
      // 调用 RPC 函数 note_performance_report
      const { data, error } = await supabase.rpc('note_performance_report', {
        p_brand_ids: finalBrandIds,
        p_channel: channel || '品牌商',
        p_period: 'BY_WEEK',
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_cost_min: costMin || 0
      })

      if (error) {
        throw new Error(`获取笔记表现数据失败: ${error.message}`)
      }

      if (!data || !Array.isArray(data)) {
        return []
      }

      // 数据映射和格式化
      const formatNumber = (n, decimals = 2) => {
        if (n === null || n === undefined || isNaN(n)) return '-'
        return Number(n).toFixed(decimals)
      }

      return data.map((row) => {
        const cost = Number(row.t_a41_8 || 0)
        const engagement = Number(row.t_a2f_9 || 0)
        const inquiries = Number(row.t_a73_11 || 0)
        
        // CPE: 如果SQL返回null，则根据消费和互动量计算
        let cpe = '-'
        if (row.t_a15_10 !== null && row.t_a15_10 !== undefined) {
          cpe = formatNumber(row.t_a15_10, 2)
        } else if (engagement > 0) {
          cpe = formatNumber(cost / engagement, 2)
        }
        
        // 私信开口成本: 如果SQL返回null，则根据消费和私信开口数计算
        let inquiryCost = '-'
        if (row.t_a13_12 !== null && row.t_a13_12 !== undefined) {
          inquiryCost = formatNumber(row.t_a13_12, 2)
        } else if (inquiries > 0) {
          inquiryCost = formatNumber(cost / inquiries, 2)
        }

        return {
          noteId: row.t_a99_2 || '',
          coverImage: row.t_a86_5 && String(row.t_a86_5).trim() ? String(row.t_a86_5).trim() : null,
          link: row.t_a20_4 || '',
          store: row.t_a7c_6 || '',
          cost: cost,
          engagement: engagement,
          cpe: cpe,
          inquiries: inquiries,
          inquiryCost: inquiryCost,
          summary: row.t_ae2_7 || ''
        }
      })
    } catch (err) {
      console.error('获取笔记表现数据失败', err)
      throw err
    }
  }
}


