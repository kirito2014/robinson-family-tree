import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import TreeView from '@/views/TreeView'

export default async function Home() {
  // 1. 验证用户是否登录
  const session = await verifySession()
  
  if (!session) {
    redirect('/login')
  }

  // 2. 查询用户信息及关联的家族
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { 
      familyMemberships: { 
        include: { family: true, role: true } 
      } 
    }
  })

  // 3. 如果用户不存在或没有加入任何家族，重定向到引导页
  if (!user || user.familyMemberships.length === 0) {
    redirect('/onboarding')
  }

  // 4. 获取当前家族 (目前默认取第一个家族，未来可扩展切换功能)
  const currentMembership = user.familyMemberships[0]
  const currentFamily = currentMembership.family
  const currentRole = currentMembership.role

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* 导航栏：传入当前家族信息，以便显示家族名称和分享码 */}
      <Navbar 
        familyName={currentFamily.name} 
        shareCode={currentFamily.shareCode} 
        userNickname={user.nickname || user.username}
        userAvatar={user.avatar}
      />
      
      {/* 家族树视图：传入 familyId 用于过滤数据，传入 role 用于控制编辑权限 */}
      <div className="flex-1 overflow-hidden relative">
        <TreeView 
          familyId={currentFamily.id} 
          userRole={currentRole.name} // 'OWNER', 'ADMIN', 'MEMBER', 'VIEWER'
        />
      </div>
    </main>
  )
}