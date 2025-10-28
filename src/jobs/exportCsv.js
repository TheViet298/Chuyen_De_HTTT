require('dotenv').config()

async function main() {
  const url = 'http://localhost:' + (process.env.PORT || 3000) + '/kpi/export'
  try {
    const res = await fetch(url, { method: 'POST' })
    const data = await res.json()
    console.log('CSV exported to', data.dir)
  } catch (e) {
    console.error('Export failed. Is the server running?', e.message)
    process.exit(1)
  }
}

if (require.main === module) main()
