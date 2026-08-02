#!/usr/bin/env node

const express = require('express')
const { WebSocketServer } = require('ws')
const Autobase = require('autobase')
const b4a = require('b4a')
const BlindPairing = require('blind-pairing')
const Corestore = require('corestore')
const HyperDB = require('hyperdb')
const Hyperswarm = require('hyperswarm')
const z32 = require('z32')
const readline = require('readline')
const GojiDispatch = require('../spec/dispatch')
const GojiDb = require('../spec/db')
const Identity = require('keet-identity-key')
const crypto = require('hypercore-crypto')

const PORT = parseInt(process.argv.find((a, i) => process.argv[i - 1] === '--port') || '3001', 10)
const isGuest = process.argv.includes('--guest') || process.argv.includes('--join')
const joinIdx = process.argv.indexOf('--join')
const INVITE = joinIdx !== -1 ? process.argv[joinIdx + 1] : null
const NAME = process.argv.find((a, i) => process.argv[i - 1] === '--name') || null
const STORAGE = isGuest
  ? require('path').join(require('os').homedir(), '.goji', 'guest')
  : require('path').join(require('os').homedir(), '.goji', 'host')

class GojiRoom {
  constructor(store, swarm, invite) {
    this.store = store
    this.swarm = swarm
    this.invite = invite
    this.pairing = new BlindPairing(swarm)
    this.router = new GojiDispatch.Router()
    this._setupRouter()
    this.localBase = Autobase.getLocalCore(this.store)
    this.base = null
    this.pairMember = null
    this.identities = new Map()
  }

  async open() {
    await this.localBase.ready()
    const localKey = this.localBase.key
    const isEmpty = this.localBase.length === 0

    let key, encryptionKey
    if (isEmpty && this.invite) {
      const res = await new Promise((resolve) => {
        this.pairing.addCandidate({
          invite: z32.decode(this.invite),
          userData: localKey,
          onadd: resolve
        })
      })
      key = res.key
      encryptionKey = res.encryptionKey
    }

    await this.localBase.close()
    this.base = new Autobase(this.store, key, {
      encrypt: true,
      encryptionKey,
      open: (store) =>
        HyperDB.bee(store.get('view'), GojiDb, { extension: false, autoUpdate: true }),
      close: async (view) => await view.close(),
      apply: async (nodes, view, base) => {
        for (const node of nodes) {
          await this.router.dispatch(node.value, { view, base })
        }
        await view.flush()
      }
    })

    const writablePromise = new Promise((resolve) => {
      this.base.on('update', () => {
        if (this.base.writable) resolve()
      })
    })
    await this.base.ready()
    this.swarm.join(this.base.discoveryKey)
    if (!this.base.writable) await writablePromise

    this.view.core.download({ start: 0, end: -1 })

    this.pairMember = this.pairing.addMember({
      discoveryKey: this.base.discoveryKey,
      onadd: async (request) => {
        const inv = await this.view.findOne('@goji/invites', { id: request.inviteId })
        if (!inv) return
        request.open(inv.publicKey)
        await this.addWriter(request.userData)
        request.confirm({ key: this.base.key, encryptionKey: this.base.encryptionKey })
      }
    })
  }

  _setupRouter() {
    this.router.add('@goji/add-writer', async (data, ctx) => {
      await ctx.base.addWriter(data.key)
    })
    this.router.add('@goji/add-invite', async (data, ctx) => {
      await ctx.view.insert('@goji/invites', data)
    })
    this.router.add('@goji/add-board', async (data, ctx) => {
      await ctx.view.insert('@goji/boards', data)
    })
    this.router.add('@goji/rename-board', async (data, ctx) => {
      await applyUpdate(ctx.view, '@goji/boards', { id: data.id }, (b) => ({
        ...b,
        name: data.name,
        updatedAt: data.at
      }))
    })
    this.router.add('@goji/delete-board', async (data, ctx) => {
      const cards = await ctx.view.find('@goji/cards', {}).toArray()
      for (const c of cards) {
        if (b4a.equals(c.boardId, data.id)) await ctx.view.delete('@goji/cards', { id: c.id })
      }
      const conns = await ctx.view.find('@goji/connections', {}).toArray()
      for (const conn of conns) {
        if (b4a.equals(conn.boardId, data.id)) {
          await ctx.view.delete('@goji/connections', { id: conn.id })
        }
      }
      await ctx.view.delete('@goji/boards', { id: data.id })
    })
    this.router.add('@goji/add-card', async (data, ctx) => {
      await ctx.view.insert('@goji/cards', data)
    })
    this.router.add('@goji/update-card', async (data, ctx) => {
      await applyUpdate(ctx.view, '@goji/cards', { id: data.id }, (c) => ({
        ...c,
        ...data.patch,
        updatedAt: data.at
      }))
    })
    this.router.add('@goji/remove-card', async (data, ctx) => {
      await ctx.view.delete('@goji/cards', { id: data.id })
    })
    this.router.add('@goji/add-connection', async (data, ctx) => {
      await ctx.view.insert('@goji/connections', data)
    })
    this.router.add('@goji/remove-connection', async (data, ctx) => {
      await ctx.view.delete('@goji/connections', { id: data.id })
    })
    this.router.add('@goji/update-connection', async (data, ctx) => {
      await applyUpdate(ctx.view, '@goji/connections', { id: data.id }, (c) => ({
        ...c,
        ...data.patch
      }))
    })
    this.router.add('@goji/add-chat', async (data, ctx) => {
      await ctx.view.insert('@goji/chat', data)
    })
    this.router.add('@goji/remove-chats', async (data, ctx) => {
      const ids = Array.isArray(data.ids) ? data.ids : null
      if (!ids) return
      if (ids.length === 0) {
        const all = await ctx.view.find('@goji/chat', {}).toArray()
        for (const m of all) await ctx.view.delete('@goji/chat', { id: m.id })
        return
      }
      for (const id of ids) {
        if (typeof id === 'string') await ctx.view.delete('@goji/chat', { id })
      }
    })
    this.router.add('@goji/update-identity', async (data, ctx) => {
      const writerKey = b4a.isBuffer(data.writerKey) ? data.writerKey : b4a.from(data.writerKey)
      const next = {
        writerKey,
        displayName: data.displayName,
        role: data.role || 'pending',
        assignedBy: data.assignedBy || null,
        assignedAt: data.assignedAt || null,
        updatedAt: data.updatedAt || Date.now()
      }
      const existing = await ctx.view.get('@goji/identity', { writerKey })
      if (existing) {
        await applyUpdate(ctx.view, '@goji/identity', { writerKey }, () => next)
      } else {
        await ctx.view.insert('@goji/identity', next)
      }
      // Cache for peers endpoint
      this.identities.set(b4a.toString(writerKey, 'hex'), {
        key: b4a.toString(writerKey, 'hex'),
        name: data.displayName,
        role: data.role || 'pending',
        updatedAt: next.updatedAt
      })
    })
    this.router.add('@goji/assign-role', async (data, ctx) => {
      const writerKey = b4a.isBuffer(data.writerKey) ? data.writerKey : b4a.from(data.writerKey)
      const next = {
        writerKey,
        displayName: data.displayName,
        role: data.role || 'pending',
        assignedBy: data.assignedBy || null,
        assignedAt: data.assignedAt || null,
        updatedAt: data.updatedAt || Date.now()
      }
      const existing = await ctx.view.get('@goji/identity', { writerKey })
      if (existing) {
        await applyUpdate(ctx.view, '@goji/identity', { writerKey }, () => next)
      } else {
        await ctx.view.insert('@goji/identity', next)
      }
      // Cache for peers endpoint
      this.identities.set(b4a.toString(writerKey, 'hex'), {
        key: b4a.toString(writerKey, 'hex'),
        name: data.displayName,
        role: data.role || 'pending',
        updatedAt: next.updatedAt
      })
    })
    this.router.add('@goji/add-wallet', async (data, ctx) => {
      await ctx.view.insert('@goji/wallets', data)
    })
    this.router.add('@goji/remove-wallet', async (data, ctx) => {
      await ctx.view.delete('@goji/wallets', { id: data.id })
    })
    this.router.add('@goji/set-flow-status', async (data, ctx) => {
      const existing = await ctx.view.get('@goji/flowStatuses', { id: data.id })
      if (existing) {
        await applyUpdate(ctx.view, '@goji/flowStatuses', { id: data.id }, () => data)
      } else {
        await ctx.view.insert('@goji/flowStatuses', data)
      }
    })
    this.router.add('@goji/remove-flow-statuses', async (data, ctx) => {
      const flowId = data.flowId
      if (!flowId) return
      const all = await ctx.view.find('@goji/flowStatuses', {}).toArray()
      for (const r of all) {
        if (r.id && r.flowId && b4a.equals(r.flowId, flowId)) {
          await ctx.view.delete('@goji/flowStatuses', { id: r.id })
        }
      }
    })
    this.router.add('@goji/add-template', async (data, ctx) => {
      await ctx.view.insert('@goji/templates', data)
    })
    this.router.add('@goji/update-template', async (data, ctx) => {
      const existing = await ctx.view.get('@goji/templates', { id: data.id })
      if (existing) {
        await applyUpdate(ctx.view, '@goji/templates', { id: data.id }, () => data)
      } else {
        await ctx.view.insert('@goji/templates', data)
      }
    })
    this.router.add('@goji/remove-template', async (data, ctx) => {
      await ctx.view.delete('@goji/templates', { id: data.id })
    })

    this.router.add('@goji/add-receivable', async (data, ctx) => {
      await ctx.view.insert('@goji/receivables', data)
    })
    this.router.add('@goji/update-receivable', async (data, ctx) => {
      const existing = await ctx.view.get('@goji/receivables', { id: data.id })
      if (existing) {
        await applyUpdate(ctx.view, '@goji/receivables', { id: data.id }, () => data)
      } else {
        await ctx.view.insert('@goji/receivables', data)
      }
    })
    this.router.add('@goji/remove-receivable', async (data, ctx) => {
      await ctx.view.delete('@goji/receivables', { id: data.id })
    })
  }

  get view() {
    return this.base.view
  }

  async getInvite() {
    const existing = await this.view.findOne('@goji/invites', {})
    if (existing) return z32.encode(existing.invite)
    const { id, invite, publicKey, expires } = BlindPairing.createInvite(this.base.key)
    await this.base.append(
      GojiDispatch.encode('@goji/add-invite', { id, invite, publicKey, expires })
    )
    return z32.encode(invite)
  }

  async addWriter(key) {
    await this.base.append(
      GojiDispatch.encode('@goji/add-writer', { key: b4a.isBuffer(key) ? key : b4a.from(key) })
    )
  }

  isWritable() {
    return Boolean(this.base && this.base.writable)
  }

  async getBoards() {
    return await this.view.find('@goji/boards', {}).toArray()
  }

  async getCards() {
    return await this.view.find('@goji/cards', {}).toArray()
  }

  async getConnections() {
    return await this.view.find('@goji/connections', {}).toArray()
  }

  async getMessages({ reverse = true, limit = 100 } = {}) {
    return await this.view.find('@goji/chat', { reverse, limit }).toArray()
  }

  async getIdentities() {
    const rows = await this.view.find('@goji/identity', {}).toArray()
    return rows.map((r) => ({
      writerKey: b4a.toString(r.writerKey, 'hex'),
      displayName: r.displayName,
      role: r.role || 'pending',
      assignedBy: r.assignedBy ? b4a.toString(r.assignedBy, 'hex') : null,
      assignedAt: r.assignedAt || null,
      updatedAt: r.updatedAt
    }))
  }

  async buildSnapshot() {
    const [rawBoards, rawCards, rawConnections] = await Promise.all([
      this.getBoards(),
      this.getCards(),
      this.getConnections()
    ])
    return {
      boards: rawBoards.map((b) => ({
        id: b4a.toString(b.id, 'hex'),
        name: b.name,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      })),
      cards: rawCards.map((c) => decodeCard(c)),
      connections: rawConnections.map((conn) => decodeConnection(conn))
    }
  }

  async addMessage(text, info, proof) {
    const id = Math.random().toString(16).slice(2)
    await this.base.append(GojiDispatch.encode('@goji/add-chat', { id, text, info, proof: proof || null }))
  }

  async appendIdentity({ displayName, role, assignedBy, assignedAt }) {
    await this.base.append(
      GojiDispatch.encode('@goji/update-identity', {
        writerKey: this.localBase.key,
        displayName,
        role: role || 'pending',
        assignedBy: assignedBy || null,
        assignedAt: assignedAt || null,
        updatedAt: Date.now()
      })
    )
  }

  async assignRole(writerKeyHex, role, assignedByKey) {
    const writerKey = b4a.from(writerKeyHex, 'hex')
    const existing = await this.view.get('@goji/identity', { writerKey })
    if (!existing) return null

    const validRoles = ['employer', 'payee', 'payer', 'partner', 'pending']
    if (!validRoles.includes(role)) return null

    const next = {
      writerKey,
      displayName: existing.displayName,
      role,
      assignedBy: assignedByKey || this.localBase.key,
      assignedAt: Date.now(),
      updatedAt: Date.now()
    }
    await applyUpdate(this.view, '@goji/identity', { writerKey }, () => next)
    await this.base.append(GojiDispatch.encode('@goji/assign-role', next))
    return next
  }

  async appendBoard(action) {
    if (action.type === 'add-board') {
      await this.base.append(GojiDispatch.encode('@goji/add-board', encodeBoard(action.board)))
    } else if (action.type === 'rename-board') {
      await this.base.append(
        GojiDispatch.encode('@goji/rename-board', {
          id: hexId(action.id),
          name: action.name,
          at: action.at
        })
      )
    } else if (action.type === 'delete-board') {
      await this.base.append(GojiDispatch.encode('@goji/delete-board', { id: hexId(action.id) }))
    }
  }

  async appendCard(action) {
    if (action.type === 'add-card') {
      await this.base.append(GojiDispatch.encode('@goji/add-card', encodeCard(action.card)))
    } else if (action.type === 'update-card') {
      await this.base.append(
        GojiDispatch.encode('@goji/update-card', {
          id: hexId(action.id),
          patch: action.patch,
          at: action.at
        })
      )
    } else if (action.type === 'remove-card') {
      await this.base.append(GojiDispatch.encode('@goji/remove-card', { id: hexId(action.id) }))
    }
  }

  async appendConnection(action) {
    if (action.type === 'add-connection') {
      await this.base.append(
        GojiDispatch.encode('@goji/add-connection', encodeConnection(action.connection))
      )
    } else if (action.type === 'remove-connection') {
      await this.base.append(
        GojiDispatch.encode('@goji/remove-connection', { id: hexId(action.id) })
      )
    } else if (action.type === 'update-connection') {
      await this.base.append(
        GojiDispatch.encode('@goji/update-connection', { id: hexId(action.id), patch: action.patch })
      )
    }
  }

  async close() {
    await this.pairMember?.close()
    await this.base?.close()
    await this.localBase.close()
    await this.pairing.close()
  }
}

function hexId(s) {
  if (b4a.isBuffer(s)) return s
  return b4a.from(String(s).replace(/-/g, ''), 'hex')
}

async function applyUpdate(view, name, query, mutate) {
  const existing = await view.get(name, query)
  if (!existing) return
  const next = mutate(existing)
  if (!next) return
  await view.delete(name, query)
  await view.insert(name, next)
}

function encodeBoard(b) {
  return { id: hexId(b.id), name: b.name, createdAt: b.createdAt, updatedAt: b.updatedAt }
}

function encodeCard(c) {
  return {
    id: hexId(c.id),
    boardId: hexId(c.boardId),
    category: c.category,
    title: c.title,
    x: c.x,
    y: c.y,
    fields: c.fields || {},
    updatedAt: c.updatedAt
  }
}

function encodeConnection(conn) {
  return {
    id: hexId(conn.id),
    boardId: hexId(conn.boardId),
    from: conn.from,
    to: conn.to,
    label: conn.label || null,
    updatedAt: conn.updatedAt,
    amount: conn.amount || null,
    payment: conn.payment || null,
    document: conn.document || null,
    template: conn.template || null,
    customDoc: conn.customDoc || null,
    docName: conn.docName || null,
    txHash: conn.txHash || null
  }
}

function decodeCard(raw) {
  return {
    id: b4a.toString(raw.id, 'hex'),
    boardId: b4a.toString(raw.boardId, 'hex'),
    category: raw.category,
    title: raw.title,
    x: raw.x,
    y: raw.y,
    fields: raw.fields || {},
    updatedAt: raw.updatedAt
  }
}

function decodeConnection(raw) {
  return {
    id: b4a.toString(raw.id, 'hex'),
    boardId: b4a.toString(raw.boardId, 'hex'),
    from: raw.from,
    to: raw.to,
    label: raw.label || null,
    updatedAt: raw.updatedAt,
    amount: raw.amount || null,
    payment: raw.payment || null,
    document: raw.document || null,
    template: raw.template || null,
    customDoc: raw.customDoc || null,
    docName: raw.docName || null,
    txHash: raw.txHash || null,
    delegationEnabled: raw.delegationEnabled || null
  }
}

async function main() {
  console.log(`goji v0.1.0`)
  console.log(`args: ${process.argv.slice(2).join(' ')}`)
  console.log(`mode: ${isGuest ? 'join' : 'host'}`)
  console.log(`port: ${PORT}`)

  let invite = INVITE
  if (isGuest && !invite) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    invite = await new Promise((resolve) => {
      rl.question('  enter invite code: ', (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    })
    if (!invite) {
      console.error('  invite code required')
      process.exit(1)
    }
  }

  const store = new Corestore(STORAGE)
  const swarm = new Hyperswarm()
  const room = new GojiRoom(store, swarm, invite)

  let peers = 0
  swarm.on('connection', (conn) => {
    store.replicate(conn)
    peers++
    const peerKey = conn.remotePublicKey?.toString('hex')?.slice(0, 16) || 'unknown'
    console.log(`[peer] connected (total: ${peers}) — ${peerKey}...`)
    conn.once('close', () => {
      peers--
      console.log(`[peer] disconnected (total: ${peers})`)
    })
  })

  swarm.on('update', () => {
    console.log(`[swarm] update (peers: ${swarm.peers.length}, connections: ${swarm.connections.size})`)
  })

  await store.ready()
  await room.open()

  console.log(`[swarm] discovery: ${room.base.discoveryKey.toString('hex').slice(0, 16)}...`)
  console.log(`[swarm] listening on port: ${swarm.dht?.server?.address()?.port || 'unknown'}`)
  console.log(`[swarm] DHT bootstrap nodes: ${swarm.dht?.bootstrap?.length || 'default'}`)
  console.log(`[swarm] peer ID: ${z32.encode(room.localBase.key)}`)

  const identityPath = require('path').join(STORAGE, 'identity.json')
  const identityData = await setupIdentity(STORAGE)
  let identityName = NAME || (identityData ? identityData.name : null) || `User-${room.localBase.key.toString('hex').slice(-4)}`

  // Check if identity already exists in view (guest may have been assigned a role)
  const existingIdentity = await room.view.get('@goji/identity', { writerKey: room.localBase.key })
  const role = isGuest ? (existingIdentity?.role || 'pending') : 'employer'
  await room.appendIdentity({ displayName: identityName, role })

  // Set up Keet identity for message signing
  let keetIdentity = null
  let deviceKeyPair = null
  let deviceProof = null
  if (identityData && identityData.mnemonic) {
    try {
      keetIdentity = await Identity.from({ mnemonic: identityData.mnemonic })
      deviceKeyPair = crypto.keyPair()
      deviceProof = await keetIdentity.bootstrap(deviceKeyPair.publicKey)
      console.log(`[identity] Keet identity ready: ${z32.encode(keetIdentity.identityPublicKey).slice(0, 16)}...`)
    } catch (err) {
      console.error('[identity] Keet identity setup failed:', err)
    }
  }

  const inviteCode = await room.getInvite()
  console.log(`\n  invite: ${inviteCode}`)
  console.log(`  share: npm start -- --join ${inviteCode}\n`)

  // Auto-create default templates if none exist (host only)
  if (!isGuest) {
    const existingTemplates = await room.view.find('@goji/templates', {}).toArray()
    if (existingTemplates.length === 0) {
      console.log('[templates] Creating default templates...')
      const defaultTemplates = [
        {
          name: 'Payment Receipt',
          companyName: identityName,
          fields: [
            { key: 'recipient', label: 'To', type: 'text', autoFill: true, position: 'body' },
            { key: 'amount', label: 'Amount', type: 'number', autoFill: true, position: 'body' },
            { key: 'date', label: 'Date', type: 'date', autoFill: true, position: 'body' },
            { key: 'txHash', label: 'Transaction', type: 'text', autoFill: true, position: 'footer' }
          ],
          html: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto;color:#333}h1{border-bottom:2px solid #7FD9B0;padding-bottom:10px;margin-bottom:5px}.subtitle{color:#666;margin-bottom:30px}.section{margin:20px 0}.section-title{font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:5px}.field{margin:12px 0}.label{color:#666;font-size:12px}.value{font-size:16px;color:#333}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:11px}</style></head><body><h1>${identityName}</h1><div class="subtitle">Payment Receipt</div><div class="section"><div class="section-title">Details</div><div class="field"><div class="label">To</div><div class="value">{{recipient}}</div></div><div class="field"><div class="label">Amount</div><div class="value">{{amount}} USDC</div></div><div class="field"><div class="label">Date</div><div class="value">{{date}}</div></div></div><div class="footer"><div class="field"><div class="label">Transaction</div><div class="value" style="font-family:monospace;font-size:12px">{{txHash}}</div></div>Generated by Goji</div></body></html>`
        },
        {
          name: 'Invoice',
          companyName: identityName,
          fields: [
            { key: 'recipient', label: 'Bill To', type: 'text', autoFill: true, position: 'body' },
            { key: 'amount', label: 'Amount', type: 'number', autoFill: true, position: 'body' },
            { key: 'invoiceNumber', label: 'Invoice Number', type: 'text', autoFill: false, position: 'header' },
            { key: 'dueDate', label: 'Due Date', type: 'date', autoFill: false, position: 'header' },
            { key: 'date', label: 'Date', type: 'date', autoFill: true, position: 'header' },
            { key: 'txHash', label: 'Transaction', type: 'text', autoFill: true, position: 'footer' }
          ],
          html: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto;color:#333}h1{border-bottom:2px solid #8B7FD6;padding-bottom:10px;margin-bottom:5px}.invoice-header{display:flex;justify-content:space-between;margin-bottom:30px}.subtitle{color:#666}.section{margin:20px 0}.section-title{font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:5px}.field{margin:12px 0}.label{color:#666;font-size:12px}.value{font-size:16px;color:#333}.total{font-size:20px;font-weight:bold;margin-top:20px;padding-top:20px;border-top:2px solid #8B7FD6}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:11px}</style></head><body><div class="invoice-header"><div><h1>${identityName}</h1><div class="subtitle">Invoice</div></div><div style="text-align:right"><div class="label">Invoice #</div><div class="value">{{invoiceNumber}}</div><div class="label">Date</div><div class="value">{{date}}</div><div class="label">Due Date</div><div class="value">{{dueDate}}</div></div></div><div class="section"><div class="section-title">Details</div><div class="field"><div class="label">Bill To</div><div class="value">{{recipient}}</div></div><div class="total"><div class="label">Total Amount</div><div class="value">{{amount}} USDC</div></div></div><div class="footer"><div class="field"><div class="label">Transaction</div><div class="value" style="font-family:monospace;font-size:12px">{{txHash}}</div></div>Generated by Goji</div></body></html>`
        },
        {
          name: 'Service Agreement',
          companyName: identityName,
          fields: [
            { key: 'recipient', label: 'Client', type: 'text', autoFill: true, position: 'body' },
            { key: 'amount', label: 'Amount', type: 'number', autoFill: true, position: 'body' },
            { key: 'serviceDate', label: 'Service Date', type: 'date', autoFill: false, position: 'header' },
            { key: 'terms', label: 'Terms', type: 'textarea', autoFill: false, position: 'body' },
            { key: 'date', label: 'Date', type: 'date', autoFill: true, position: 'header' },
            { key: 'txHash', label: 'Transaction', type: 'text', autoFill: true, position: 'footer' }
          ],
          html: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto;color:#333}h1{border-bottom:2px solid #ccc;padding-bottom:10px;margin-bottom:5px}.subtitle{color:#666;margin-bottom:30px}.section{margin:20px 0}.section-title{font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:5px}.field{margin:12px 0}.label{color:#666;font-size:12px}.value{font-size:16px;color:#333}.textarea{background:#f9f9f9;padding:12px;border-radius:6px;min-height:60px}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:11px}</style></head><body><h1>${identityName}</h1><div class="subtitle">Service Agreement</div><div class="section"><div class="section-title">Details</div><div class="field"><div class="label">Service Date</div><div class="value">{{serviceDate}}</div></div><div class="field"><div class="label">Client</div><div class="value">{{recipient}}</div></div><div class="field"><div class="label">Agreed Amount</div><div class="value">{{amount}} USDC</div></div><div class="field"><div class="label">Terms & Conditions</div><div class="textarea">{{terms}}</div></div></div><div class="footer"><div class="field"><div class="label">Transaction</div><div class="value" style="font-family:monospace;font-size:12px">{{txHash}}</div></div>Generated by Goji</div></body></html>`
        }
      ]

      for (const tmpl of defaultTemplates) {
        const now = Date.now()
        const id = require('crypto').randomBytes(16).toString('hex')
        const template = {
          id: b4a.from(id, 'hex'),
          name: tmpl.name,
          companyName: tmpl.companyName,
          fields: tmpl.fields,
          html: tmpl.html,
          isDefault: 1,
          createdBy: room.localBase.key,
          createdAt: now,
          updatedAt: now
        }
        await room.base.append(GojiDispatch.encode('@goji/add-template', template))
      }
      console.log('[templates] Default templates created')
    }
  }


  const app = express()
  app.use(express.json())
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    if (req.method === 'OPTIONS') return res.sendStatus(200)
    next()
  })

  app.get('/api/health', async (req, res) => {
    // Look up actual role from identity in view
    let identity = await room.view.get('@goji/identity', { writerKey: room.localBase.key })
    
    // Debug: log what we find
    if (isGuest) {
      console.log(`[health] guest identity lookup: role=${identity?.role || 'not found'}`)
    }
    
    // If role is still pending, wait and retry (role may be syncing from host)
    if (identity && identity.role === 'pending' && isGuest) {
      // Try up to 3 times with increasing delay
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 300))
        identity = await room.view.get('@goji/identity', { writerKey: room.localBase.key })
        console.log(`[health] retry ${i + 1}: role=${identity?.role || 'not found'}`)
        if (identity && identity.role !== 'pending') break
      }
    }
    
    const role = identity?.role || (isGuest ? 'pending' : 'employer')
    res.json({
      status: 'ok',
      name: identityName,
      peerId: z32.encode(room.localBase.key),
      peerIdHex: b4a.toString(room.localBase.key, 'hex'),
      role,
      writable: room.isWritable(),
      peers,
      port: PORT,
      storage: STORAGE,
      timestamp: Date.now()
    })
  })

  app.get('/api/username', (req, res) => res.json({ name: identityName }))

  app.get('/api/boards', async (req, res) => {
    const boards = await room.getBoards()
    res.json(
      boards.map((b) => ({
        id: b4a.toString(b.id, 'hex'),
        name: b.name,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      }))
    )
  })

  app.post('/api/boards', async (req, res) => {
    const now = Date.now()
    const id = require('crypto').randomBytes(16).toString('hex')
    const board = { id, name: req.body.name || 'Untitled', createdAt: now, updatedAt: now }
    await room.appendBoard({ type: 'add-board', board })
    res.json(board)
  })

  app.put('/api/boards/:id', async (req, res) => {
    await room.appendBoard({ type: 'rename-board', id: req.params.id, name: req.body.name, at: Date.now() })
    res.json({ ok: true })
  })

  app.delete('/api/boards/:id', async (req, res) => {
    await room.appendBoard({ type: 'delete-board', id: req.params.id })
    wsBroadcast({ type: 'board:deleted', id: req.params.id })
    res.json({ ok: true })
  })

  app.get('/api/cards', async (req, res) => {
    const cards = await room.getCards()
    let result = cards.map((c) => decodeCard(c))
    if (req.query.boardId) result = result.filter((c) => c.boardId === req.query.boardId)
    res.json(result)
  })

  app.post('/api/cards', async (req, res) => {
    const { boardId, category, title, x, y, fields } = req.body
    const now = Date.now()
    const id = require('crypto').randomBytes(16).toString('hex')
    const card = {
      id,
      boardId,
      category,
      title,
      x: x || 0,
      y: y || 0,
      fields: fields || {},
      updatedAt: now
    }
    await room.appendCard({ type: 'add-card', card })
    wsBroadcast({ type: 'card:added', card })
    res.json(card)
  })

  app.put('/api/cards/:id', async (req, res) => {
    await room.appendCard({
      type: 'update-card',
      id: req.params.id,
      patch: req.body.patch,
      at: Date.now()
    })
    wsBroadcast({ type: 'card:updated', id: req.params.id, patch: req.body.patch })
    res.json({ ok: true })
  })

  app.delete('/api/cards/:id', async (req, res) => {
    await room.appendCard({ type: 'remove-card', id: req.params.id })
    wsBroadcast({ type: 'card:deleted', id: req.params.id })
    res.json({ ok: true })
  })

  app.get('/api/connections', async (req, res) => {
    const conns = await room.getConnections()
    let result = conns.map((c) => decodeConnection(c))
    if (req.query.boardId) result = result.filter((c) => c.boardId === req.query.boardId)
    res.json(result)
  })

  app.post('/api/connections', async (req, res) => {
    const { boardId, from, to, label, amount, payment, document, template, customDoc, docName, txHash } = req.body
    const now = Date.now()
    const id = require('crypto').randomBytes(16)
    const connection = {
      id, 
      boardId: b4a.from(boardId, 'hex'), 
      from, to, label: label || null, updatedAt: now,
      amount: amount || null, 
      payment: payment || null, 
      document: document || null,
      template: template || null, customDoc: customDoc || null, docName: docName || null,
      txHash: txHash || null
    }
    await room.appendConnection({ type: 'add-connection', connection })
    // Return connection with hex string ID
    const response = { ...connection, id: b4a.toString(id, 'hex'), boardId: boardId }
    wsBroadcast({ type: 'connection:added', connection: response })
    res.json(response)
  })

  app.put('/api/connections/:id', async (req, res) => {
    const patch = req.body
    patch.updatedAt = Date.now()
    await room.appendConnection({ type: 'update-connection', id: req.params.id, patch })
    wsBroadcast({ type: 'connection:updated', id: req.params.id, patch })
    res.json({ ok: true })
  })

  app.delete('/api/connections/:id', async (req, res) => {
    await room.appendConnection({ type: 'remove-connection', id: req.params.id })
    wsBroadcast({ type: 'connection:deleted', id: req.params.id })
    res.json({ ok: true })
  })

  app.get('/api/chat', async (req, res) => {
    const messages = await room.getMessages()
    const verifiedMessages = messages.map((m) => {
      let verified = null
      if (m.proof && m.info && m.info.identityPublicKey) {
        try {
          const expectedKey = z32.decode(m.info.identityPublicKey)
          verified = Identity.verify(m.proof, Buffer.from(m.text), {
            expectedIdentity: expectedKey
          })
        } catch {}
      }
      return { id: m.id, text: m.text, info: { ...m.info, verified: !!verified } }
    })
    res.json(verifiedMessages)
  })

  app.post('/api/chat', async (req, res) => {
    let proof = null
    if (deviceKeyPair && deviceProof && keetIdentity) {
      proof = Identity.attestData(Buffer.from(req.body.text), deviceKeyPair, deviceProof)
    }

    const msg = {
      id: Math.random().toString(16).slice(2),
      text: req.body.text,
      info: {
        name: identityName,
        key: z32.encode(room.localBase.key),
        identityPublicKey: keetIdentity ? z32.encode(keetIdentity.identityPublicKey) : null,
        at: Date.now(),
        verified: !!proof
      }
    }
    await room.addMessage(msg.text, msg.info, proof)
    wsBroadcast({ type: 'chat:message', message: msg })
    res.json(msg)
  })

  app.delete('/api/chat/:id', async (req, res) => {
    const { id } = req.params
    const role = isGuest ? 'guest' : 'host'
    await room.base.append(
      GojiDispatch.encode('@goji/remove-chats', { ids: [id] })
    )
    wsBroadcast({ type: 'chat:deleted', id })
    res.json({ ok: true })
  })

  app.get('/api/wallets', async (req, res) => {
    const rows = await room.view.find('@goji/wallets', {}).toArray()
    const myKey = room.localBase.key
    const wallets = rows
      .filter((w) => b4a.equals(w.identityKey, myKey))
      .map((w) => {
        let verified = false
        if (w.proof && w.address && w.identityPublicKey) {
          try {
            verified = Identity.verify(w.proof, Buffer.from(w.address), {
              expectedIdentity: w.identityPublicKey
            })
          } catch {}
        }
        return {
          id: b4a.toString(w.id, 'hex'),
          address: w.address,
          chainType: w.chainType || null,
          walletType: w.walletType || null,
          name: w.name || null,
          verified: !!verified,
          createdAt: w.createdAt
        }
      })
    res.json(wallets)
  })

  app.get('/api/wallets/all', async (req, res) => {
    // Only employer can list all wallets
    const callerIdentity = await room.view.get('@goji/identity', { writerKey: room.localBase.key })
    if (!callerIdentity || callerIdentity.role !== 'employer') {
      return res.status(403).json({ error: 'Only employer can list all wallets' })
    }

    const rows = await room.view.find('@goji/wallets', {}).toArray()
    const identities = await room.view.find('@goji/identity', {}).toArray()
    const identityMap = new Map()
    for (const i of identities) {
      identityMap.set(b4a.toString(i.writerKey, 'hex'), i.displayName)
    }
    const wallets = rows.map((w) => {
      const ownerKey = b4a.toString(w.identityKey, 'hex')
      // Verify proof using identityPublicKey (keet identity)
      let verified = false
      if (w.proof && w.address && w.identityPublicKey) {
        try {
          verified = Identity.verify(w.proof, Buffer.from(w.address), {
            expectedIdentity: w.identityPublicKey
          })
        } catch {}
      }
      return {
        id: b4a.toString(w.id, 'hex'),
        address: w.address,
        chainType: w.chainType || null,
        walletType: w.walletType || null,
        name: w.name || null,
        owner: identityMap.get(ownerKey) || 'Unknown',
        ownerKey,
        verified: !!verified,
        createdAt: w.createdAt
      }
    })
    res.json(wallets)
  })

  app.post('/api/wallets', async (req, res) => {
    const { address, chainType, walletType, name } = req.body
    if (!address) return res.status(400).json({ error: 'address required' })
    const now = Date.now()
    const id = require('crypto').randomBytes(16).toString('hex')
    let proof = null
    let identityPublicKey = null
    if (deviceKeyPair && deviceProof && keetIdentity) {
      try {
        proof = Identity.attestData(Buffer.from(address), deviceKeyPair, deviceProof)
        identityPublicKey = keetIdentity.identityPublicKey
      } catch {}
    }
    const wallet = { id, address, chainType: chainType || null, walletType: walletType || null, name: name || null, identityKey: room.localBase.key, identityPublicKey, proof, createdAt: now }
    await room.base.append(GojiDispatch.encode('@goji/add-wallet', {
      id: require('b4a').from(id, 'hex'),
      address,
      chainType: chainType || null,
      walletType: walletType || null,
      name: name || null,
      identityKey: room.localBase.key,
      identityPublicKey,
      proof,
      createdAt: now
    }))
    wsBroadcast({ type: 'wallet:added', wallet })
    res.json(wallet)
  })

  app.delete('/api/wallets/:id', async (req, res) => {
    await room.base.append(
      GojiDispatch.encode('@goji/remove-wallet', { id: require('b4a').from(req.params.id, 'hex') })
    )
    wsBroadcast({ type: 'wallet:deleted', id: req.params.id })
    res.json({ ok: true })
  })

  app.get('/api/wallets/:id/balance', async (req, res) => {
    const rows = await room.view.find('@goji/wallets', {}).toArray()
    const wallet = rows.find((w) => b4a.toString(w.id, 'hex') === req.params.id)
    if (!wallet) return res.status(404).json({ error: 'wallet not found' })
    // Return mock balance for now - will connect to Circle Gateway later
    res.json({ balance: '0.000000', token: 'USDC' })
  })

  // Flow status endpoints
  app.get('/api/flow-status', async (req, res) => {
    if (!req.query.flowId) return res.status(400).json({ error: 'flowId required' })
    const rows = await room.view.find('@goji/flowStatuses', {}).toArray()
    const statuses = rows
      .filter((r) => b4a.toString(r.flowId, 'hex') === req.query.flowId)
      .map((r) => ({
        id: b4a.toString(r.id, 'hex'),
        flowId: b4a.toString(r.flowId, 'hex'),
        routeId: r.routeId,
        status: r.status,
        txHash: r.txHash || null,
        error: r.error || null,
        payslipHtml: r.payslipHtml || null,
        merkleRoot: r.merkleRoot || null,
        updatedAt: r.updatedAt
      }))
    res.json(statuses)
  })

  app.post('/api/flow-status', async (req, res) => {
    const { flowId, routeId, status, txHash, error } = req.body
    if (!flowId || !routeId || !status) return res.status(400).json({ error: 'flowId, routeId, status required' })

    // Skip if route already has a status (settled or pending)
    const all = await room.view.find('@goji/flowStatuses', {}).toArray()
    const alreadyExists = all.find((r) =>
      b4a.toString(r.flowId, 'hex') === flowId &&
      r.routeId === routeId
    )
    if (alreadyExists) {
      return res.json({ id: b4a.toString(alreadyExists.id, 'hex'), flowId, routeId, status: alreadyExists.status, txHash: alreadyExists.txHash, error: null, payslipHtml: alreadyExists.payslipHtml, updatedAt: alreadyExists.updatedAt, skipped: true })
    }

    const now = Date.now()
    const id = require('crypto').randomBytes(16).toString('hex')
    // Ensure routeId is a string
    const routeIdStr = typeof routeId === 'string' ? routeId : b4a.toString(routeId, 'hex')
    await room.base.append(GojiDispatch.encode('@goji/set-flow-status', {
      id: b4a.from(id, 'hex'),
      flowId: b4a.from(flowId, 'hex'),
      routeId: routeIdStr,
      status,
      txHash: txHash || null,
      error: error || null,
      updatedAt: now
    }))
    wsBroadcast({ type: 'flow-status:updated', flowStatus: { id, flowId, routeId: routeIdStr, status, txHash, error, updatedAt: now } })
    res.json({ id, flowId, routeId: routeIdStr, status, txHash, error, updatedAt: now })
  })

  app.put('/api/flow-status/:id', async (req, res) => {
    const patch = req.body
    patch.updatedAt = Date.now()
    const existing = await room.view.get('@goji/flowStatuses', { id: b4a.from(req.params.id, 'hex') })
    if (existing) {
      await applyUpdate(room.view, '@goji/flowStatuses', { id: b4a.from(req.params.id, 'hex') }, () => ({
        id: existing.id,
        flowId: existing.flowId,
        routeId: existing.routeId,
        status: patch.status || existing.status,
        txHash: patch.txHash || existing.txHash,
        error: patch.error || existing.error,
        payslipHtml: patch.payslipHtml || existing.payslipHtml || null,
        merkleRoot: patch.merkleRoot || existing.merkleRoot || null,
        updatedAt: patch.updatedAt
      }))
      await room.base.append(GojiDispatch.encode('@goji/set-flow-status', {
        id: existing.id,
        flowId: existing.flowId,
        routeId: existing.routeId,
        status: patch.status || existing.status,
        txHash: patch.txHash || existing.txHash,
        error: patch.error || existing.error,
        payslipHtml: patch.payslipHtml || existing.payslipHtml || null,
        merkleRoot: patch.merkleRoot || existing.merkleRoot || null,
        updatedAt: patch.updatedAt
      }))
    }
    wsBroadcast({ type: 'flow-status:updated', flowStatus: { id: req.params.id, ...patch } })
    res.json({ ok: true })
  })

  app.delete('/api/flow-status/:flowId', async (req, res) => {
    const flowIdBuf = b4a.from(req.params.flowId, 'hex')
    // Only clear pending/signing statuses, keep settled/failed
    const all = await room.view.find('@goji/flowStatuses', {}).toArray()
    const toRemove = all.filter((r) => {
      if (!r.id || !r.flowId) return false
      if (!b4a.equals(r.flowId, flowIdBuf)) return false
      return r.status === 'pending' || r.status === 'signing' || r.status === 'sending'
    })
    for (const r of toRemove) {
      await room.base.append(GojiDispatch.encode('@goji/set-flow-status', {
        id: r.id,
        flowId: r.flowId,
        routeId: r.routeId,
        status: 'pending',
        txHash: null,
        error: null,
        payslipHtml: r.payslipHtml || null,
        updatedAt: Date.now()
      }))
    }
    wsBroadcast({ type: 'flow-status:cleared', flowId: req.params.flowId })
    res.json({ ok: true, cleared: toRemove.length })
  })

  // Template endpoints
  app.get('/api/templates', async (req, res) => {
    const templates = await room.view.find('@goji/templates', {}).toArray()
    const result = templates.map((t) => ({
      id: b4a.toString(t.id, 'hex'),
      name: t.name,
      companyName: t.companyName || null,
      fields: t.fields || [],
      html: t.html,
      isDefault: !!t.isDefault,
      createdBy: t.createdBy ? b4a.toString(t.createdBy, 'hex') : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }))
    res.json(result)
  })

  app.post('/api/templates', async (req, res) => {
    const { name, companyName, fields, html } = req.body
    if (!name || !html) return res.status(400).json({ error: 'name and html required' })
    const now = Date.now()
    const id = require('crypto').randomBytes(16).toString('hex')
    const template = {
      id: b4a.from(id, 'hex'),
      name,
      companyName: companyName || null,
      fields: fields || [],
      html,
      isDefault: 0,
      createdBy: room.localBase.key,
      createdAt: now,
      updatedAt: now
    }
    await room.base.append(GojiDispatch.encode('@goji/add-template', template))
    wsBroadcast({ type: 'template:added', template: { ...template, id } })
    res.json({ id, name, companyName, fields, html, isDefault: false, createdAt: now })
  })

  app.put('/api/templates/:id', async (req, res) => {
    const { name, companyName, fields, html } = req.body
    const id = b4a.from(req.params.id, 'hex')
    const existing = await room.view.get('@goji/templates', { id })
    if (!existing) return res.status(404).json({ error: 'template not found' })
    const now = Date.now()
    const next = {
      ...existing,
      name: name || existing.name,
      companyName: companyName !== undefined ? companyName : existing.companyName,
      fields: fields || existing.fields,
      html: html || existing.html,
      updatedAt: now
    }
    await room.base.append(GojiDispatch.encode('@goji/update-template', next))
    wsBroadcast({ type: 'template:updated', template: { ...next, id: req.params.id } })
    res.json({ ok: true })
  })

  app.delete('/api/templates/:id', async (req, res) => {
    const id = b4a.from(req.params.id, 'hex')
    await room.base.append(GojiDispatch.encode('@goji/remove-template', { id }))
    wsBroadcast({ type: 'template:deleted', id: req.params.id })
    res.json({ ok: true })
  })

  // ── Receivables ──────────────────────────────────────────

  app.get('/api/receivables', async (req, res) => {
    const rows = await room.view.find('@goji/receivables', {}).toArray()
    const result = rows.map((r) => ({
      id: b4a.toString(r.id, 'hex'),
      tokenAddress: r.tokenAddress,
      name: r.name,
      type: r.type,
      amount: r.amount,
      interestRate: r.interestRate,
      minInvestment: r.minInvestment,
      expiryDays: r.expiryDays,
      proofs: r.proofs || [],
      status: r.status,
      issuer: r.issuer ? b4a.toString(r.issuer, 'hex') : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }))
    res.json(result)
  })

  app.get('/api/receivables/:id', async (req, res) => {
    const id = b4a.from(req.params.id, 'hex')
    const r = await room.view.get('@goji/receivables', { id })
    if (!r) return res.status(404).json({ error: 'receivable not found' })
    res.json({
      id: b4a.toString(r.id, 'hex'),
      tokenAddress: r.tokenAddress,
      name: r.name,
      type: r.type,
      amount: r.amount,
      interestRate: r.interestRate,
      minInvestment: r.minInvestment,
      expiryDays: r.expiryDays,
      proofs: r.proofs || [],
      status: r.status,
      issuer: r.issuer ? b4a.toString(r.issuer, 'hex') : null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })
  })

  app.post('/api/receivables', async (req, res) => {
    const { tokenAddress, name, type, amount, interestRate, minInvestment, expiryDays, proofs, status } = req.body
    if (!tokenAddress || !name || !type || !amount) {
      return res.status(400).json({ error: 'tokenAddress, name, type, amount required' })
    }
    const now = Date.now()
    const id = require('crypto').randomBytes(16).toString('hex')
    const receivable = {
      id: b4a.from(id, 'hex'),
      tokenAddress,
      name,
      type,
      amount: String(amount),
      interestRate: String(interestRate || '2000'),
      minInvestment: String(minInvestment || '1000000000000000000'),
      expiryDays: String(expiryDays || '90'),
      proofs: proofs || [],
      status: status || 'active',
      issuer: room.localBase.key,
      createdAt: now,
      updatedAt: now
    }
    await room.base.append(GojiDispatch.encode('@goji/add-receivable', receivable))
    wsBroadcast({ type: 'receivable:added', receivable: { ...receivable, id } })
    res.json({ id, ...receivable })
  })

  app.put('/api/receivables/:id', async (req, res) => {
    const { status } = req.body
    const id = b4a.from(req.params.id, 'hex')
    const existing = await room.view.get('@goji/receivables', { id })
    if (!existing) return res.status(404).json({ error: 'receivable not found' })
    const now = Date.now()
    const next = {
      ...existing,
      status: status || existing.status,
      updatedAt: now
    }
    await room.base.append(GojiDispatch.encode('@goji/update-receivable', next))
    wsBroadcast({ type: 'receivable:updated', receivable: { ...next, id: req.params.id } })
    res.json({ ok: true })
  })

  app.delete('/api/receivables/:id', async (req, res) => {
    const id = b4a.from(req.params.id, 'hex')
    await room.base.append(GojiDispatch.encode('@goji/remove-receivable', { id }))
    wsBroadcast({ type: 'receivable:deleted', id: req.params.id })
    res.json({ ok: true })
  })

  app.get('/api/peers', async (req, res) => {
    // Load from view to get all identities including remote peers
    const rows = await room.view.find('@goji/identity', {}).toArray()
    const seen = new Set()
    const peers = []
    for (const r of rows) {
      const key = b4a.toString(r.writerKey, 'hex')
      if (!seen.has(key)) {
        seen.add(key)
        peers.push({
          key,
          name: r.displayName,
          role: r.role || 'pending',
          assignedBy: r.assignedBy ? b4a.toString(r.assignedBy, 'hex') : null,
          assignedAt: r.assignedAt || null,
          updatedAt: r.updatedAt
        })
      }
    }
    res.json(peers)
  })

  app.get('/api/members', async (req, res) => {
    // Only employer can list members
    const callerIdentity = await room.view.get('@goji/identity', { writerKey: room.localBase.key })
    if (!callerIdentity || callerIdentity.role !== 'employer') {
      return res.status(403).json({ error: 'Only employer can list members' })
    }

    const identities = await room.getIdentities()
    res.json(identities)
  })

  app.post('/api/members/assign', async (req, res) => {
    // Only employer can assign roles
    const callerIdentity = await room.view.get('@goji/identity', { writerKey: room.localBase.key })
    if (!callerIdentity || callerIdentity.role !== 'employer') {
      return res.status(403).json({ error: 'Only employer can assign roles' })
    }

    const { writerKey, role } = req.body
    if (!writerKey || !role) {
      return res.status(400).json({ error: 'writerKey and role required' })
    }

    const validRoles = ['employer', 'payee', 'payer', 'partner', 'pending']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` })
    }

    const assigned = await room.assignRole(writerKey, role, room.localBase.key)
    if (!assigned) {
      return res.status(404).json({ error: 'Member not found' })
    }

    console.log(`[role] assigned ${role} to ${assigned.displayName} (${writerKey.slice(0, 8)}...)`)
    wsBroadcast({ type: 'role:assigned', writerKey, role })
    res.json({ ok: true, writerKey, role })
  })

  app.put('/api/username', async (req, res) => {
    const { name } = req.body
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name required' })
    }
    identityName = name
    const existing = await loadIdentity(identityPath)
    if (existing) {
      await saveIdentity(identityPath, { ...existing, name })
    }
    await room.appendIdentity({ displayName: name })
    res.json({ ok: true, name })
  })

  const server = app.listen(PORT, () => {
    console.log(`[goji] HTTP  http://localhost:${PORT}/api/health`)
    console.log(`[goji] WS    ws://localhost:${PORT}\n`)
  })

  const wss = new WebSocketServer({ server })
  const wsClients = new Set()
  wss.on('connection', (ws) => {
    wsClients.add(ws)
    ws.on('close', () => wsClients.delete(ws))
    ws.on('error', () => wsClients.delete(ws))
  })

  function wsBroadcast(data) {
    const msg = JSON.stringify(data)
    for (const ws of wsClients) {
      if (ws.readyState === 1) ws.send(msg)
    }
  }

  process.on('SIGINT', async () => {
    console.log('\n[goji] shutting down...')
    await room.close()
    await swarm.destroy()
    await store.close()
    server.close()
    process.exit(0)
  })
}

async function loadIdentity(path) {
  try {
    const data = await require('fs').promises.readFile(path, 'utf-8')
    const json = JSON.parse(data)
    return json
  } catch {
    return null
  }
}

async function saveIdentity(path, data) {
  const dir = require('path').dirname(path)
  await require('fs').promises.mkdir(dir, { recursive: true })
  await require('fs').promises.writeFile(path, JSON.stringify(data, null, 2))
}

async function setupIdentity(storagePath) {
  const identityPath = require('path').join(storagePath, 'identity.json')

  // Check if identity already exists
  const existing = await loadIdentity(identityPath)
  if (existing && existing.mnemonic) {
    console.log(`[identity] loaded existing identity: ${existing.name}`)
    return existing
  }

  // No identity found - prompt for setup
  if (!Identity) {
    console.error('[identity] keet-identity-key not available')
    return null
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const prompt = (q) => new Promise((resolve) => rl.question(q, resolve))

  console.log('\n┌───────────────────────────────────────────┐')
  console.log('│  No identity found                        │')
  console.log('│                                           │')
  console.log('│  1. Generate new identity                 │')
  console.log('│  2. Import existing mnemonic              │')
  console.log('└───────────────────────────────────────────┘')
  console.log('  Note: This is your P2P identity for collaborating')
  console.log('        with your team over Hyperswarm. (Not a wallet)\n')

  let choice = ''
  while (choice !== '1' && choice !== '2') {
    choice = await prompt('Choose (1 or 2): ')
  }

  let mnemonic, identityPublicKey, name

  if (choice === '1') {
    // Generate new identity
    mnemonic = Identity.generateMnemonic()
    const identity = await Identity.from({ mnemonic })
    identityPublicKey = identity.identityPublicKey

    console.log('\n✓ New identity generated')
    console.log(`\n  Mnemonic:\n  ${mnemonic}\n`)
    console.log('  ⚠ Save this mnemonic! It\'s your portable identity.\n')

    name = await prompt('Enter display name: ')
    name = name.trim() || `User-${Date.now().toString(16).slice(-4)}`
  } else {
    // Import existing mnemonic
    const input = await prompt('Enter 24-word mnemonic: ')
    mnemonic = input.trim()

    try {
      const identity = await Identity.from({ mnemonic })
      identityPublicKey = identity.identityPublicKey
      console.log('\n✓ Mnemonic validated')
    } catch (err) {
      console.error('\n✗ Invalid mnemonic:', err.message)
      rl.close()
      return null
    }

    name = await prompt('Enter display name: ')
    name = name.trim() || `User-${Date.now().toString(16).slice(-4)}`
  }

  rl.close()

  const identityData = { name, mnemonic, identityPublicKey }
  await saveIdentity(identityPath, identityData)
  console.log(`✓ Identity saved to ${identityPath}\n`)

  return identityData
}

main().catch((err) => {
  console.error('[goji] fatal:', err)
  process.exit(1)
})
