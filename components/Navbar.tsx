'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { 
  UserCircleIcon, 
  ArrowRightStartOnRectangleIcon, 
  Cog6ToothIcon, 
  ClipboardDocumentIcon,
  UsersIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import { logout } from '@/app/actions/auth'

interface NavbarProps {
  familyName: string
  shareCode?: string | null
  userNickname?: string | null
  userAvatar?: string | null
}

export default function Navbar({ 
  familyName, 
  shareCode, 
  userNickname = '用户', 
  userAvatar 
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 复制邀请码功能
  const copyShareCode = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode)
      alert('邀请码已复制到剪贴板')
    }
  }

  return (
    <nav className="bg-white shadow z-50 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          
          {/* 左侧：Logo 与 家族名称 */}
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
                <UsersIcon className="h-8 w-8" />
                <span>{familyName}</span>
              </Link>
            </div>
          </div>

          {/* 右侧：功能区 */}
          <div className="flex items-center gap-4">
            
            {/* 邀请码显示 (点击复制) */}
            {shareCode && (
              <button 
                onClick={copyShareCode}
                className="hidden sm:flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                title="点击复制邀请码"
              >
                <span>邀请码: <span className="font-mono font-bold text-indigo-600">{shareCode}</span></span>
                <ClipboardDocumentIcon className="h-3 w-3" />
              </button>
            )}

            {/* 用户头像下拉菜单 */}
            <div className="relative ml-3">
              <div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <span className="sr-only">打开用户菜单</span>
                  {userAvatar ? (
                    <img className="h-8 w-8 rounded-full object-cover" src={userAvatar} alt="" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {userNickname?.[0]?.toUpperCase()}
                    </div>
                  )}
                </button>
              </div>

              {/* 下拉菜单内容 */}
              {isMenuOpen && (
                <>
                  {/* 点击外部关闭遮罩 */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  
                  <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm text-gray-500">登录为</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{userNickname}</p>
                    </div>

                    <Link
                      href="/"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <HomeIcon className="mr-2 h-4 w-4 text-gray-500" />
                      返回首页
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <UserCircleIcon className="mr-2 h-4 w-4 text-gray-500" />
                      个人中心
                    </Link>

                    <Link
                      href="/family/manage"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Cog6ToothIcon className="mr-2 h-4 w-4 text-gray-500" />
                      家族管理
                    </Link>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <form action={logout}>
                        <button
                          type="submit"
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <ArrowRightStartOnRectangleIcon className="mr-2 h-4 w-4" />
                          退出登录
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}