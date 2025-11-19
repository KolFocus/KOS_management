import React, { useState, useEffect } from 'react'
import PptxGenJS from 'pptxgenjs'

import { 
  Card, 
  DatePicker, 
  Space, 
  Button, 
  Table, 
  Pagination,
  Row, 
  Col,
  Tooltip,
  message,
  Spin,
  Select,
  Avatar,
  Image,
  Segmented
} from 'antd'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import isoWeek from 'dayjs/plugin/isoWeek'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekYear from 'dayjs/plugin/weekYear'
import { RetailDashboardAPI } from '../api/retailDashboard'
import { supabase, TABLES } from '../utils/supabase'
import { getCurrentUserId } from '../utils/userIsolation'
import { brandManagementAPI } from '../api/brandManagement'

dayjs.extend(isoWeek)
dayjs.extend(weekOfYear)
dayjs.extend(weekYear)
dayjs.locale('zh-cn')

const { RangePicker } = DatePicker
const RETAIL_CHANNEL = '品牌商'
const WHOLESALE_CHANNEL = '经销商'
const CREATOR_COLUMNS = [
  { key: 'avatar', title: '', width: 0.5 }, // 头像列
  { key: 'creatorName', title: 'Creator\n达人', width: 1.5 },
  { key: 'storeCode', title: 'Store Code\n所属店铺', width: 1.5 },
  { key: 'notes', title: 'Notes Published\n发布笔记数', width: 1.5 },
  { key: 'engagement', title: 'Engagement\n笔记互动量', width: 1.5 },
  { key: 'inquiries', title: 'Inquiries Received\n私信开口数', width: 1.8 },
  { key: 'wecom', title: 'WeCom Recruitment\n企微留资数', width: 1.5 },
  { key: 'turnover', title: 'Turnover\n期间成交量', width: 1.8 }
]

const NOTE_COLUMNS = [
  { key: 'noteId', title: 'Note\n笔记', width: 0.8 },
  { key: 'link', title: 'Note Link\n笔记链接', width: 0.6 },
  { key: 'store', title: 'Store Code\n所属账号', width: 1.0 },
  { key: 'cost', title: 'Cost\n投放消耗', width: 0.7 },
  { key: 'engagement', title: 'Enagag ement\n笔记互动量', width: 0.7 },
  { key: 'cpe', title: 'CPE\n笔记成本', width: 0.7 },
  { key: 'inquiries', title: 'Inqures Received\n私信开口数', width: 0.7 },
  { key: 'inquiryCost', title: '私信开口成本', width: 0.7 },
  { key: 'summary', title: '笔记内容总结', width: 1.5 }
]

const chunkList = (list, size) => {
  if (!Array.isArray(list) || size <= 0) return []
  const chunks = []
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size))
  }
  return chunks
}

const parseMoneyNumber = (val) => {
  if (typeof val === 'number') return val
  if (!val) return 0
  const clean = String(val).replace(/[¥,]/g, '')
  const num = Number(clean)
  return Number.isFinite(num) ? num : 0
}

const formatMetricValue = (val) => {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'number') return val.toLocaleString('zh-CN')
  return String(val)
}

const shortenSummary = (text) => {
  if (!text) return '-'
  const clean = String(text).trim()
  if (clean.length <= 60) return `"${clean}"`
  return `"${clean.slice(0, 57)}..."`
}

// 将图片URL转换为base64编码（解决CORS跨域问题）
const imageUrlToBase64 = async (url) => {
  if (!url) return null
  
  try {
    console.log(`尝试加载图片: ${url.substring(0, 80)}...`)
    
    // 方法1：先尝试直接加载（如果OSS已配置CORS）
    try {
      const directResponse = await fetch(url, { 
        mode: 'cors',
        cache: 'no-cache'
      })
      
      if (directResponse.ok) {
        const blob = await directResponse.blob()
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        console.log(`✅ 图片加载成功（直接加载）`)
        return base64
      }
    } catch (directError) {
      console.log(`直接加载失败，尝试使用代理...`)
    }
    
    // 方法2：使用CORS代理
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`
    const proxyResponse = await fetch(proxyUrl, {
      mode: 'cors',
      cache: 'no-cache'
    })
    
    if (!proxyResponse.ok) {
      throw new Error(`代理请求失败: HTTP ${proxyResponse.status}`)
    }
    
    const blob = await proxyResponse.blob()
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    
    console.log(`✅ 图片加载成功（通过代理）`)
    return base64
    
  } catch (error) {
    console.warn(`❌ 图片加载失败: ${url.substring(0, 80)}...`, error.message)
    return null
  }
}

// 渲染头像占位符
const renderAvatarPlaceholder = (slide, pptx, currentX, rowY, name, avatarSize = 0.34, avatarPadding = 0.08) => {
  slide.addShape(pptx.ShapeType.rect, {
    x: currentX + avatarPadding,
    y: rowY + avatarPadding,
    w: avatarSize,
    h: avatarSize,
    fill: { color: 'E0E0E0' }
  })
  const firstLetter = name ? name.charAt(0) : '?'
  slide.addText(firstLetter, {
    x: currentX + avatarPadding,
    y: rowY + avatarPadding,
    w: avatarSize,
    h: avatarSize,
    fontSize: Math.round(14 * (avatarSize / 0.34)),  // 根据头像尺寸缩放字体
    bold: true,
    color: '666666',
    align: 'center',
    valign: 'middle',
    fontFace: 'Microsoft YaHei'
  })
}

// 渲染封面图占位符
const renderImagePlaceholder = (slide, currentX, rowY) => {
  slide.addShape('rect', {
    x: currentX + 0.05,
    y: rowY + 0.05,
    w: 0.4,
    h: 0.35,
    fill: { color: 'F5F5F5' }
  })
  slide.addText('📷', {
    x: currentX + 0.05,
    y: rowY + 0.05,
    w: 0.4,
    h: 0.35,
    fontSize: 16,
    align: 'center',
    valign: 'middle'
  })
}

const addDashboardSlide = (pptx, { title, periodText, kpis, creators }) => {
  const slide = pptx.addSlide()
  
  // 标题和日期 - 标题左对齐，日期在右侧灰色显示
  slide.addText(`${title} Dashboard`, { 
    x: 0.4, 
    y: 0.3, 
    fontSize: 24, 
    bold: true, 
    fontFace: 'Microsoft YaHei' 
  })
  slide.addText(`Period`, { 
    x: 6.5, 
    y: 0.35, 
    fontSize: 12, 
    color: '999999',
    fontFace: 'Microsoft YaHei'
  })
  slide.addText(periodText, { 
    x: 7.1, 
    y: 0.35, 
    fontSize: 12, 
    color: '999999',
    fontFace: 'Microsoft YaHei'
  })
  
  const safeKpis = Array.isArray(kpis) ? kpis : []
  // 改为6列布局
  const cols = 6
  // 在原基础上缩小1/5 (即乘以0.8)
  const cardW = 1.85 * 0.8  // 1.85 → 1.48
  const cardH = 0.88 * 0.8  // 0.88 → 0.704
  const gapX = 0.08 * 0.8   // 0.08 → 0.064
  const gapY = 0.15 * 0.8   // 0.15 → 0.12
  const startX = 0.55 // 保持左边距
  const startY = 0.8  // 保持起始位置

  safeKpis.forEach((metric, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const x = startX + col * (cardW + gapX)
    const y = startY + row * (cardH + gapY)
    const highlight = metric.key === 'turnover'
    
    // 卡片背景
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: cardW,
      h: cardH,
      fill: { color: highlight ? 'FFD4D4' : 'F5F5F5' },
      line: { color: 'E0E0E0', width: 0.5 },
      rectRadius: 0.15
    })
    
    // 内边距也缩小1/5
    const padding = 0.1 * 0.8  // 0.1 → 0.08
    
    // 英文标题
    slide.addText(metric.title || '', {
      x: x + padding,
      y: y + padding,
      w: cardW - padding * 2,
      fontSize: Math.round(8 * 0.8),  // 8 → 6.4 ≈ 6
      color: '333333',
      fontFace: 'Microsoft YaHei',
      bold: false
    })
    
    // 中文副标题
    slide.addText(metric.subtitle || '', {
      x: x + padding,
      y: y + 0.28 * 0.8,  // 位置也按比例
      w: cardW - padding * 2,
      fontSize: Math.round(7 * 0.8),  // 7 → 5.6 ≈ 6
      color: '666666',
      fontFace: 'Microsoft YaHei'
    })
    
    // 数值
    slide.addText(formatMetricValue(metric.value), {
      x: x + padding,
      y: y + 0.52 * 0.8,  // 位置也按比例
      w: cardW - padding * 2,
      fontSize: Math.round(14 * 0.8),  // 14 → 11.2 ≈ 11
      bold: true,
      color: highlight ? 'D32F2F' : '000000',
      fontFace: 'Microsoft YaHei'
    })
  })

  // Weekly Top 3 表格 - 扩展为包含完整列信息的表格
  const topCreators = (Array.isArray(creators) ? [...creators] : [])
    .sort((a, b) => parseMoneyNumber(b.turnover) - parseMoneyNumber(a.turnover))
    .slice(0, 3)
  
  if (topCreators.length) {
    const topY = startY + Math.ceil(safeKpis.length / cols) * (cardH + gapY) + 0.25
    
    // Weekly Top 3 标题 - 字体也缩小1/5
    slide.addText('Weekly Top 3', { 
      x: 0.55,
      y: topY, 
      fontSize: Math.round(13 * 0.8),  // 13 → 10.4 ≈ 10
      bold: true, 
      fontFace: 'Microsoft YaHei' 
    })
    
    // 表格数据
    const tableHeaders = [
      'Store Code\n所属店铺',
      'Notes Published\n发布笔记数',
      'Engagement\n笔记互动量',
      'Inquires Received\n私信开口数',
      'WeCom Recruitment\n企微留资数',
      'Turnover\n期间成交额'
    ]
    
    const tableData = [tableHeaders]
    
    topCreators.forEach((creator) => {
      tableData.push([
        creator?.storeCode || '-',
        String(creator?.notes || '0'),
        String(creator?.engagement || '0'),
        String(creator?.inquiries || '0'),
        String(creator?.wecom || '0'),
        String(creator?.turnover || '¥0')
      ])
    })
    
    // 表格宽度缩小1/5
    const tableWidth = 11.6 * 0.8  // 11.6 → 9.28
    const headerColWidth = tableWidth / 6  // 每列平均分配：约1.55英寸
    
    // 添加表格 - 所有尺寸缩小1/5
    const tableY = topY + 0.28 * 0.8  // 位置也按比例
    const headerRowH = 0.38 * 0.8     // 表头行高：0.38 → 0.304
    const dataRowH = 0.34 * 0.8       // 数据行高：0.34 → 0.272
    
    slide.addTable(tableData, {
      x: 0.55,
      y: tableY,
      w: tableWidth,
      fontSize: Math.round(8 * 0.8),  // 8 → 6.4 ≈ 6
        fontFace: 'Microsoft YaHei',
      rowH: [headerRowH, dataRowH, dataRowH, dataRowH],
      colW: Array(6).fill(headerColWidth),  // 6列均分
      align: 'center',
      valign: 'middle',
      border: { pt: 0.5, color: 'DDDDDD' },
      fill: { color: 'FFFFFF' }
    })
    
    // 表头样式（灰色背景）
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.55,
      y: tableY,
      w: tableWidth,
      h: headerRowH,
      fill: { color: 'F2F3F7' },
      line: { color: 'DDDDDD', width: 0.5 }
    })
    
    // 重新添加表头文字
    tableHeaders.forEach((header, idx) => {
      const isLastCol = idx === tableHeaders.length - 1
      slide.addText(header, {
        x: 0.55 + idx * headerColWidth,
        y: tableY,
        w: headerColWidth,
        h: headerRowH,
        fontSize: Math.round(7 * 0.8),  // 7 → 5.6 ≈ 6
        color: '333333',
        bold: true,
        align: 'center',
        valign: 'middle',
        fontFace: 'Microsoft YaHei',
        fill: { color: isLastCol ? 'FFD4D4' : 'F2F3F7' }
      })
    })
  }
}

const addTableSlides = (pptx, { title, periodText, columns, rows, chunkSize, style }) => {
  if (!Array.isArray(rows) || rows.length === 0) return
  const chunks = chunkList(rows, chunkSize)
  
  chunks.forEach((chunk, index) => {
    const slide = pptx.addSlide()
    
    // 标题
    slide.addText(title, { 
      x: 0.4, 
      y: 0.3, 
      fontSize: 24, 
      bold: true,
      fontFace: 'Microsoft YaHei'
    })
    
    // Period 日期
    slide.addText(`Period`, { 
      x: 0.4, 
      y: 0.75, 
      fontSize: 14, 
      color: '999999',
      fontFace: 'Microsoft YaHei'
    })
    slide.addText(periodText, { 
      x: 1.1, 
      y: 0.75, 
      fontSize: 14, 
      color: '999999',
      fontFace: 'Microsoft YaHei'
    })
    
    // Page 页码
    slide.addText(`Page`, { 
      x: 11.8, 
      y: 0.3, 
      fontSize: 14, 
      color: '666666',
      fontFace: 'Microsoft YaHei'
    })
    slide.addText(String(index + 1), { 
      x: 12.35, 
      y: 0.3, 
      fontSize: 14, 
      color: '666666',
      fontFace: 'Microsoft YaHei'
    })
    
    // 计算列宽 - 缩小1/5
    const totalWidth = 12.6 * 0.8  // 12.6 → 10.08
    const colWidths = columns.map(col => col.width ? col.width * 0.8 : (totalWidth / columns.length))
    
    // 表头背景
    let currentX = 0.4
    const headerHeight = 0.5 * 0.8  // 0.5 → 0.4
    columns.forEach((col, colIdx) => {
      const isHighlight = style?.highlightColumns?.includes(col.key)
      slide.addShape(pptx.ShapeType.rect, {
        x: currentX,
        y: 1.15,
        w: colWidths[colIdx],
        h: headerHeight,
        fill: { color: isHighlight ? 'FFD4D4' : 'F2F3F7' },
        line: { color: 'E0E0E0', width: 0.5 }
      })
      
      // 表头文字（支持多行）
      if (col.title) {
        slide.addText(col.title, {
          x: currentX,
          y: 1.15,
          w: colWidths[colIdx],
          h: headerHeight,
          fontSize: Math.round(10 * 0.8),  // 10 → 8
          bold: true,
          color: '333333',
          align: 'center',
          valign: 'middle',
          fontFace: 'Microsoft YaHei'
        })
      }
      
      currentX += colWidths[colIdx]
    })
    
    // 数据行 - 缩小1/5
    const rowHeight = 0.5 * 0.8  // 0.5 → 0.4
    const avatarSize = 0.34 * 0.8  // 0.34 → 0.272
    const avatarPadding = 0.08 * 0.8  // 0.08 → 0.064
    
    chunk.forEach((item, rowIdx) => {
      const rowY = 1.15 + headerHeight + rowIdx * rowHeight  // 使用缩小后的高度
      currentX = 0.4
      
      columns.forEach((col, colIdx) => {
        const isHighlight = style?.highlightColumns?.includes(col.key)
        
        // 单元格背景
        slide.addShape(pptx.ShapeType.rect, {
          x: currentX,
          y: rowY,
          w: colWidths[colIdx],
          h: rowHeight,
          fill: { color: isHighlight ? 'FFD4D4' : 'FFFFFF' },
          line: { color: 'E0E0E0', width: 0.5 }
        })
        
        // 头像列特殊处理
        if (col.key === 'avatar') {
          if (item.avatarBase64) {
            // 如果有base64编码的头像，使用真实图片
            try {
              slide.addImage({
                data: item.avatarBase64,
                x: currentX + avatarPadding,
                y: rowY + avatarPadding,
                w: avatarSize,
                h: avatarSize,
                rounding: true
              })
            } catch (e) {
              // 加载失败，显示占位符
              renderAvatarPlaceholder(slide, pptx, currentX, rowY, item.creatorName, avatarSize, avatarPadding)
            }
          } else {
            // 没有base64头像，显示占位符
            renderAvatarPlaceholder(slide, pptx, currentX, rowY, item.creatorName, avatarSize, avatarPadding)
          }
        } else {
          // 普通文本单元格
          let value = item[col.key]
        if (style?.formatters?.[col.key]) {
            value = style.formatters[col.key](value, item)
          }
          value = value ?? '-'
          
          slide.addText(String(value), {
            x: currentX,
            y: rowY,
            w: colWidths[colIdx],
            h: rowHeight,
            fontSize: Math.round(10 * 0.8),  // 10 → 8
            color: '000000',
            align: 'center',
            valign: 'middle',
            fontFace: 'Microsoft YaHei'
          })
        }
        
        currentX += colWidths[colIdx]
      })
    })
  })
}

// 双栏布局的笔记表现表格（专门用于Performance by Note）
const addNotePerformanceSlides = (pptx, { title, periodText, columns, rows }) => {
  if (!Array.isArray(rows) || rows.length === 0) return
  
  // 每页双栏，每栏10条数据，共20条
  const itemsPerColumn = 10
  const itemsPerPage = itemsPerColumn * 2
  const chunks = chunkList(rows, itemsPerPage)
  
  chunks.forEach((chunk, pageIndex) => {
    const slide = pptx.addSlide()
    
    // 标题
    slide.addText(title, { 
      x: 0.4, 
      y: 0.3, 
      fontSize: 24, 
      bold: true,
      fontFace: 'Microsoft YaHei'
    })
    
    // Period 日期
    slide.addText(`Period`, { 
      x: 0.4,
      y: 0.75, 
      fontSize: 14, 
      color: '999999',
      fontFace: 'Microsoft YaHei'
    })
    slide.addText(periodText, { 
      x: 1.1, 
      y: 0.75, 
      fontSize: 14, 
      color: '999999',
      fontFace: 'Microsoft YaHei'
    })
    
    // Page 页码
    slide.addText(`Page`, { 
      x: 11.8, 
      y: 0.3, 
      fontSize: 14, 
      color: '666666',
      fontFace: 'Microsoft YaHei'
    })
    slide.addText(String(pageIndex + 1), { 
      x: 12.35, 
      y: 0.3, 
      fontSize: 14, 
      color: '666666',
      fontFace: 'Microsoft YaHei'
    })
    
    // 分割为左右两栏
    const leftColumnData = chunk.slice(0, itemsPerColumn)
    const rightColumnData = chunk.slice(itemsPerColumn)
    
    // 渲染左栏 - 调整宽度使左右边距相等，然后缩小1/6，栏间距减少到0.1"
    // 页面宽13.33"，左右边距各0.4"，栏间距0.1" (减少50%)
    // 可用宽度 = 13.33 - 0.4 - 0.4 - 0.1 = 12.43"
    // 每栏宽度 = 12.43 / 2 = 6.215"
    // 额外缩小1/5后再缩小1/8：6.0" → 4.8" → 4.2"
    const columnWidth = 6.0 * 0.7  // 6.0 → 4.2 (进一步收紧列宽)
    const leftStartX = 0.4
    const rightStartX = leftStartX + columnWidth + 0.2
    
    renderNoteColumn(pptx, slide, {
      columns,
      data: leftColumnData,
      startX: leftStartX,
      startY: 1.15,
      columnWidth: columnWidth
    })
    
    // 渲染右栏
    if (rightColumnData.length > 0) {
      renderNoteColumn(pptx, slide, {
        columns,
        data: rightColumnData,
        startX: rightStartX,
        startY: 1.15,
        columnWidth: columnWidth
      })
    }
  })
}

// 渲染单个笔记列
const renderNoteColumn = (pptx, slide, { columns, data, startX, startY, columnWidth }) => {
  // 计算列宽（按比例分配）
  const totalWidthRatio = columns.reduce((sum, col) => sum + (col.width || 1), 0)
  const colWidths = columns.map(col => ((col.width || 1) / totalWidthRatio) * columnWidth)
  
  // 缩小1/5再缩小1/8，然后增加1/18，最后缩小1/6的参数
  const headerHeight = 0.6 * 0.8  // 0.6 → 0.48 (缩小1/5)
  const rowHeight = 0.45 * 0.8  // 0.45 → 0.36 (缩小1/5)
  const headerFontSize = Math.round(8 * 0.8)  // 8 → 6 (缩小1/5)
  
  // 表头背景和文字
  let currentX = startX
  columns.forEach((col, colIdx) => {
    // 表头背景
    slide.addShape(pptx.ShapeType.rect, {
      x: currentX,
      y: startY,
      w: colWidths[colIdx],
      h: headerHeight,
      fill: { color: 'F2F3F7' },
      line: { color: 'E0E0E0', width: 0.5 }
    })
    
    // 表头文字
    if (col.title) {
      slide.addText(col.title, {
        x: currentX,
        y: startY,
        w: colWidths[colIdx],
        h: headerHeight,
        fontSize: headerFontSize,
        bold: true,
        color: '333333',
        align: 'center',
        valign: 'middle',
        fontFace: 'Microsoft YaHei',
        margin: 0  // 完全移除文本框内边距
      })
    }
    
    currentX += colWidths[colIdx]
  })
  
  // 数据行
  data.forEach((item, rowIdx) => {
    const rowY = startY + headerHeight + rowIdx * rowHeight
    currentX = startX
    
    columns.forEach((col, colIdx) => {
      const imagePadding = 0  // 完全移除padding
      const imageHeight = rowHeight  // 图片高度等于行高，完全填满
      const dataFontSize = Math.round(8 * 0.8)  // 8 → 6 (缩小1/5)
      const placeholderFontSize = Math.round(12 * 0.8)  // 12 → 10 (缩小1/5)
      
      // 单元格背景
      slide.addShape(pptx.ShapeType.rect, {
        x: currentX,
        y: rowY,
        w: colWidths[colIdx],
        h: rowHeight,
        fill: { color: 'FFFFFF' },
        line: { color: 'E0E0E0', width: 0.5 }
      })
      
      // noteId列显示封面图（不显示ID文本）
      if (col.key === 'noteId') {
        if (item.coverImageBase64) {
          // 如果有base64编码的封面图，使用真实图片
          try {
            slide.addImage({
              data: item.coverImageBase64,
              x: currentX + imagePadding,
              y: rowY + imagePadding,
              w: colWidths[colIdx] - imagePadding * 2,
              h: imageHeight
            })
          } catch (e) {
            // 加载失败，显示占位符
            slide.addShape('rect', {
              x: currentX + imagePadding,
              y: rowY + imagePadding,
              w: colWidths[colIdx] - imagePadding * 2,
              h: imageHeight,
              fill: { color: 'F5F5F5' }
            })
            slide.addText('📷', {
              x: currentX + imagePadding,
              y: rowY + imagePadding,
              w: colWidths[colIdx] - imagePadding * 2,
              h: imageHeight,
              fontSize: placeholderFontSize,
              align: 'center',
              valign: 'middle',
              margin: 0  // 完全移除文本框内边距
            })
          }
        } else {
          // 没有base64封面图，显示占位符
          slide.addShape('rect', {
            x: currentX + imagePadding,
            y: rowY + imagePadding,
            w: colWidths[colIdx] - imagePadding * 2,
            h: imageHeight,
            fill: { color: 'F5F5F5' }
          })
          slide.addText('📷', {
            x: currentX + imagePadding,
            y: rowY + imagePadding,
            w: colWidths[colIdx] - imagePadding * 2,
            h: imageHeight,
            fontSize: placeholderFontSize,
            align: 'center',
            valign: 'middle',
            margin: 0  // 完全移除文本框内边距
          })
        }
      }
      // Link列显示为蓝色超链接
      else if (col.key === 'link' && item.link) {
        slide.addText('Link', {
          x: currentX,
          y: rowY,
          w: colWidths[colIdx],
          h: rowHeight,
          fontSize: dataFontSize,
          color: '0066CC',
          underline: true,
          align: 'center',
          valign: 'middle',
          fontFace: 'Microsoft YaHei',
          hyperlink: { url: item.link },
          margin: 0  // 完全移除文本框内边距
        })
      }
      // 笔记内容总结列左对齐，其他列居中
      else {
        let value = item[col.key]
        
        // 格式化数值
        if (col.key === 'cost' || col.key === 'inquiryCost') {
          value = typeof value === 'number' ? value.toFixed(2) : value
        }
        
        value = value ?? '-'
        
        const isTextColumn = col.key === 'summary'
        const textPadding = 0  // 完全移除padding
        
        slide.addText(String(value), {
          x: currentX + textPadding,
          y: rowY,
          w: colWidths[colIdx] - textPadding * 2,
          h: rowHeight,
          fontSize: dataFontSize,
          color: '000000',
          align: isTextColumn ? 'left' : 'center',
          valign: 'middle',
          fontFace: 'Microsoft YaHei',
          margin: 0  // 完全移除文本框内边距
        })
      }
      
      currentX += colWidths[colIdx]
    })
  })
}

const buildPptDocument = async ({ periodText, retail, wholesale }) => {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_16x9'
  
  // 预加载所有图片（转换为base64）
  console.log('开始加载图片...')
  
  // 加载 Retail 达人头像
  const retailCreatorsWithImages = await Promise.all(
    (retail?.creators || []).map(async (creator) => {
      const avatarBase64 = creator.avatar ? await imageUrlToBase64(creator.avatar) : null
      return {
        ...creator,
        avatarBase64
      }
    })
  )
  
  // 加载 Retail 笔记封面图
  const retailNotesWithImages = await Promise.all(
    (retail?.notes || []).map(async (note) => {
      const coverImageBase64 = note.coverImage ? await imageUrlToBase64(note.coverImage) : null
      return {
        ...note,
        coverImageBase64
      }
    })
  )
  
  // 加载 Wholesale 达人头像
  const wholesaleCreatorsWithImages = await Promise.all(
    (wholesale?.creators || []).map(async (creator) => {
      const avatarBase64 = creator.avatar ? await imageUrlToBase64(creator.avatar) : null
      return {
        ...creator,
        avatarBase64
      }
    })
  )
  
  // 加载 Wholesale 笔记封面图
  const wholesaleNotesWithImages = await Promise.all(
    (wholesale?.notes || []).map(async (note) => {
      const coverImageBase64 = note.coverImage ? await imageUrlToBase64(note.coverImage) : null
      return {
        ...note,
        coverImageBase64
      }
    })
  )
  
  console.log('图片加载完成！')
  
  // Retail Dashboard
  addDashboardSlide(pptx, {
    title: retail?.title || 'Retail',
    periodText,
    kpis: retail?.kpis,
    creators: retailCreatorsWithImages
  })
  
  // Retail Piloting Performance（达人表现表格）
  addTableSlides(pptx, {
    title: `${retail?.title || 'Retail'} Piloting Performance`,
    periodText,
    columns: CREATOR_COLUMNS,
    rows: retailCreatorsWithImages,
    chunkSize: 10,
    style: { highlightColumns: ['turnover'] }
  })
  
  // Retail Performance by Note（笔记表现 - 双栏布局）
  addNotePerformanceSlides(pptx, {
    title: `${retail?.title || 'Retail'} Performance (by Note)`,
    periodText,
    columns: NOTE_COLUMNS,
    rows: retailNotesWithImages
  })

  // Wholesale Dashboard
  addDashboardSlide(pptx, {
    title: wholesale?.title || 'Wholesale',
    periodText,
    kpis: wholesale?.kpis,
    creators: wholesaleCreatorsWithImages
  })
  
  // Wholesale Piloting Performance（达人表现表格）
  addTableSlides(pptx, {
    title: `${wholesale?.title || 'Wholesale'} Piloting Performance`,
    periodText,
    columns: CREATOR_COLUMNS,
    rows: wholesaleCreatorsWithImages,
    chunkSize: 10,
    style: { highlightColumns: ['turnover'] }
  })
  
  // Wholesale Performance by Note（笔记表现 - 双栏布局）
  addNotePerformanceSlides(pptx, {
    title: `${wholesale?.title || 'Wholesale'} Performance (by Note)`,
    periodText,
    columns: NOTE_COLUMNS,
    rows: wholesaleNotesWithImages
  })

  const fileName = `KOS分析-${dayjs().format('YYYYMMDD-HHmm')}.pptx`
  await pptx.writeFile({ fileName })
}

export default function RetailAnalysis() {
  const defaultChannel = '品牌商'
  const fixedChannels = ['品牌商', '经销商']
  const defaultKpis = [
    { key: 'accounts', title: 'Piloting Account', subtitle: '当前KOSA账号数', value: '-' },
    { key: 'paidAccounts', title: 'Account with Paid Promo', subtitle: '投广账号总数', value: '-' },
    { key: 'notes', title: 'Notes Published', subtitle: '发布笔记数', value: '-' },
    { key: 'paidNotes', title: 'Notes with Paid Promo', subtitle: '投广笔记数', value: '-' },
    { key: 'engagement', title: 'Engagement', subtitle: '笔记总互动数', value: '-' },
    { key: 'paidEngagement', title: 'Engagement from Paid', subtitle: '投广带来的互动量', value: '-' },
    { key: 'chats', title: 'Chats Initiated', subtitle: '私信进线数', value: '-' },
    { key: 'inquiries', title: 'Inquiries Received', subtitle: '私信开口数', value: '-' },
    { key: 'wecom', title: 'WeCom Recruitment', subtitle: '企微留资数', value: '-' },
    { key: 'efficiency', title: 'WeCom Recruitment Efficiency', subtitle: '企微留资率', value: '-' },
    { key: 'cpr', title: 'CPR', subtitle: '企微留资成本', value: '-' },
    { key: 'turnover', title: 'Turnover', subtitle: '期间成交额', value: '-' }
  ]

  const [weekRange, setWeekRange] = useState([
    dayjs().subtract(1,'week').startOf('isoWeek').format('YYYY-MM-DD'),
    dayjs().subtract(1,'week').endOf('isoWeek').format('YYYY-MM-DD')
  ])
  
  const [storePage, setStorePage] = useState(1)
  const [notePage, setNotePage] = useState(1)

  // KPI数据
  const [kpis, setKpis] = useState(defaultKpis)
  const [loading, setLoading] = useState(false)
  const [channel, setChannel] = useState(defaultChannel)
  const [channelOptions, setChannelOptions] = useState([])
  const [brandId, setBrandId] = useState('')
  const [brandOptions, setBrandOptions] = useState([])
  // KPI报表范围：所有/投放
  const [reportScope, setReportScope] = useState('all') // 'all' | 'paid'

  // 门店数据（达人表现数据）
  const [storeData, setStoreData] = useState([])
  const [storeDataLoading, setStoreDataLoading] = useState(false)

  // 笔记数据（笔记表现数据）
  const [noteData, setNoteData] = useState([])
  const [noteDataLoading, setNoteDataLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // 处理周范围变化（不自动触发查询）
  const handleWeekRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      const startWeek = dayjs(dates[0]).startOf('isoWeek')
      const endWeek = dayjs(dates[1]).endOf('isoWeek')
      setWeekRange([startWeek.format('YYYY-MM-DD'), endWeek.format('YYYY-MM-DD')])
    }
  }

  const fetchKpis = async (overrideScope) => {
    try {
      setLoading(true)
      const params = {
        startDate: weekRange[0],
        endDate: weekRange[1],
        channel: channel || '',
        brandId: brandId || '',
        reportScope: overrideScope || reportScope
      }
      const { kpis } = await RetailDashboardAPI.getKpis(params)
      setKpis(Array.isArray(kpis) && kpis.length === 12 ? kpis : defaultKpis)
    } catch (err) {
      console.error(err)
      message.error(err?.message || '获取仪表盘数据失败')
      setKpis(defaultKpis)
    } finally {
      setLoading(false)
    }
  }

  // 获取达人表现数据
  const fetchCreatorData = async () => {
    if (!brandId) {
      message.warning('请先选择品牌')
      return
    }
    try {
      setStoreDataLoading(true)
      const params = {
        startDate: weekRange[0],
        endDate: weekRange[1],
        channel: channel || '品牌商',
        brandId: brandId
      }
      const data = await RetailDashboardAPI.getCreatorPerformance(params)
      setStoreData(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      message.error(err?.message || '获取达人表现数据失败')
      setStoreData([])
    } finally {
      setStoreDataLoading(false)
    }
  }

  // 获取笔记表现数据
  const fetchNoteData = async () => {
    if (!brandId) {
      return // 不显示警告，因为可能达人数据已经提示过了
    }
    try {
      setNoteDataLoading(true)
      const params = {
        startDate: weekRange[0],
        endDate: weekRange[1],
        channel: channel || '品牌商',
        brandId: brandId,
        costMin: 0
      }
      const data = await RetailDashboardAPI.getNotePerformance(params)
      setNoteData(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      message.error(err?.message || '获取笔记表现数据失败')
      setNoteData([])
    } finally {
      setNoteDataLoading(false)
    }
  }

  const fetchChannels = async () => {
    try {
      const list = await RetailDashboardAPI.getChannels({ brandId: brandId || '' })
      const unique = Array.from(new Set(list))
      const merged = Array.from(new Set([ ...fixedChannels, ...unique ]))
      setChannelOptions(merged)
    } catch (err) {
      console.error(err)
    }
  }

  const handleExportPpt = async () => {
    if (!brandId) {
      message.warning('请先选择品牌')
      return
    }
    const startDate = weekRange[0]
    const endDate = weekRange[1]
    const baseParams = { brandId, startDate, endDate, reportScope }
    setExporting(true)
    
    // 显示加载提示
    const loadingMsg = message.loading('正在准备数据...', 0)
    
    try {
      const retailPromise = Promise.all([
        RetailDashboardAPI.getKpis({ ...baseParams, channel: RETAIL_CHANNEL }),
        RetailDashboardAPI.getCreatorPerformance({ ...baseParams, channel: RETAIL_CHANNEL }),
        RetailDashboardAPI.getNotePerformance({ ...baseParams, channel: RETAIL_CHANNEL, costMin: 0 })
      ])
      const wholesalePromise = Promise.all([
        RetailDashboardAPI.getKpis({ ...baseParams, channel: WHOLESALE_CHANNEL }),
        RetailDashboardAPI.getCreatorPerformance({ ...baseParams, channel: WHOLESALE_CHANNEL }),
        RetailDashboardAPI.getNotePerformance({ ...baseParams, channel: WHOLESALE_CHANNEL, costMin: 0 })
      ])
      const [
        [retailKpiRes, retailCreators, retailNotes],
        [wholesaleKpiRes, wholesaleCreators, wholesaleNotes]
      ] = await Promise.all([retailPromise, wholesalePromise])
      
      // 更新加载提示
      loadingMsg()
      const imageLoadingMsg = message.loading('正在加载图片，请稍候...', 0)
      
      await buildPptDocument({
        periodText: `${startDate} ~ ${endDate}`,
        retail: {
          title: 'Retail',
          kpis: retailKpiRes?.kpis || defaultKpis,
          creators: retailCreators || [],
          notes: retailNotes || []
        },
        wholesale: {
          title: 'Wholesale',
          kpis: wholesaleKpiRes?.kpis || defaultKpis,
          creators: wholesaleCreators || [],
          notes: wholesaleNotes || []
        }
      })
      
      imageLoadingMsg()
      message.success('PPT 导出成功！')
    } catch (err) {
      console.error('导出PPT失败', err)
      loadingMsg()
      message.error(err?.message || '导出PPT失败')
    } finally {
      setExporting(false)
    }
  }

  const fetchBrands = async () => {
    try {
      // 优先从 用户品牌表 读取（更全），按排序升序
      const { data: apiBrands, error: brandsErr } = await brandManagementAPI.getBrands()
      let options = []
      if (!brandsErr && Array.isArray(apiBrands)) {
        options = (apiBrands || []).map(b => ({ label: b.品牌, value: String(b.ID), 排序: b.排序 ?? 999999 }))
      }

      // 若用户品牌表无数据，则回退从 KOS_LIST 推导
      if (options.length === 0) {
        const userId = await getCurrentUserId()
        if (userId) {
          const { data, error } = await supabase
            .from(TABLES.KOS_LIST)
            .select('品牌, 品牌ID, 排序')
            .eq('supabase_user_id', userId)
            .not('品牌ID', 'is', null)
            .order('排序', { ascending: true, nullsLast: true })
          if (!error) {
            const map = new Map()
            for (const row of data || []) {
              const id = String(row.品牌ID)
              if (!map.has(id)) {
                map.set(id, { label: row.品牌, value: id, 排序: row.排序 ?? 999999 })
              }
            }
            options = Array.from(map.values())
          }
        }
      }

      options.sort((a, b) => Number(a.排序) - Number(b.排序))
      setBrandOptions(options)
      // 若当前品牌未选或已不在列表中，则默认选第一项
      const exists = options.some(o => o.value === brandId)
      if ((!brandId || !exists) && options.length > 0) {
        setBrandId(options[0].value)
      }
    } catch (err) {
      console.error('获取品牌失败', err)
    }
  }

  // 首次加载品牌；当品牌变化时刷新渠道选项（不触发查询）
  useEffect(() => {
    fetchBrands()
  }, [])

  useEffect(() => {
    fetchChannels()
  }, [brandId])

  // 首次加载：当品牌就绪后自动刷新一次（默认上周已在初始 weekRange 设置）
  useEffect(() => {
    if (brandId) {
      fetchKpis()
      fetchCreatorData()
      fetchNoteData()
    }
    // 仅在 brandId 变为有效时触发一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId])

  // 打开链接
  const openLink = (url) => {
    window.open(url, '_blank')
  }

  // 门店表格列配置
  const storeColumns = [
    { 
      title: 'Creator / 达人', 
      dataIndex: 'creatorName', 
      key: 'creatorName', 
      width: 180,
      render: (text, record) => (
        <Space>
          <Avatar size={32} src={record.avatar || null}>
            {text?.[0]?.toUpperCase()}
          </Avatar>
          <span>{text}</span>
        </Space>
      )
    },
    { 
      title: 'Store Code / 所属店铺', 
      dataIndex: 'storeCode', 
      key: 'storeCode', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'Notes Published / 发布笔记数', 
      dataIndex: 'notes', 
      key: 'notes', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'Engagement / 笔记互动量', 
      dataIndex: 'engagement', 
      key: 'engagement', 
      width: 160,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'Inquires Received / 私信开口数', 
      dataIndex: 'inquiries', 
      key: 'inquiries', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'WeCom Recruitment / 企微留资数', 
      dataIndex: 'wecom', 
      key: 'wecom', 
      width: 200,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    },
    { 
      title: 'Turnover / 期间成交量', 
      dataIndex: 'turnover', 
      key: 'turnover', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center' } })
    }
  ]

  // 笔记表格列配置
  const noteColumns = [
    { 
      title: 'Note / 笔记', 
      dataIndex: 'coverImage', 
      key: 'note', 
      width: 110,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } }),
      render: (imageUrl, record) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Image
            width={80}
            height={80}
            src={imageUrl || 'https://via.placeholder.com/80x80?text=No+Image'}
            alt={record.noteId || 'Note'}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3E暂无图片%3C/text%3E%3C/svg%3E"
            preview={false}
          />
        </div>
      )
    },
    { 
      title: 'Note Link / 笔记链接', 
      key: 'link', 
      width: 160,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } }),
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button type="primary" size="small" onClick={() => openLink(record.link)}>
          Link
        </Button>
        </div>
      )
    },
    { 
      title: 'Store Code / 所属账号', 
      dataIndex: 'store', 
      key: 'store', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: 'Cost / 投放消耗', 
      dataIndex: 'cost', 
      key: 'cost', 
      width: 150,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: 'Engagement / 笔记互动量', 
      dataIndex: 'engagement', 
      key: 'engagement', 
      width: 180,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: 'CPE / 互动成本', 
      dataIndex: 'cpe', 
      key: 'cpe', 
      width: 150,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: 'Inquires Received / 私信开口数', 
      dataIndex: 'inquiries', 
      key: 'inquiries', 
      width: 210,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    { 
      title: '私信开口成本', 
      dataIndex: 'inquiryCost', 
      key: 'inquiryCost', 
      width: 160,
      align: 'center',
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } })
    },
    {
      title: '笔记内容总结',
      dataIndex: 'summary',
      key: 'summary',
      width: 260,
      onHeaderCell: () => ({ style: { textAlign: 'center', whiteSpace: 'nowrap' } }),
      ellipsis: { showTitle: false },
      render: (text) => {
        const textStr = text || ''
        const content = (
          <span style={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
            {textStr}
          </span>
        )
        // 如果文本有内容，始终显示Tooltip以便查看完整内容
        if (textStr && textStr.trim().length > 0) {
          return (
            <Tooltip placement="topLeft" title={textStr}>{content}</Tooltip>
          )
        }
        return content
      }
    }
  ]

  return (
    <ConfigProvider locale={zhCN}>
    <div style={{ padding: '8px' }}>
      <style>{`
        .ant-table-tbody .top3-row > td {
          background-color: #fffbe6 !important;
        }
        .ant-table-tbody .top3-row:hover > td {
          background-color: #fff9d6 !important;
        }
      `}</style>
      {/* 头部卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>KOS分析</h2>
            <p style={{ margin: 0, color: '#909399', fontSize: '13px', marginTop: '4px' }}>
              Retail Analysis Dashboard（模拟数据）
            </p>
          </div>
          <Space>
            <Select
              allowClear={false}
              value={brandId || undefined}
              onChange={(val) => setBrandId(val || '')}
              placeholder="品牌（默认：排序为1）"
              options={brandOptions}
              style={{ width: 180 }}
            />
            <Select
              allowClear={false}
              value={channel || undefined}
              onChange={(val) => setChannel(val || '')}
              placeholder="渠道（全部）"
              options={channelOptions.map(c => ({ label: c, value: c }))}
              style={{ width: 156 }}
            />
            <RangePicker
              picker="week"
              value={[dayjs(weekRange[0]), dayjs(weekRange[1])]}
              onChange={handleWeekRangeChange}
              allowClear={false}
              format={(value) => {
                if (!value) return ''
                // 直接使用传入的value（已经是周的第一天或最后一天）
                return dayjs(value).format('YYYY-MM-DD')
              }}
            />
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={async () => {
                await Promise.all([fetchKpis(), fetchCreatorData(), fetchNoteData()])
              }} 
              loading={loading || storeDataLoading || noteDataLoading} 
              disabled={loading || storeDataLoading || noteDataLoading}
            >
              刷新数据
            </Button>
            <Button
              type="default"
              onClick={handleExportPpt}
              loading={exporting}
              disabled={!brandId}
            >
              导出PPT
            </Button>
          </Space>
        </div>
      </Card>

      {/* KPI范围切换与统计卡片 */}
      <div style={{ marginBottom: 8 }}>
        <Segmented
          value={reportScope}
          onChange={(val) => { setReportScope(val); fetchKpis(val) }}
          options={[
            { label: '所有', value: 'all' },
            { label: '投放', value: 'paid' }
          ]}
        />
      </div>
      {/* KPI统计卡片 */}
      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {kpis.map(kpi => (
            <Col span={6} key={kpi.key}>
              <Card style={{ textAlign: 'left' }}>
                <div style={{ color: '#606266', fontSize: '13px' }}>{kpi.title}</div>
                <div style={{ color: '#909399', fontSize: '12px' }}>{kpi.subtitle}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px' }}>{kpi.value}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      {/* 门店表现表格 */}
      <Card style={{ marginBottom: 16 }}>
        <h3>零售表现（按达人） / Retail Performance (by Creator)</h3>
        <Spin spinning={storeDataLoading}>
        <Table
          dataSource={storeData.slice((storePage - 1) * 10, storePage * 10)}
          columns={storeColumns}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 8 }}
            rowClassName={(record) => record.isTop3 ? 'top3-row' : ''}
            rowKey={(record, index) => `${record.creatorName}-${record.storeCode}-${index}`}
            locale={{ emptyText: '暂无数据，请点击"刷新数据"按钮加载' }}
        />
        </Spin>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Pagination
            current={storePage}
            total={storeData.length}
            pageSize={10}
            showSizeChanger={false}
            onChange={setStorePage}
          />
        </div>
      </Card>

      {/* 笔记表现表格 */}
      <Card>
        <h3>零售表现（按笔记） / Retail Performance (by Note)</h3>
        <Spin spinning={noteDataLoading}>
        <Table
          dataSource={noteData.slice((notePage - 1) * 10, notePage * 10)}
          columns={noteColumns}
          pagination={false}
          bordered
          size="small"
          style={{ marginTop: 8 }}
            rowKey={(record) => record.noteId || `${record.store}-${record.link}`}
            locale={{ emptyText: '暂无数据，请点击"刷新数据"按钮加载' }}
        />
        </Spin>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <Pagination
            current={notePage}
            total={noteData.length}
            pageSize={10}
            showSizeChanger={false}
            onChange={setNotePage}
          />
        </div>
      </Card>
    </div>
    </ConfigProvider>
  )
}


