#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const dirs = [path.join(root, '.goji-storage'), path.join(root, 'tmp-guest')]

let cleaned = 0
for (const dir of dirs) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
    console.log(`  cleaned: ${path.relative(root, dir)}`)
    cleaned++
  }
}

if (cleaned === 0) {
  console.log('  nothing to clean')
} else {
  console.log(`  done (${cleaned} dirs removed)`)
}
