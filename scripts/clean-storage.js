#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const os = require('os')

const dirs = [
  path.join(os.homedir(), '.goji', 'host'),
  path.join(os.homedir(), '.goji', 'guest')
]

let cleaned = 0
for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
    console.log(`  cleaned: ${dir}`)
    cleaned++
  }
}

if (cleaned === 0) {
  console.log('  nothing to clean')
} else {
  console.log(`  done (${cleaned} dirs removed)`)
}
