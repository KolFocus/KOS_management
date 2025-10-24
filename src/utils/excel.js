import * as XLSX from 'xlsx'

// Excel导入导出工具
export class ExcelUtils {
  // 解析Excel文件
  static parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          resolve(jsonData)
        } catch (error) {
          reject(new Error(`解析Excel文件失败: ${error.message}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('读取文件失败'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }
  
  // 验证Excel数据格式
  static validateExcelData(data, headers) {
    const errors = []
    
    if (!data || data.length < 2) {
      errors.push('Excel文件至少需要包含标题行和一行数据')
      return { isValid: false, errors }
    }
    
    // 检查标题行
    const headerRow = data[0]
    const missingHeaders = headers.filter(header => !headerRow.includes(header))
    
    if (missingHeaders.length > 0) {
      errors.push(`缺少必要的列: ${missingHeaders.join(', ')}`)
    }
    
    // 验证数据行
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1
      
      // 跳过空行
      if (row.every(cell => !cell)) continue
      
      // 检查必填字段：员工姓名、店铺编号
      if (!row[0]) {
        errors.push(`第${rowNum}行: 员工姓名为必填字段`)
      }
      
      if (!row[1]) {
        errors.push(`第${rowNum}行: 店铺编号为必填字段`)
      }
      
      // 验证数值字段（如果填写了）
      if (row[2] && row[2] !== '' && isNaN(parseFloat(row[2]))) {
        errors.push(`第${rowNum}行: 小红书成单必须是数字`)
      }
      
      if (row[3] && row[3] !== '' && !Number.isInteger(parseInt(row[3]))) {
        errors.push(`第${rowNum}行: 本期累计成单必须是整数`)
      }
      
      if (row[4] && row[4] !== '' && !Number.isInteger(parseInt(row[4]))) {
        errors.push(`第${rowNum}行: 企微留资数必须是整数`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // 验证KOS Excel数据格式
  static validateKosExcelData(data, headers) {
    const errors = []
    
    if (!data || data.length < 2) {
      errors.push('Excel文件至少需要包含标题行和一行数据')
      return { isValid: false, errors }
    }
    
    // 检查标题行
    const headerRow = data[0]
    const missingHeaders = headers.filter(header => !headerRow.includes(header))
    
    if (missingHeaders.length > 0) {
      errors.push(`缺少必要的列: ${missingHeaders.join(', ')}`)
    }
    
    // 验证数据行
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 1
      
      // 跳过空行
      if (row.every(cell => !cell)) continue
      
      // 检查必填字段：用户ID（第0列）
      if (!row[0]) {
        errors.push(`第${rowNum}行: 用户ID为必填字段`)
      }
      
      // 验证参与统计字段（第5列，如果填写了必须是1或2）
      if (row[5] && ![1, 2, '1', '2'].includes(row[5])) {
        errors.push(`第${rowNum}行: 参与统计必须是1（上线）或2（下线）`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // 转换Excel数据为销售数据格式（不包含品牌和日期信息，这些信息将在导入时选择）
  static convertToSalesData(excelData) {
    const headers = excelData[0]
    const salesDataList = []
    
    for (let i = 1; i < excelData.length; i++) {
      const row = excelData[i]
      
      if (row.every(cell => !cell)) continue // 跳过空行
      
      const salesData = {
        品牌: '', // 将在导入时设置
        品牌ID: '', // 将在导入时设置
        周期类型: '', // 将在导入时设置
        日期: '', // 将在导入时设置
        员工姓名: row[0] || '',
        店铺编号: row[1] || '',
        小红书成单: parseFloat(row[2]) || 0,
        本期累计成单: parseInt(row[3]) || 0,
        企微留资数: parseInt(row[4]) || 0
      }
      
      salesDataList.push(salesData)
    }
    
    return salesDataList
  }
  
  // 转换Excel数据为KOS数据格式（不包含品牌信息，品牌信息将在导入时选择）
  static convertToKosData(excelData) {
    const headers = excelData[0]
    const kosDataList = []
    
    for (let i = 1; i < excelData.length; i++) {
      const row = excelData[i]
      
      if (row.every(cell => !cell)) continue // 跳过空行
      
      const kosData = {
        品牌: '', // 将在导入时设置
        品牌ID: '', // 将在导入时设置
        用户ID: row[0] || '',
        排序: row[1] || '1',
        所属用户: row[2] || '',
        所属店铺: row[3] || '',
        渠道: row[4] || '',
        参与统计: parseInt(row[5]) || 1
      }
      
      kosDataList.push(kosData)
    }
    
    return kosDataList
  }
  
  // 导出销售数据为Excel
  static exportToExcel(salesDataList, filename = '销售数据') {
    const headers = [
      '品牌', '品牌ID', '周期类型', '日期',
      '员工姓名', '店铺编号', '小红书成单', '本期累计成单', '企微留资数'
    ]
    
    const data = [
      headers,
      ...salesDataList.map(item => [
        item.品牌 || '',
        item.品牌ID || '',
        item.周期类型 || '',
        item.日期 || '',
        item.员工姓名 || '',
        item.店铺编号 || '',
        item.小红书成单 || 0,
        item.本期累计成单 || 0,
        item.企微留资数 || 0
      ])
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '销售数据')
    
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }
  
  // 验证日期格式
  static isValidDate(dateString) {
    if (!dateString) return false
    
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }
  
  // 格式化日期
  static formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    if (format === 'YYYY-MM-DD') {
      return d.toISOString().split('T')[0]
    }
    
    return d.toLocaleString('zh-CN')
  }
  
  // 获取日期范围
  static getDateRange(type = 'month') {
    const now = new Date()
    
    switch (type) {
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return {
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0]
        }
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return {
          start: monthStart.toISOString().split('T')[0],
          end: monthEnd.toISOString().split('T')[0]
        }
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
        const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0)
        return {
          start: quarterStart.toISOString().split('T')[0],
          end: quarterEnd.toISOString().split('T')[0]
        }
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        const yearEnd = new Date(now.getFullYear(), 11, 31)
        return {
          start: yearStart.toISOString().split('T')[0],
          end: yearEnd.toISOString().split('T')[0]
        }
      default:
        const defaultStart = new Date(now)
        defaultStart.setDate(now.getDate() - 30)
        return {
          start: defaultStart.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        }
    }
  }
  
  // 下载模板文件
  static downloadTemplate(templateData, filename, sheetName = '模板') {
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    XLSX.writeFile(workbook, filename)
  }
}
