import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import Navbar from '@/components/Navbar' // 假设您有这个组件

export default async function ProfilePage() {
  const session = await verifySession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  })

  // 获取用户所在的第一个家族用于导航栏显示（可选）
  const firstMembership = await prisma.familyUser.findFirst({
    where: { userId: session.userId },
    include: { family: true }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        familyName={firstMembership?.family.name || '我的家族'} 
        shareCode={firstMembership?.family.shareCode}
      />
      
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">个人资料</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">管理您的个人信息。</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <ProfileForm user={user} />
          </div>
        </div>
      </main>
    </div>
  )
}