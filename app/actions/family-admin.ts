'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/session'

// --- 辅助：检查当前用户权限 ---
async function checkPermission(userId: string, familyId: string) {
  const membership = await prisma.familyUser.findUnique({
    where: { userId_familyId: { userId, familyId } },
    include: { role: true }
  })
  // 只有 OWNER 和 ADMIN 有权管理
  const role = membership?.role?.name
  if (!role || !['OWNER', 'ADMIN'].includes(role)) {
    throw new Error('无权操作')
  }
  return role // 返回当前操作者的角色
}

// --- 1. 获取家族成员列表 ---
export async function getFamilyUsers(familyId: string) {
  const session = await verifySession()
  if (!session) return []

  // 简单鉴权：必须是成员才能看列表
  const isMember = await prisma.familyUser.findUnique({
    where: { userId_familyId: { userId: session.userId, familyId } }
  })
  if (!isMember) return []

  return await prisma.familyUser.findMany({
    where: { familyId },
    include: {
      user: {
        select: { id: true, username: true, nickname: true, avatar: true }
      },
      role: true
    },
    orderBy: { joinedAt: 'asc' }
  })
}

// --- 2. 移除成员 (踢人) ---
export async function removeUserFromFamily(familyId: string, targetUserId: string) {
  const session = await verifySession()
  if (!session) return { error: 'Unauthorized' }

  try {
    const myRole = await checkPermission(session.userId, familyId)
    
    // 获取目标角色
    const targetMembership = await prisma.familyUser.findUnique({
      where: { userId_familyId: { userId: targetUserId, familyId } },
      include: { role: true }
    })
    
    if (!targetMembership) return { error: '用户不存在' }
    const targetRole = targetMembership.role.name

    // 权限校验规则：
    // 1. 不能踢自己
    if (session.userId === targetUserId) return { error: '不能移除自己' }
    // 2. OWNER 不能被踢
    if (targetRole === 'OWNER') return { error: '无法移除家族拥有者' }
    // 3. ADMIN 只能踢 MEMBER/VIEWER
    if (myRole === 'ADMIN' && targetRole === 'ADMIN') return { error: '管理员不能移除管理员' }

    await prisma.familyUser.delete({
      where: { userId_familyId: { userId: targetUserId, familyId } }
    })

    revalidatePath('/family/manage')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || '操作失败' }
  }
}

// --- 3. 修改角色 ---
export async function updateUserRole(familyId: string, targetUserId: string, newRoleName: string) {
  const session = await verifySession()
  if (!session) return { error: 'Unauthorized' }

  try {
    const myRole = await checkPermission(session.userId, familyId)
    
    // 只有 OWNER 可以任命 ADMIN
    if (newRoleName === 'ADMIN' && myRole !== 'OWNER') {
      return { error: '只有拥有者可以任命管理员' }
    }
    
    // 查找 Role ID
    const role = await prisma.role.findUnique({ where: { name: newRoleName } })
    if (!role) return { error: '角色不存在' }

    await prisma.familyUser.update({
      where: { userId_familyId: { userId: targetUserId, familyId } },
      data: { roleId: role.id }
    })

    revalidatePath('/family/manage')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}