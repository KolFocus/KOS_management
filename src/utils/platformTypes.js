// 平台类型配置管理
export const platformTypeConfig = {
  // 默认平台类型
  defaultTypes: [
    { 
      label: '小红书专业号', 
      value: '小红书专业号', 
      icon: '📱',
      url: 'https://pro.xiaohongshu.com/login?redirectTo=%2F',
      description: '小红书专业号管理平台'
    },
    { 
      label: '小红书聚光', 
      value: '小红书聚光', 
      icon: '✨',
      url: 'https://ad.xiaohongshu.com/aurora/ad/manage/campaign',
      description: '小红书聚光广告管理平台'
    }
  ],

  // 获取所有平台类型
  getAllTypes() {
    return this.defaultTypes
  },

  // 根据值获取平台类型信息
  getTypeByValue(value) {
    return this.defaultTypes.find(type => type.value === value)
  },

  // 检查平台类型是否存在
  hasType(value) {
    return this.defaultTypes.some(type => type.value === value)
  },

  // 添加新的平台类型
  addType(label, value, icon = '📋', url = '', description = '') {
    if (!this.hasType(value)) {
      this.defaultTypes.push({ label, value, icon, url, description })
    }
  },

  // 根据值获取平台类型URL
  getTypeUrl(value) {
    const typeInfo = this.getTypeByValue(value)
    return typeInfo ? typeInfo.url : ''
  },

  // 根据值获取平台类型描述
  getTypeDescription(value) {
    const typeInfo = this.getTypeByValue(value)
    return typeInfo ? typeInfo.description : ''
  }
}
