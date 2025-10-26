const fs = require('fs')
const path = require('path')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function writeCsv(filePath, rows, headers) {
  ensureDir(path.dirname(filePath))
  const lines = []
  lines.push(headers.join(','))
  for (const row of rows) {
    lines.push(headers.map(h => String(row[h] ?? '')).join(','))
  }
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
  return filePath
}

module.exports = { ensureDir, writeCsv }
