'use client'

import { useState } from 'react'
import { removeUserFromFamily, updateUserRole } from '@/app/actions/family-admin'
import { TrashIcon } from '@heroicons/react/24/outline'

interface Props {
  users: any[]
  currentUserId: string
  currentUserRole: string // 'OWNER' | 'ADMIN' | ...
  familyId: string
}

export default function FamilyUserList({ users, currentUserId, currentUserRole, familyId }: Props) {
  // 定义权限：是否能管理别人
  const canManage = ['OWNER', 'ADMIN'].includes(currentUserRole)

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`确定将该用户角色修改为 ${newRole} 吗？`)) return
    const res = await updateUserRole(familyId, userId, newRole)
    if (res.error) alert(res.error)
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('确定要将该成员移出家族吗？他将无法查看家族树。')) return
    const res = await removeUserFromFamily(familyId, userId)
    if (res.error) alert(res.error)
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">成员</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">角色</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">加入时间</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((member) => (
                <tr key={member.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {member.user.nickname?.[0] || member.user.username[0]}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{member.user.nickname || '无昵称'}</div>
                        <div className="text-gray-500">@{member.user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {/* 只有 OWNER 能改 ADMIN，ADMIN 无法改同级 */}
                    {canManage && member.user.id !== currentUserId && member.role.name !== 'OWNER' ? (
                      <select
                        value={member.role.name}
                        onChange={(e) => handleRoleChange(member.user.id, e.target.value)}
                        className="rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        disabled={currentUserRole === 'ADMIN' && member.role.name === 'ADMIN'}
                      >
                        <option value="ADMIN">管理员</option>
                        <option value="MEMBER">成员</option>
                        <option value="VIEWER">访客</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                        {member.role.name}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                    {canManage && member.user.id !== currentUserId && member.role.name !== 'OWNER' && (
                      <button
                        onClick={() => handleRemove(member.user.id)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-auto"
                      >
                        <TrashIcon className="h-4 w-4" /> 移除
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}