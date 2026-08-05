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
    { name: 'updatedAt', type: 'int', required: true },
    { name: 'amount', type: 'string' },
    { name: 'payment', type: 'int' },
    { name: 'document', type: 'int' },
    { name: 'template', type: 'string' },
    { name: 'customDoc', type: 'string' },
    { name: 'docName', type: 'string' },
    { name: 'txHash', type: 'string' },
    { name: 'delegationEnabled', type: 'int' }
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
    { name: 'proof', type: 'buffer' },
    { name: 'createdAt', type: 'int', required: true },
    { name: 'identityPublicKey', type: 'buffer' }
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
    { name: 'updatedAt', type: 'int', required: true },
    { name: 'amount', type: 'string' },
    { name: 'payment', type: 'int' },
    { name: 'document', type: 'int' },
    { name: 'template', type: 'string' },
    { name: 'customDoc', type: 'string' },
    { name: 'docName', type: 'string' },
    { name: 'txHash', type: 'string' },
    { name: 'delegationEnabled', type: 'int' }
  ]
})

schema.register({
  name: 'connection-remove',
  fields: [{ name: 'id', type: 'buffer', required: true }]
})

schema.register({
  name: 'connection-update',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'patch', type: 'json', required: true }
  ]
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
    { name: 'role', type: 'string', default: 'pending' },
    { name: 'assignedBy', type: 'buffer' },
    { name: 'assignedAt', type: 'int' },
    { name: 'updatedAt', type: 'int', required: true }
  ]
})

schema.register({
  name: 'flow-status',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'flowId', type: 'buffer', required: true },
    { name: 'routeId', type: 'string', required: true },
    { name: 'status', type: 'string', required: true },
    { name: 'txHash', type: 'string' },
    { name: 'error', type: 'string' },
    { name: 'payslipHtml', type: 'string' },
    { name: 'merkleRoot', type: 'string' },
    { name: 'updatedAt', type: 'int', required: true }
  ]
})

schema.register({
  name: 'flow-status-remove',
  fields: [{ name: 'flowId', type: 'buffer', required: true }]
})

schema.register({
  name: 'template',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'companyName', type: 'string' },
    { name: 'fields', type: 'json' },
    { name: 'html', type: 'string', required: true },
    { name: 'isDefault', type: 'int' },
    { name: 'createdBy', type: 'buffer' },
    { name: 'createdAt', type: 'int', required: true },
    { name: 'updatedAt', type: 'int', required: true },
    { name: 'key', type: 'string' },
    { name: 'flowType', type: 'string' },
    { name: 'version', type: 'int' }
  ]
})

schema.register({
  name: 'template-remove',
  fields: [{ name: 'id', type: 'buffer', required: true }]
})

schema.register({
  name: 'receivable',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'tokenAddress', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'type', type: 'string', required: true },
    { name: 'amount', type: 'string', required: true },
    { name: 'interestRate', type: 'string', required: true },
    { name: 'minInvestment', type: 'string', required: true },
    { name: 'expiryDays', type: 'string', required: true },
    { name: 'proofs', type: 'json', required: true },
    { name: 'status', type: 'string', required: true },
    { name: 'issuer', type: 'buffer', required: true },
    { name: 'createdAt', type: 'int', required: true },
    { name: 'updatedAt', type: 'int', required: true },
    { name: 'complianceRegistry', type: 'string' },
    { name: 'requiredTier', type: 'int' },
    { name: 'allowedCountries', type: 'json' }
  ]
})

schema.register({
  name: 'receivable-remove',
  fields: [{ name: 'id', type: 'buffer', required: true }]
})

schema.register({
  name: 'company-profile',
  fields: [
    { name: 'id', type: 'buffer', required: true },
    { name: 'legalName', type: 'string', required: true },
    { name: 'tradingName', type: 'string' },
    { name: 'country', type: 'string' },
    { name: 'entityType', type: 'string' },
    { name: 'registrationNumber', type: 'string' },
    { name: 'taxId', type: 'string' },
    { name: 'localCurrency', type: 'string' },
    { name: 'fiscalYearStart', type: 'string' },
    { name: 'contactEmail', type: 'string' },
    { name: 'contactPhone', type: 'string' },
    { name: 'address', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'updatedAt', type: 'int', required: true }
  ]
})

schema.register({
  name: 'company-profile-remove',
  fields: [{ name: 'id', type: 'buffer', required: true }]
})

schema.register({
  name: 'compliance-identity',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'walletId', type: 'string', required: true },
    { name: 'walletAddress', type: 'string', required: true },
    { name: 'tokenId', type: 'string', required: true },
    { name: 'passId', type: 'string', required: true },
    { name: 'ownerKey', type: 'buffer', required: true },
    { name: 'status', type: 'string', required: true },
    { name: 'kycSource', type: 'string' },
    { name: 'kycId', type: 'string' },
    { name: 'subTier', type: 'int' },
    { name: 'subGroup', type: 'string' },
    { name: 'expirationTime', type: 'int' },
    { name: 'identityData', type: 'json' },
    { name: 'bankAccountData', type: 'json' },
    { name: 'approvedBy', type: 'buffer' },
    { name: 'approvedAt', type: 'int' },
    { name: 'lockedAt', type: 'int' },
    { name: 'rejectionReason', type: 'string' },
    { name: 'createdAt', type: 'int', required: true },
    { name: 'updatedAt', type: 'int', required: true },
    { name: 'auditLog', type: 'json' }
  ]
})

schema.register({
  name: 'knowledge-document',
  fields: [
    { name: 'id', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'source', type: 'string', required: true },
    { name: 'createdAt', type: 'string', required: true },
    { name: 'chunkCount', type: 'int', required: false }
  ]
})

schema.register({
  name: 'rag-search',
  fields: [
    { name: 'requestId', type: 'string', required: true },
    { name: 'fromKey', type: 'buffer', required: true },
    { name: 'toKey', type: 'buffer', required: true },
    { name: 'query', type: 'string', required: true },
    { name: 'topK', type: 'int', required: false },
    { name: 'createdAt', type: 'int', required: true }
  ]
})

schema.register({
  name: 'rag-search-result',
  fields: [
    { name: 'requestId', type: 'string', required: true },
    { name: 'fromKey', type: 'buffer', required: true },
    { name: 'toKey', type: 'buffer', required: true },
    { name: 'results', type: 'json', required: true },
    { name: 'error', type: 'string' },
    { name: 'createdAt', type: 'int', required: true }
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
db.collections.register({ name: 'flowStatuses', schema: '@goji/flow-status', key: ['id'] })
db.collections.register({ name: 'templates', schema: '@goji/template', key: ['id'] })
db.collections.register({ name: 'receivables', schema: '@goji/receivable', key: ['id'] })
db.collections.register({ name: 'companyProfiles', schema: '@goji/company-profile', key: ['id'] })
db.collections.register({ name: 'knowledgeDocuments', schema: '@goji/knowledge-document', key: ['id'] })
db.collections.register({ name: 'ragSearches', schema: '@goji/rag-search', key: ['requestId'] })
db.collections.register({ name: 'ragSearchResults', schema: '@goji/rag-search-result', key: ['requestId'] })
db.collections.register({ name: 'complianceIdentities', schema: '@goji/compliance-identity', key: ['id'] })

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
dispatch.register({ name: 'update-connection', requestType: '@goji/connection-update' })
dispatch.register({ name: 'add-chat', requestType: '@goji/chat-msg' })
dispatch.register({ name: 'remove-chats', requestType: '@goji/chats-remove' })
dispatch.register({ name: 'update-identity', requestType: '@goji/identity' })
dispatch.register({ name: 'assign-role', requestType: '@goji/identity' })
dispatch.register({ name: 'set-flow-status', requestType: '@goji/flow-status' })
dispatch.register({ name: 'remove-flow-statuses', requestType: '@goji/flow-status-remove' })
dispatch.register({ name: 'add-wallet', requestType: '@goji/wallet' })
dispatch.register({ name: 'remove-wallet', requestType: '@goji/wallet-remove' })
dispatch.register({ name: 'add-template', requestType: '@goji/template' })
dispatch.register({ name: 'update-template', requestType: '@goji/template' })
dispatch.register({ name: 'remove-template', requestType: '@goji/template-remove' })
dispatch.register({ name: 'add-receivable', requestType: '@goji/receivable' })
dispatch.register({ name: 'update-receivable', requestType: '@goji/receivable' })
dispatch.register({ name: 'remove-receivable', requestType: '@goji/receivable-remove' })
dispatch.register({ name: 'set-company-profile', requestType: '@goji/company-profile' })
dispatch.register({ name: 'remove-company-profile', requestType: '@goji/company-profile-remove' })
dispatch.register({ name: 'add-knowledge-document', requestType: '@goji/knowledge-document' })
dispatch.register({ name: 'rag-search', requestType: '@goji/rag-search' })
dispatch.register({ name: 'rag-search-result', requestType: '@goji/rag-search-result' })
dispatch.register({ name: 'add-compliance-identity', requestType: '@goji/compliance-identity' })
dispatch.register({ name: 'update-compliance-identity', requestType: '@goji/compliance-identity' })
dispatch.register({ name: 'remove-compliance-identity', requestType: '@goji/compliance-identity' })

Hyperdispatch.toDisk(hyperdispatch)

console.log('[schema] goji specs written to spec/')
