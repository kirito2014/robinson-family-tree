import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getFamilyUsers } from '@/app/actions/family-admin'
import FamilyUserList from '@/components/FamilyUserList'
import Navbar from '@/components/Navbar'

export default async function FamilyManagePage() {
  const session = await verifySession()
  if (!session) redirect('/login')

  // 获取当前家族信息
  const currentMembership = await prisma.familyUser.findFirst({
    where: { userId: session.userId },
    include: { family: true, role: true }
  })

  if (!currentMembership) redirect('/onboarding')

  const familyId = currentMembership.familyId
  const users = await getFamilyUsers(familyId)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        familyName={currentMembership.family.name} 
        shareCode={currentMembership.family.shareCode}
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold leading-6 text-gray-900">家族成员管理</h1>
              <p className="mt-2 text-sm text-gray-700">
                查看当前家族的所有注册用户。管理员可在此修改成员权限或移除成员。
              </p>
            </div>
            {/* 可以在这里加一个“邀请成员”按钮 */}
          </div>
          
          <FamilyUserList 
            users={users} 
            currentUserId={session.userId} 
            currentUserRole={currentMembership.role.name}
            familyId={familyId}
          />
        </div>
      </main>
    </div>
  )
}