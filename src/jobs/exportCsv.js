require('dotenv').config()
const fetch = require('node-fetch') // use native fetch in newer Node; fallback for compatibility

async function main() {
  const url = 'http://localhost:' + (process.env.PORT || 3000) + '/kpi/export'
  try {
    // If Node >=18, global fetch exists; else require node-fetch
    const f = (typeof fetch !== 'undefined') ? fetch : (await import('node-fetch')).default
    const res = await f(url, { method: 'POST' })
    const data = await res.json()
    console.log('CSV exported to', data.dir)
  } catch (e) {
    console.error('Export failed. Is the server running?', e.message)
    process.exit(1)
  }
}

if (require.main === module) main()
