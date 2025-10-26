/* eslint-disable */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

async function main() {
  console.log('Seeding data...')

  const [a1, a2] = await Promise.all([
    prisma.agent.upsert({
      where: { email: 'alice@company.com' },
      update: {},
      create: { name: 'Alice', email: 'alice@company.com' }
    }),
    prisma.agent.upsert({
      where: { email: 'bob@company.com' },
      update: {},
      create: { name: 'Bob', email: 'bob@company.com' }
    }),
  ])

  const [c1, c2] = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'viet@example.com' },
      update: {},
      create: { name: 'Ngô Thế Việt', email: 'viet@example.com', phone: '0900000000' }
    }),
    prisma.customer.upsert({
      where: { email: 'linh@example.com' },
      update: {},
      create: { name: 'Linh', email: 'linh@example.com', phone: '0911111111' }
    }),
  ])

  const now = new Date()

  await prisma.ticket.createMany({
    data: [
      {
        title: 'Giao hàng chậm',
        description: 'Đơn #1234 giao trễ 2 ngày',
        status: 'OPEN',
        priority: 'HIGH',
        createdAt: now,
        dueAt: addMinutes(now, 60*24), // 24h
        slaMinutes: 60*24,
        customerId: c1.id,
        agentId: a1.id
      },
      {
        title: 'Không đăng nhập được',
        description: 'Lỗi 500 khi đăng nhập',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        createdAt: now,
        dueAt: addMinutes(now, 60*8),
        slaMinutes: 60*8,
        customerId: c2.id,
        agentId: a2.id
      },
      {
        title: 'Hoàn tiền đơn #5678',
        description: 'Yêu cầu hoàn tiền',
        status: 'RESOLVED',
        priority: 'MEDIUM',
        createdAt: addMinutes(now, -60*48),
        dueAt: addMinutes(now, -60*24),
        closedAt: addMinutes(now, -60*20),
        firstResponseAt: addMinutes(now, -60*40),
        slaMinutes: 60*24,
        customerId: c1.id,
        agentId: a1.id
      },
    ]
  })

  console.log('Seed done.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
