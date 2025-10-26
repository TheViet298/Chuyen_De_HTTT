const express = require('express')
const router = express.Router()
const { prisma } = require('../db')

// Create ticket
router.post('/', async (req, res) => {
  try {
    const { title, description, customerId, agentId, priority, slaMinutes } = req.body
    const now = new Date()
    const sla = Number(slaMinutes ?? 60*24)
    const dueAt = new Date(now.getTime() + sla * 60000)
    const ticket = await prisma.ticket.create({
      data: { title, description, customerId, agentId, priority, slaMinutes: sla, dueAt }
    })
    res.json(ticket)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e.message })
  }
})

// List tickets (with simple filters)
router.get('/', async (req, res) => {
  try {
    const { status, agentId, customerId } = req.query
    const where = {}
    if (status) where.status = status
    if (agentId) where.agentId = Number(agentId)
    if (customerId) where.customerId = Number(customerId)

    const items = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, agent: true }
    })
    res.json(items)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e.message })
  }
})

// Get one
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { comments: { include: { agent: true } }, customer: true, agent: true }
    })
    if (!ticket) return res.status(404).json({ error: 'Not found' })
    res.json(ticket)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e.message })
  }
})

// Update partial (status, agent, dueAt, etc.)
router.patch('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const data = {}
    const allowed = ['status', 'agentId', 'priority', 'dueAt', 'closedAt']
    for (const k of allowed) if (k in req.body) data[k] = req.body[k]
    if (data.agentId) data.agentId = Number(data.agentId)
    const updated = await prisma.ticket.update({ where: { id }, data })
    res.json(updated)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e.message })
  }
})

// Add comment (and set firstResponseAt if by agent and not set yet)
router.post('/:id/comments', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { content, authorType, agentId } = req.body
    const comment = await prisma.comment.create({
      data: { content, authorType, ticketId: id, agentId: agentId ?? null }
    })
    if (authorType === 'AGENT') {
      const t = await prisma.ticket.findUnique({ where: { id } })
      if (t && !t.firstResponseAt) {
        await prisma.ticket.update({
          where: { id },
          data: { firstResponseAt: new Date(), status: t.status === 'OPEN' ? 'IN_PROGRESS' : t.status }
        })
      }
    }
    res.json(comment)
  } catch (e) {
    console.error(e)
    res.status(400).json({ error: e.message })
  }
})

module.exports = router
