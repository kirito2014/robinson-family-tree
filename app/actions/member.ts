'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/session'

// 定义验证规则
const MemberSchema = z.object({
  firstName: z.string().min(1, '名字不能为空'),
  lastName: z.string().optional(),
  nickname: z.string().optional(),
  gender: z.enum(['male', 'female']),
  birthDate: z.string().optional(), // 接收表单的字符串日期
  deathDate: z.string().optional(),
  isAlive: z.string().optional(), // checkbox 传过来通常是 "on" 或 undefined
  bio: z.string().optional(),
})

// 通用辅助函数：解析日期
function parseDate(dateStr?: string) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

// --- 1. 新增成员 ---
export async function addMember(familyId: string, prevState: any, formData: FormData) {
  const session = await verifySession()
  if (!session) return { success: false, message: '未登录' }

  // 这里可以加权限校验...

  const rawData = Object.fromEntries(formData.entries())
  const validated = MemberSchema.safeParse(rawData)

  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors }
  }

  try {
    await prisma.member.create({
      data: {
        familyId,
        firstName: validated.data.firstName,
        lastName: validated.data.lastName,
        nickname: validated.data.nickname,
        gender: validated.data.gender as 'male' | 'female',
        isAlive: rawData.isAlive === 'on', // checkbox 处理
        birthDate: parseDate(validated.data.birthDate),
        deathDate: parseDate(validated.data.deathDate),
        bio: validated.data.bio,
        avatar: rawData.avatar as string || null, // 假设有隐藏域或简单处理
      },
    })
    
    revalidatePath('/')
    return { success: true, message: '添加成功' }
  } catch (e) {
    console.error(e)
    return { success: false, message: '数据库错误' }
  }
}

// --- 2. 更新成员 ---
export async function updateMember(memberId: string, familyId: string, prevState: any, formData: FormData) {
  const session = await verifySession()
  if (!session) return { success: false, message: '未登录' }

  const rawData = Object.fromEntries(formData.entries())
  const validated = MemberSchema.safeParse(rawData)

  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors }
  }

  try {
    // 校验该成员是否属于该家族 (安全检查)
    const existing = await prisma.member.findUnique({
      where: { id: memberId }
    })
    
    if (!existing || existing.familyId !== familyId) {
      return { success: false, message: '找不到成员或无权修改' }
    }

    await prisma.member.update({
      where: { id: memberId },
      data: {
        firstName: validated.data.firstName,
        lastName: validated.data.lastName,
        nickname: validated.data.nickname,
        gender: validated.data.gender as 'male' | 'female',
        isAlive: rawData.isAlive === 'on',
        birthDate: parseDate(validated.data.birthDate),
        deathDate: parseDate(validated.data.deathDate),
        bio: validated.data.bio,
      },
    })

    revalidatePath('/')
    return { success: true, message: '更新成功' }
  } catch (e) {
    console.error(e)
    return { success: false, message: '更新失败' }
  }
}

// --- 3. 删除成员 ---
export async function deleteMember(id: string, familyId: string) {
  const session = await verifySession()
  if (!session) return { success: false, message: '未登录' }

  try {
    // 校验该成员是否属于该家族 (安全检查)
    const existing = await prisma.member.findUnique({
      where: { id }
    })
    
    if (!existing || existing.familyId !== familyId) {
      return { success: false, message: '找不到成员或无权修改' }
    }

    // 使用事务删除成员及其所有连接
    await prisma.$transaction([
      prisma.connection.deleteMany({
        where: {
          familyId,
          OR: [
            { fromId: id },
            { toId: id }
          ]
        }
      }),
      prisma.member.delete({
        where: { id }
      })
    ])

    revalidatePath('/')
    return { success: true, message: '删除成功' }
  } catch (e) {
    console.error(e)
    return { success: false, message: '删除失败' }
  }
}

// --- 4. 删除连接 ---
export async function deleteConnection(id: string, familyId: string) {
  const session = await verifySession()
  if (!session) return { success: false, message: '未登录' }

  try {
    // 校验该连接是否属于该家族 (安全检查)
    const existing = await prisma.connection.findUnique({
      where: { id }
    })
    
    if (!existing || existing.familyId !== familyId) {
      return { success: false, message: '找不到连接或无权修改' }
    }

    await prisma.connection.delete({
      where: { id }
    })

    revalidatePath('/')
    return { success: true, message: '删除成功' }
  } catch (e) {
    console.error(e)
    return { success: false, message: '删除失败' }
  }
}

// --- 5. 获取家族树数据 ---
export async function getFamilyTreeData(familyId: string) {
  const session = await verifySession()
  if (!session) {
    throw new Error('未登录')
  }

  try {
    // 获取家族成员
    const members = await prisma.member.findMany({
      where: { familyId }
    })

    // 获取家族连接
    const connections = await prisma.connection.findMany({
      where: { familyId }
    })

    // 解析连接的箭头选项
    const parsedConnections = connections.map(conn => {
      const parsedConn: any = { ...conn }
      
      if (conn.extra) {
        try {
          const extraData = JSON.parse(conn.extra)
          if (extraData.type || extraData.size || extraData.direction) {
            parsedConn.arrowOptions = extraData
          }
        } catch (e) {
          console.error('Failed to parse connection extra data:', e)
        }
      }
      
      return parsedConn
    })

    return {
      members,
      connections: parsedConnections
    }
  } catch (e) {
    console.error('Failed to get family tree data:', e)
    throw e
  }
}