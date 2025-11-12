require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const cron = require('node-cron')
const path = require('path')
const fs = require('fs')
const serveIndex = require('serve-index');

const tickets = require('./routes/tickets')
const kpi = require('./routes/kpi')
const { runSlaOverdueCheck } = require('./jobs/slaChecker')

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => res.json({ ok: true, name: 'CRM Dashboard Starter' }))
app.use('/tickets', tickets)
app.use('/kpi', kpi)

// Serve exports as static for quick checking
const exportDir = process.env.EXPORT_DIR || './exports'
if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true })
app.use('/exports', express.static(path.resolve(exportDir)))
app.use('/exports', express.static(path.resolve(exportDir)));
app.use('/exports', serveIndex(path.resolve(exportDir), { icons: true }));

// Cron: SLA overdue checker every 5 minutes
const cronExpr = process.env.EXPORT_CRON || '*/5 * * * *'
cron.schedule(cronExpr, async () => {
  const n = await runSlaOverdueCheck()
  console.log(`[CRON] SLA overdue check: updated ${n} tickets.`)
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
