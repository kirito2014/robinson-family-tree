'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { createFamily, joinFamily } from '@/app/actions/family'
import { UserGroupIcon, PlusCircleIcon } from '@heroicons/react/24/outline'

// 提交按钮组件 (用于显示 loading 状态)
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        pending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    >
      {pending ? '处理中...' : label}
    </button>
  )
}

export default function OnboardingPage() {
  // 控制当前激活的标签页: 'create' 或 'join'
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')
  
  // 绑定 Server Actions
  const [createState, createAction] = useFormState(createFamily, undefined)
  const [joinState, joinAction] = useFormState(joinFamily, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            欢迎来到家族树
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            您还没有归属的家族。请创建您的新家族，或者通过邀请码加入现有家族。
          </p>
        </div>

        {/* 选项卡切换 */}
        <div className="flex rounded-md bg-gray-100 p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-white text-indigo-700 shadow font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PlusCircleIcon className="h-5 w-5" />
            创建新家族
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'join'
                ? 'bg-white text-indigo-700 shadow font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserGroupIcon className="h-5 w-5" />
            加入家族
          </button>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg ring-1 ring-black ring-opacity-5">
          {/* --- 创建家族表单 --- */}
          {activeTab === 'create' && (
            <form action={createAction} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  家族名称
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="例如：罗宾逊家族"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
                {createState?.errors?.name && (
                  <p className="mt-1 text-sm text-red-600">{createState.errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  家族简介 (可选)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="简单介绍一下这个家族..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {createState?.message && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">{createState.message}</p>
                </div>
              )}

              <SubmitButton label="立即创建" />
            </form>
          )}

          {/* --- 加入家族表单 --- */}
          {activeTab === 'join' && (
            <form action={joinAction} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  家族邀请码 / ID
                </label>
                <input
                  name="shareCode"
                  type="text"
                  placeholder="请输入6位大写字母或数字的邀请码"
                  required
                  className="mt-1 block w-full uppercase rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
                {joinState?.errors?.shareCode && (
                  <p className="mt-1 text-sm text-red-600">{joinState.errors.shareCode}</p>
                )}
              </div>

              {joinState?.message && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">{joinState.message}</p>
                </div>
              )}

              <SubmitButton label="加入家族" />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}