'use server'

import { z } from 'zod' // 如果没安装 zod，请运行 npm i zod
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createSession, deleteSession } from '@/lib/session'

// 1. 定义表单验证规则
const SignupSchema = z.object({
  username: z.string().min(3, { message: '用户名至少3位' }),
  password: z.string().min(6, { message: '密码至少6位' }),
  email: z.string().email({ message: '邮箱格式不正确' }).optional().or(z.literal('')),
})

const LoginSchema = z.object({
  username: z.string().min(1, { message: '请输入用户名' }),
  password: z.string().min(1, { message: '请输入密码' }),
})

export type FormState = {
  errors?: {
    username?: string[]
    password?: string[]
    email?: string[]
  }
  message?: string
} | undefined

// 2. 注册 Action
export async function signup(prevState: FormState, formData: FormData) {
  // 校验数据
  const validatedFields = SignupSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { username, email, password } = validatedFields.data

  // 检查是否重复
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email: email || undefined }] },
  })

  if (existingUser) {
    return {
      message: '用户名或邮箱已被注册',
    }
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10)

  // 创建用户
  const user = await prisma.user.create({
    data: {
      username,
      email: email || null,
      password: hashedPassword,
    },
  })

  // 创建 Session
  await createSession(user.id, user.username)

  // 注册成功后，跳转到“创建或加入家族”引导页
  redirect('/onboarding')
}

// 3. 登录 Action
export async function login(prevState: FormState, formData: FormData) {
  const validatedFields = LoginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { username, password } = validatedFields.data

  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user || !user.password) {
    return { message: '账号或密码错误' }
  }

  const passwordsMatch = await bcrypt.compare(password, user.password)

  if (!passwordsMatch) {
    return { message: '账号或密码错误' }
  }

  await createSession(user.id, user.username)
  
  redirect('/')
}

// 4. 登出 Action
export async function logout() {
  await deleteSession()
  redirect('/login')
}