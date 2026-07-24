const Hyperschema = require('hyperschema')
const HyperdbBuilder = require('hyperdb/builder')
const Hyperdispatch = require('hyperdispatch')

const SCHEMA_DIR = './spec/schema'
const DB_DIR = './spec/db'
const DISPATCH_DIR = './spec/dispatch'

const hyperSchema = Hyperschema.from(SCHEMA_DIR)
const schema = hyperSchema.namespace('goji')

schema.register({
  name: 'writer',
  fields: [{ name: 'key', type: 'buffer', required: true }]
})

schema.register({
  name: 'invite',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'invite', type: 'buffer', required: true },
    { name: 'publicKey', type: 'buffer', required: true },
    { name: 'expires', type: 'int', required: true }
  ]
})

schema.register({
  name: 'board',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'createdAt', type: 'int', required: true },
    { name: 'updatedAt', type: 'int', required: true }
  ]
})

schema.register({
  name: 'card',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'boardId', type: 'buffer', required: true },
    { name: 'category', type: 'string', required: true },
    { name: 'title', type: 'string', required: true },
    { name: 'x', type: 'float64', required: true },
    { name: 'y', type: 'float64', required: true },
    { name: 'fields', type: 'json' },
    { name: 'updatedAt', type: 'int', required: true }
  ]
})

schema.register({
  name: 'connection',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'boardId', type: 'buffer', required: true },
    { name: 'from', type: 'string', required: true },
    { name: 'to', type: 'string', required: true },
    { name: 'label', type: 'string' },
    { name: 'updatedAt', type: 'int', required: true }
  ]
})

schema.register({
  name: 'chat-msg',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'text', type: 'string', required: true },
    { name: 'info', type: 'json' },
    { name: 'proof', type: 'buffer' }
  ]
})

schema.register({
  name: 'wallet',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'address', type: 'string', required: true },
    { name: 'chainType', type: 'string' },
    { name: 'walletType', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'identityKey', type: 'buffer', required: true },
    { name: 'createdAt', type: 'int', required: true }
  ]
})

schema.register({
  name: 'board-rename',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'at', type: 'int', required: true }
  ]
})

schema.register({
  name: 'board-delete',
  fields: [{ name: 'id', type: 'buffer', required: true }]
})

schema.register({
  name: 'card-update',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'patch', type: 'json', required: true },
    { name: 'at', type: 'int', required: true }
  ]
})

schema.register({
  name: 'card-remove',
  fields: [{ name: 'id', type: 'buffer', required: true }]
})

schema.register({
  name: 'connection-add',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'boardId', type: 'buffer', required: true },
    { name: 'from', type: 'string', required: true },
    { name: 'to', type: 'string', required: true },
    { name: 'label', type: 'string' },
    { name: 'updatedAt', type: 'int', required: true }
  ]
})

schema.register({
  name: 'connection-remove',
  fields: [{ name: 'id', type: 'buffer', required: true }]
})

schema.register({
  name: 'chats-remove',
  fields: [{ name: 'ids', type: 'json', required: true }]
})

schema.register({
  name: 'wallet-remove',
  fields: [{ name: 'id', type: 'buffer', required: true }]
})

schema.register({
  name: 'identity',
  fields: [
    { name: 'writerKey', type: 'buffer', required: true },
    { name: 'displayName', type: 'string', required: true },
    { name: 'updatedAt', type: 'int', required: true }
  ]
})

Hyperschema.toDisk(hyperSchema)

const hyperdb = HyperdbBuilder.from(SCHEMA_DIR, DB_DIR)
const db = hyperdb.namespace('goji')

db.collections.register({ name: 'boards', schema: '@goji/board', key: ['id'] })
db.collections.register({ name: 'cards', schema: '@goji/card', key: ['id'] })
db.collections.register({ name: 'connections', schema: '@goji/connection', key: ['id'] })
db.collections.register({ name: 'chat', schema: '@goji/chat-msg', key: ['id'] })
db.collections.register({ name: 'invites', schema: '@goji/invite', key: ['id'] })
db.collections.register({ name: 'identity', schema: '@goji/identity', key: ['writerKey'] })
db.collections.register({ name: 'wallets', schema: '@goji/wallet', key: ['id'] })

HyperdbBuilder.toDisk(hyperdb)

const hyperdispatch = Hyperdispatch.from(SCHEMA_DIR, DISPATCH_DIR, { offset: 0 })
const dispatch = hyperdispatch.namespace('goji')

dispatch.register({ name: 'add-writer', requestType: '@goji/writer' })
dispatch.register({ name: 'add-invite', requestType: '@goji/invite' })
dispatch.register({ name: 'add-board', requestType: '@goji/board' })
dispatch.register({ name: 'rename-board', requestType: '@goji/board-rename' })
dispatch.register({ name: 'delete-board', requestType: '@goji/board-delete' })
dispatch.register({ name: 'add-card', requestType: '@goji/card' })
dispatch.register({ name: 'update-card', requestType: '@goji/card-update' })
dispatch.register({ name: 'remove-card', requestType: '@goji/card-remove' })
dispatch.register({ name: 'add-connection', requestType: '@goji/connection-add' })
dispatch.register({ name: 'remove-connection', requestType: '@goji/connection-remove' })
dispatch.register({ name: 'add-chat', requestType: '@goji/chat-msg' })
dispatch.register({ name: 'remove-chats', requestType: '@goji/chats-remove' })
dispatch.register({ name: 'update-identity', requestType: '@goji/identity' })
dispatch.register({ name: 'add-wallet', requestType: '@goji/wallet' })
dispatch.register({ name: 'remove-wallet', requestType: '@goji/wallet-remove' })

Hyperdispatch.toDisk(hyperdispatch)

console.log('[schema] goji specs written to spec/')
