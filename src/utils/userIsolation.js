// 用户数据隔离工具

import { supabase } from './supabase'

/**
 * 获取当前用户ID
 */
export const getCurrentUserId = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch (error) {
    console.error('获取用户ID失败:', error)
    return null
  }
}

/**
 * 为数据添加用户ID
 */
export const addUserIsolation = async (data) => {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('用户未登录，无法创建数据')
  }
  
  return {
    ...data,
    supabase_user_id: userId
  }
}

/**
 * 检查用户是否有权限访问数据
 */
export const checkUserPermission = async (dataUserId) => {
  const currentUserId = await getCurrentUserId()
  if (!currentUserId) {
    throw new Error('用户未登录')
  }
  
  if (dataUserId !== currentUserId) {
    throw new Error('没有权限访问此数据')
  }
  
  return true
}

/**
 * 为品牌数据添加用户隔离
 */
export const addBrandUserIsolation = async (brandData) => {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('用户未登录，无法创建品牌')
  }
  
  return {
    ...brandData,
    supabase_user_id: userId
  }
}

/**
 * 为平台数据添加用户隔离
 */
export const addPlatformUserIsolation = async (platformData) => {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('用户未登录，无法创建平台')
  }
  
  return {
    ...platformData,
    supabase_user_id: userId
  }
}

/**
 * 为KOS数据添加用户隔离
 */
export const addKosUserIsolation = async (kosData) => {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('用户未登录，无法创建KOS')
  }
  
  return {
    ...kosData,
    supabase_user_id: userId
  }
}

/**
 * 为销售数据添加用户隔离
 */
export const addSalesDataUserIsolation = async (salesData) => {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('用户未登录，无法创建销售数据')
  }
  
  return {
    ...salesData,
    supabase_user_id: userId
  }
}
