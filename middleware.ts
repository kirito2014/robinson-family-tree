import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

// 1. 指定受保护的路由
const protectedRoutes = ['/', '/dashboard', '/profile', '/onboarding']
const publicRoutes = ['/login', '/register']

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path) || path.startsWith('/dashboard')
  const isPublicRoute = publicRoutes.includes(path)

  // 2. 解密 Session
  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)

  // 3. 如果是受保护路由且无 Session，跳转到登录
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // 4. 如果已登录但访问的是登录/注册页，跳转到首页
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  return NextResponse.next()
}

// 匹配路径配置
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}