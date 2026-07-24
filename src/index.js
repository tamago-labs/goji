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
      // Cache for peers endpoint
      this.identities.set(b4a.toString(writerKey, 'hex'), {
        key: b4a.toString(writerKey, 'hex'),
        name: data.displayName,
        updatedAt: next.updatedAt
      })
    })
    this.router.add('@goji/add-wallet', async (data, ctx) => {
      await ctx.view.insert('@goji/wallets', data)
    })
    this.router.add('@goji/remove-wallet', async (data, ctx) => {
      await ctx.view.delete('@goji/wallets', { id: data.id })
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

  async addMessage(text, info, proof) {
    const id = Math.random().toString(16).slice(2)
    await this.base.append(GojiDispatch.encode('@goji/add-chat', { id, text, info, proof: proof || null }))
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
    console.log(`[peer] connected (total: ${peers})`)
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
  await room.appendIdentity({ displayName: identityName })

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
      .filter((w) => {
        // Filter by current user's identity key
        return b4a.equals(w.identityKey, myKey)
      })
      .map((w) => ({
        id: b4a.toString(w.id, 'hex'),
        address: w.address,
        chainType: w.chainType || null,
        walletType: w.walletType || null,
        name: w.name || null,
        createdAt: w.createdAt
      }))
    res.json(wallets)
  })

  app.post('/api/wallets', async (req, res) => {
    const { address, chainType, walletType, name } = req.body
    if (!address) return res.status(400).json({ error: 'address required' })
    const now = Date.now()
    const id = require('crypto').randomBytes(16).toString('hex')
    const wallet = { id, address, chainType: chainType || null, walletType: walletType || null, name: name || null, identityKey: room.localBase.key, createdAt: now }
    await room.base.append(GojiDispatch.encode('@goji/add-wallet', {
      id: require('b4a').from(id, 'hex'),
      address,
      chainType: chainType || null,
      walletType: walletType || null,
      name: name || null,
      identityKey: room.localBase.key,
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

  app.get('/api/peers', async (req, res) => {
    // Load from view to get all identities including remote peers
    const rows = await room.view.find('@goji/identity', {}).toArray()
    const seen = new Set()
    const peers = []
    for (const r of rows) {
      const key = b4a.toString(r.writerKey, 'hex')
      if (!seen.has(key)) {
        seen.add(key)
        peers.push({ key, name: r.displayName, updatedAt: r.updatedAt })
      }
    }
    res.json(peers)
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
