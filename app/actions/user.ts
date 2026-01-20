'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/session'

const ProfileSchema = z.object({
  name: z.string().optional(),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  // 密码修改通常建议单独流程，为了简化这里暂不包含
})

export async function updateProfile(prevState: any, formData: FormData) {
  const session = await verifySession()
  if (!session) return { message: '未登录' }

  const data = {
    name: formData.get('name'),
    nickname: formData.get('nickname'),
    phone: formData.get('phone'),
    location: formData.get('location'),
  }

  const validated = ProfileSchema.safeParse(data)
  if (!validated.success) {
    return { message: '数据格式有误' }
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: validated.data,
    })
    
    revalidatePath('/profile')
    return { success: true, message: '资料已更新' }
  } catch (error) {
    return { message: '更新失败' }
  }
}