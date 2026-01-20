'use client'

import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const [state, action] = useActionState(signup, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">注册新账号</h2>
        
        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <input
              name="username"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            {state?.errors?.username && <p className="text-sm text-red-500">{state.errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">邮箱 (可选)</label>
            <input
              name="email"
              type="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            {state?.errors?.email && <p className="text-sm text-red-500">{state.errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <input
              name="password"
              type="password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
            {state?.errors?.password && <p className="text-sm text-red-500">{state.errors.password}</p>}
          </div>

          {state?.message && (
            <div className="rounded bg-red-50 p-2 text-sm text-red-500">
              {state.message}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none"
          >
            注册
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          已有账号？{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
            去登录
          </Link>
        </div>
      </div>
    </div>
  )
}