import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 初始化预设角色
  const roles = [
    { name: 'OWNER', description: '家族创建者，拥有所有权限' },
    { name: 'ADMIN', description: '管理员，可管理成员和家族信息' },
    { name: 'MEMBER', description: '普通成员，可查看和编辑部分信息' },
    { name: 'VIEWER', description: '访客，仅查看权限' },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
  }

  console.log('✅ Roles initialized')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })