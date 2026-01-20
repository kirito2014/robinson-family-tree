'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateProfile } from '@/app/actions/user'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300"
    >
      {pending ? '保存中...' : '保存修改'}
    </button>
  )
}

export default function ProfileForm({ user }: { user: any }) {
  const [state, action] = useFormState(updateProfile, null)

  return (
    <form action={action} className="mt-6 space-y-6">
      {state?.success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {state.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium leading-6 text-gray-900">真实姓名</label>
          <div className="mt-2">
            <input
              type="text"
              name="name"
              defaultValue={user.name || ''}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-sm font-medium leading-6 text-gray-900">昵称</label>
          <div className="mt-2">
            <input
              type="text"
              name="nickname"
              defaultValue={user.nickname || ''}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="sm:col-span-4">
          <label className="block text-sm font-medium leading-6 text-gray-900">手机号码</label>
          <div className="mt-2">
            <input
              type="text"
              name="phone"
              defaultValue={user.phone || ''}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="sm:col-span-4">
          <label className="block text-sm font-medium leading-6 text-gray-900">所在地</label>
          <div className="mt-2">
            <input
              type="text"
              name="location"
              defaultValue={user.location || ''}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-x-6">
        <SubmitButton />
      </div>
    </form>
  )
}