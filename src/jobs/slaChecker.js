const { prisma } = require('../db')

async function runSlaOverdueCheck() {
  const now = new Date()
  // Mark tickets OVERDUE where dueAt passed and not closed/resolved/overdue
  const affected = await prisma.ticket.updateMany({
    where: {
      dueAt: { lt: now },
      status: { in: ['OPEN','IN_PROGRESS'] }
    },
    data: { status: 'OVERDUE' }
  })
  return affected.count
}

module.exports = { runSlaOverdueCheck }
