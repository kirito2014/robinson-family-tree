'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { verifySession, createSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// 简单的随机分享码生成器 (6位大写字母+数字)
function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const CreateFamilySchema = z.object({
  name: z.string().min(2, { message: '家族名称至少2个字' }),
  description: z.string().optional(),
})

const JoinFamilySchema = z.object({
  shareCode: z.string().min(1, { message: '请输入家族ID或分享码' }),
})

// --- 1. 创建家族 ---
export async function createFamily(prevState: any, formData: FormData) {
  const session = await verifySession()
  if (!session) return { message: '请先登录' }

  const validated = CreateFamilySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { name, description } = validated.data

  try {
    // 使用事务确保原子性：创建家族 + 绑定管理员 + 赋予角色
    const family = await prisma.$transaction(async (tx) => {
      // 1. 获取 OWNER 角色 ID
      const ownerRole = await tx.role.findUnique({ where: { name: 'OWNER' } })
      if (!ownerRole) throw new Error('系统角色配置错误')

      // 2. 创建家族
      const newFamily = await tx.family.create({
        data: {
          name,
          description,
          creatorId: session.userId,
          shareCode: generateShareCode(), // 生成唯一邀请码
        },
      })

      // 3. 将创建者加入家族并设为 OWNER
      await tx.familyUser.create({
        data: {
          userId: session.userId,
          familyId: newFamily.id,
          roleId: ownerRole.id,
        },
      })

      return newFamily
    })

    // 更新 Session (可选，如果session里存了familyId的话)
    // await updateSession({ ...session, familyId: family.id })

  } catch (error) {
    console.error('Create family error:', error)
    return { message: '创建家族失败，请重试' }
  }

  revalidatePath('/')
  redirect('/') // 创建成功，进入主页
}

// --- 2. 加入家族 ---
export async function joinFamily(prevState: any, formData: FormData) {
  const session = await verifySession()
  if (!session) return { message: '请先登录' }

  const validated = JoinFamilySchema.safeParse({
    shareCode: formData.get('shareCode'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { shareCode } = validated.data

  try {
    const family = await prisma.family.findUnique({
      where: { shareCode },
    })

    if (!family) {
      return { message: '无效的分享码或家族ID' }
    }

    // 检查是否已经是成员
    const existingMembership = await prisma.familyUser.findUnique({
      where: {
        userId_familyId: {
          userId: session.userId,
          familyId: family.id,
        },
      },
    })

    if (existingMembership) {
      return { message: '您已经是该家族的成员了' }
    }

    // 获取 MEMBER 角色
    const memberRole = await prisma.role.findUnique({ where: { name: 'MEMBER' } })
    if (!memberRole) throw new Error('系统角色配置错误')

    // 加入
    await prisma.familyUser.create({
      data: {
        userId: session.userId,
        familyId: family.id,
        roleId: memberRole.id,
      },
    })

  } catch (error) {
    console.error('Join family error:', error)
    return { message: '加入家族失败' }
  }

  revalidatePath('/')
  redirect('/')
}