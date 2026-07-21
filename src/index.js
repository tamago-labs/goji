const express = require('express')
const { WebSocketServer } = require('ws')
const Autobase = require('autobase')
const b4a = require('b4a')
const BlindPairing = require('blind-pairing')
const Corestore = require('corestore')
const HyperDB = require('hyperdb')
const Hyperswarm = require('hyperswarm')
const z32 = require('z32')
const GojiDispatch = require('../spec/dispatch')
const GojiDb = require('../spec/db')

const PORT = parseInt(process.argv.find((a, i) => process.argv[i - 1] === '--port') || '3001', 10)
const isGuest = process.argv.includes('--guest')
const INVITE = process.argv.find((a, i) => process.argv[i - 1] === '--join') || null
const NAME = process.argv.find((a, i) => process.argv[i - 1] === '--name') || null
const STORAGE = isGuest ? './tmp-guest' : './.goji-storage'

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
      const boards = await ctx.view.find('@goji/boards', {}).toArray()
      if (boards.length <= 1) return
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
        updatedAt: data.updatedAt || Date.now()
      }
      const existing = await ctx.view.get('@goji/identity', { writerKey })
      if (existing) {
        await applyUpdate(ctx.view, '@goji/identity', { writerKey }, () => next)
      } else {
        await ctx.view.insert('@goji/identity', next)
      }
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

  async addMessage(text, info) {
    const id = Math.random().toString(16).slice(2)
    await this.base.append(GojiDispatch.encode('@goji/add-chat', { id, text, info }))
  }

  async appendIdentity({ displayName }) {
    await this.base.append(
      GojiDispatch.encode('@goji/update-identity', {
        writerKey: this.localBase.key,
        displayName,
        updatedAt: Date.now()
      })
    )
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
    updatedAt: conn.updatedAt
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
    updatedAt: raw.updatedAt
  }
}

const readline = require('readline')

async function main() {
  console.log(`goji v0.1.0`)
  console.log(`mode: ${isGuest ? 'guest' : 'host'}`)
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
    console.log(`[peer] connected (total: ${peers})`)
    conn.once('close', () => {
      peers--
      console.log(`[peer] disconnected (total: ${peers})`)
    })
  })

  await store.ready()
  await room.open()

  const identityName = NAME || `User-${room.localBase.key.toString('hex').slice(-4)}`
  await room.appendIdentity({ displayName: identityName })

  const inviteCode = await room.getInvite()
  console.log(`\n  invite: ${inviteCode}`)
  console.log(`  share: npm start -- --join ${inviteCode}\n`)

  await ensureDefaultBoard(room)

  const app = express()
  app.use(express.json())
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    if (req.method === 'OPTIONS') return res.sendStatus(200)
    next()
  })

  app.get('/api/health', (req, res) =>
    res.json({
      status: 'ok',
      name: identityName,
      peerId: z32.encode(room.localBase.key),
      role: isGuest ? 'guest' : 'host',
      writable: room.isWritable(),
      peers,
      port: PORT,
      storage: STORAGE,
      timestamp: Date.now()
    })
  )

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
    const { boardId, from, to, label } = req.body
    const now = Date.now()
    const id = require('crypto').randomBytes(16).toString('hex')
    const connection = { id, boardId, from, to, label: label || null, updatedAt: now }
    await room.appendConnection({ type: 'add-connection', connection })
    wsBroadcast({ type: 'connection:added', connection })
    res.json(connection)
  })

  app.delete('/api/connections/:id', async (req, res) => {
    await room.appendConnection({ type: 'remove-connection', id: req.params.id })
    wsBroadcast({ type: 'connection:deleted', id: req.params.id })
    res.json({ ok: true })
  })

  app.get('/api/chat', async (req, res) => {
    const messages = await room.getMessages()
    res.json(messages.map((m) => ({ id: m.id, text: m.text, info: m.info })))
  })

  app.post('/api/chat', async (req, res) => {
    await room.addMessage(req.body.text, {
      name: identityName,
      key: z32.encode(room.localBase.key),
      at: Date.now()
    })
    res.json({ ok: true })
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

async function ensureDefaultBoard(room) {
  if (!room.isWritable()) return
  const existing = await room.getBoards()
  if (existing.length > 0) return
  const now = Date.now()
  const id = b4a.alloc(16)
  id.writeUInt32BE(now >>> 0, 12)
  await room.appendBoard({
    type: 'add-board',
    board: { id: b4a.toString(id, 'hex'), name: 'Untitled', createdAt: now, updatedAt: now }
  })
  console.log('[goji] seeded default board')
}

main().catch((err) => {
  console.error('[goji] fatal:', err)
  process.exit(1)
})
