const express = require('express')
const router = express.Router()
const { prisma } = require('../db')
const fs = require('fs')
const path = require('path')
const { writeCsv } = require('../utils')

function pct(a, b) {
  if (b === 0) return 0
  return Math.round((a / b) * 10000) / 100 // 2 decimals
}

// Response stats: response_rate_pct, avg_first_response_min
router.get('/response', async (req, res) => {
  const total = await prisma.ticket.count()
  const withResp = await prisma.ticket.count({ where: { firstResponseAt: { not: null } } })
  const rows = await prisma.ticket.findMany({
    where: { firstResponseAt: { not: null } },
    select: { createdAt: true, firstResponseAt: true }
  })
  const avgMin = rows.length
    ? Math.round(rows.map(r => (r.firstResponseAt - r.createdAt) / 60000).reduce((a,b)=>a+b,0) / rows.length)
    : 0

  const out = {
    response_rate_pct: pct(withResp, total),
    avg_first_response_min: avgMin
  }
  res.json(out)
})

// SLA stats: sla_ok_pct, overdue_rate_pct
router.get('/sla', async (req, res) => {
  const total = await prisma.ticket.count()
  const overdue = await prisma.ticket.count({ where: { status: 'OVERDUE' } })
  const slaOk = total - overdue
  res.json({
    sla_ok_pct: pct(slaOk, total),
    overdue_rate_pct: pct(overdue, total)
  })
})

// Tickets by status
router.get('/status', async (req, res) => {
  const statuses = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED','OVERDUE']
  const data = []
  for (const s of statuses) {
    const cnt = await prisma.ticket.count({ where: { status: s } })
    data.push({ status: s, cnt })
  }
  res.json(data)
})

// Workload by agent (open + overdue)
router.get('/workload', async (req, res) => {
  const agents = await prisma.agent.findMany()
  const data = []
  for (const a of agents) {
    const open_cnt = await prisma.ticket.count({
      where: { agentId: a.id, status: { in: ['OPEN','IN_PROGRESS','OVERDUE'] } }
    })
    data.push({ agent: a.name, open_cnt })
  }
  res.json(data)
})

// Trend daily
router.get('/trend/daily', async (req, res) => {
  const rows = await prisma.$queryRaw`SELECT date(createdAt) AS d, COUNT(*) AS c FROM Ticket GROUP BY date(createdAt) ORDER BY d`
  res.json(rows.map(r => ({ d: r.d, c: Number(r.c) })))
})

// Export all CSVs to EXPORT_DIR
router.post('/export', async (req, res) => {
  const dir = process.env.EXPORT_DIR || './exports'
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // response
  const total = await prisma.ticket.count()
  const withResp = await prisma.ticket.count({ where: { firstResponseAt: { not: null } } })
  const rowsResp = await prisma.ticket.findMany({ where: { firstResponseAt: { not: null } }, select: { createdAt: true, firstResponseAt: true } })
  const avgMin = rowsResp.length ? Math.round(rowsResp.map(r => (r.firstResponseAt - r.createdAt) / 60000).reduce((a,b)=>a+b,0) / rowsResp.length) : 0
  writeCsv(path.join(dir, 'response_stats.csv'), [{ response_rate_pct: pct(withResp,total), avg_first_response_min: avgMin }], ['response_rate_pct','avg_first_response_min'])

  // sla
  const overdue = await prisma.ticket.count({ where: { status: 'OVERDUE' } })
  writeCsv(path.join(dir, 'sla_stats.csv'), [{ sla_ok_pct: pct(total - overdue, total), overdue_rate_pct: pct(overdue, total) }], ['sla_ok_pct','overdue_rate_pct'])

  // status
  const statuses = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED','OVERDUE']
  const statusRows = []
  for (const s of statuses) {
    const cnt = await prisma.ticket.count({ where: { status: s } })
    statusRows.push({ status: s, cnt })
  }
  writeCsv(path.join(dir, 'tickets_by_status.csv'), statusRows, ['status','cnt'])

  // workload
  const agents = await prisma.agent.findMany()
  const workloadRows = []
  for (const a of agents) {
    const open_cnt = await prisma.ticket.count({ where: { agentId: a.id, status: { in: ['OPEN','IN_PROGRESS','OVERDUE'] } } })
    workloadRows.push({ agent: a.name, open_cnt })
  }
  writeCsv(path.join(dir, 'workload_by_agent.csv'), workloadRows, ['agent','open_cnt'])

  // trend
  const trend = await prisma.$queryRaw`SELECT date(createdAt) AS d, COUNT(*) AS c FROM Ticket GROUP BY date(createdAt) ORDER BY d`
  const trendRows = trend.map(r => ({ d: r.d, c: Number(r.c) }))
  writeCsv(path.join(dir, 'tickets_trend_daily.csv'), trendRows, ['d','c'])

  res.json({ ok: true, dir })
})

module.exports = router
