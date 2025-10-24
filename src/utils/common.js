import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

// 消息提示工具
export class MessageUtils {
  // 成功提示
  static success(message, duration = 3000) {
    ElMessage.success({
      message,
      duration
    })
  }
  
  // 错误提示
  static error(message, duration = 3000) {
    ElMessage.error({
      message,
      duration
    })
  }
  
  // 警告提示
  static warning(message, duration = 3000) {
    ElMessage.warning({
      message,
      duration
    })
  }
  
  // 信息提示
  static info(message, duration = 3000) {
    ElMessage.info({
      message,
      duration
    })
  }
  
  // 确认对话框
  static confirm(message, title = '确认') {
    return ElMessageBox.confirm(message, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  }
  
  // 删除确认
  static confirmDelete(itemName = '该项') {
    return this.confirm(`确定要删除${itemName}吗？此操作不可撤销。`, '删除确认')
  }
  
  // 批量操作确认
  static confirmBatchOperation(operation, count) {
    return this.confirm(`确定要对选中的${count}项执行${operation}操作吗？`, '批量操作确认')
  }
  
  // 通知
  static notify(title, message, type = 'success', duration = 4500) {
    ElNotification({
      title,
      message,
      type,
      duration
    })
  }
  
  // 加载提示
  static loading(text = '加载中...') {
    return ElMessageBox.alert(text, '提示', {
      confirmButtonText: '确定',
      type: 'info',
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false
    })
  }
}

// 表单验证工具
export class FormUtils {
  // 验证必填字段
  static validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName}不能为空`
    }
    return null
  }
  
  // 验证邮箱
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailRegex.test(email)) {
      return '邮箱格式不正确'
    }
    return null
  }
  
  // 验证手机号
  static validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (phone && !phoneRegex.test(phone)) {
      return '手机号格式不正确'
    }
    return null
  }
  
  // 验证数字
  static validateNumber(value, fieldName, min = null, max = null) {
    if (value === null || value === undefined || value === '') {
      return null
    }
    
    const num = parseFloat(value)
    if (isNaN(num)) {
      return `${fieldName}必须是数字`
    }
    
    if (min !== null && num < min) {
      return `${fieldName}不能小于${min}`
    }
    
    if (max !== null && num > max) {
      return `${fieldName}不能大于${max}`
    }
    
    return null
  }
  
  // 验证整数
  static validateInteger(value, fieldName, min = null, max = null) {
    if (value === null || value === undefined || value === '') {
      return null
    }
    
    const num = parseInt(value)
    if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
      return `${fieldName}必须是整数`
    }
    
    if (min !== null && num < min) {
      return `${fieldName}不能小于${min}`
    }
    
    if (max !== null && num > max) {
      return `${fieldName}不能大于${max}`
    }
    
    return null
  }
  
  // 验证日期
  static validateDate(date, fieldName) {
    if (!date) {
      return null
    }
    
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return `${fieldName}格式不正确`
    }
    
    return null
  }
  
  // 验证URL
  static validateUrl(url) {
    if (!url) {
      return null
    }
    
    try {
      new URL(url)
      return null
    } catch {
      return 'URL格式不正确'
    }
  }
  
  // 验证长度
  static validateLength(value, fieldName, min = null, max = null) {
    if (!value) {
      return null
    }
    
    const length = value.length
    
    if (min !== null && length < min) {
      return `${fieldName}长度不能少于${min}个字符`
    }
    
    if (max !== null && length > max) {
      return `${fieldName}长度不能超过${max}个字符`
    }
    
    return null
  }
}

// 数据处理工具
export class DataUtils {
  // 格式化金额
  static formatMoney(amount, decimals = 2) {
    if (amount === null || amount === undefined) {
      return '0.00'
    }
    
    return parseFloat(amount).toFixed(decimals)
  }
  
  // 格式化数字
  static formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) {
      return '0'
    }
    
    return parseFloat(num).toFixed(decimals)
  }
  
  // 格式化日期
  static formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) {
      return ''
    }
    
    // 使用原生Date对象格式化
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      return ''
    }
    
    if (format === 'YYYY-MM-DD') {
      return d.toISOString().split('T')[0]
    }
    
    return d.toLocaleString('zh-CN')
  }
  
  // 格式化日期时间
  static formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) {
      return ''
    }
    
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      return ''
    }
    
    if (format === 'YYYY-MM-DD HH:mm:ss') {
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-')
    }
    
    return d.toLocaleString('zh-CN')
  }
  
  // 深拷贝
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime())
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item))
    }
    
    if (typeof obj === 'object') {
      const clonedObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key])
        }
      }
      return clonedObj
    }
  }
  
  // 防抖
  static debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
  
  // 节流
  static throttle(func, limit) {
    let inThrottle
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}
