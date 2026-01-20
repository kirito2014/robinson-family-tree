'use client'

import React, { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { addMember, updateMember } from '@/app/actions/member'
import { FamilyMember } from '../types'
// 假设您有一个 translations 对象，如果没有可直接替换为中文
import { translations } from '../locales' 

interface EditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member?: FamilyMember | null // 如果有 member 则是编辑模式，否则是新增
  familyId: string             // [New] 必须传入当前家族ID
  onSuccess?: () => void       // [New] 成功后的回调（通常用于刷新数据）
  lang?: 'en' | 'zh'           // 保留原有的多语言支持
}

// 提交按钮组件 (用于展示 loading)
function SubmitBtn({ isEdit, t }: { isEdit: boolean, t: any }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        pending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    >
      {pending ? 'Saving...' : (isEdit ? t.save : t.add)}
    </button>
  )
}

const initialState = {
  success: false,
  message: '',
  errors: {} as Record<string, string[]>
}

export default function EditMemberModal({
  isOpen,
  onClose,
  member,
  familyId,
  onSuccess,
  lang = 'zh'
}: EditMemberModalProps) {
  
  // 1. 动态绑定 Server Action
  // 如果是编辑，调用 updateMember 并绑定 ID；如果是新增，调用 addMember
  const action = member 
    ? updateMember.bind(null, member.id, familyId)
    : addMember.bind(null, familyId)

  // 2. 表单状态管理
  const [state, dispatch] = useFormState(action, initialState)
  
  // 用于控制复选框的UI状态 (Checkbox 在 form reset 时需要特殊处理)
  const [isAlive, setIsAlive] = useState(true)

  // 3. 监听 member 变化以重置 UI 状态
  useEffect(() => {
    if (isOpen) {
      // 如果是编辑模式，初始化 isAlive
      // 注意：Prisma 的 Date 对象传到 Client Component 可能是 String，需要转换
      setIsAlive(member ? member.isAlive : true)
    }
  }, [isOpen, member])

  // 4. 监听提交成功
  useEffect(() => {
    if (state.success) {
      // 这里的 timeout 是为了让用户看到一点反馈，或者等待动画
      const timer = setTimeout(() => {
        onSuccess?.() // 通知父组件刷新
        onClose()     // 关闭弹窗
        // 状态会在下次打开时重置，因为 key 或者 action 变化
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [state.success, onClose, onSuccess])

  if (!isOpen) return null

  const t = translations[lang]

  // 辅助：日期格式化 (YYYY-MM-DD) 用于 input[type="date"]
  const formatDate = (date?: Date | string) => {
    if (!date) return ''
    const d = new Date(date)
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-500/75 p-4 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all">
        
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-semibold leading-6 text-gray-900">
            {member ? t.editMember : t.addMember}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form action={dispatch} className="space-y-4">
          
          {/* 姓名行 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t.firstName}</label>
              <input
                type="text"
                name="firstName"
                defaultValue={member?.firstName}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {state.errors?.firstName && <p className="text-xs text-red-500 mt-1">{state.errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t.lastName}</label>
              <input
                type="text"
                name="lastName"
                defaultValue={member?.lastName}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {/* 昵称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.nickname}</label>
            <input
              type="text"
              name="nickname"
              defaultValue={member?.nickname}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* 性别 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.gender}</label>
            <div className="mt-2 flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  defaultChecked={member?.gender === 'male' || !member} // 默认选男
                  className="form-radio text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-gray-700">{t.male}</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  defaultChecked={member?.gender === 'female'}
                  className="form-radio text-pink-600 focus:ring-pink-500"
                />
                <span className="ml-2 text-gray-700">{t.female}</span>
              </label>
            </div>
          </div>

          {/* 在世状态 */}
          <div className="flex items-center">
            <input
              id="isAlive"
              name="isAlive"
              type="checkbox"
              checked={isAlive}
              onChange={(e) => setIsAlive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isAlive" className="ml-2 block text-sm text-gray-900">
              {t.isAlive}
            </label>
          </div>

          {/* 日期行 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t.birthDate}</label>
              <input
                type="date"
                name="birthDate"
                defaultValue={formatDate(member?.birthDate)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {!isAlive && (
              <div>
                <label className="block text-sm font-medium text-gray-700">{t.deathDate}</label>
                <input
                  type="date"
                  name="deathDate"
                  defaultValue={formatDate(member?.deathDate)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {/* 简介 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t.bio}</label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={member?.bio}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* 全局错误信息 */}
          {state.message && !state.success && (
            <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
              {state.message}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
            >
              {t.cancel}
            </button>
            <SubmitBtn isEdit={!!member} t={t} />
          </div>
        </form>
      </div>
    </div>
  )
}