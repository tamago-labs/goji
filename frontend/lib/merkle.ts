import { keccak256, toBytes } from 'viem'
import { MerkleTree } from 'merkletreejs'

/**
 * Hash a single value using keccak256
 */
function hashValue(value: string): Buffer {
  return Buffer.from(keccak256(toBytes(value)).slice(2), 'hex')
}

/**
 * Build Merkle tree from document values
 */
export function buildMerkleTree(values: string[]): MerkleTree {
  const leaves = values.map((v) => hashValue(v))
  return new MerkleTree(leaves, hashValue, { sortPairs: true })
}

/**
 * Get Merkle root hash from tree
 */
export function getMerkleRoot(tree: MerkleTree): `0x${string}` {
  const root = tree.getHexRoot()
  return root as `0x${string}`
}
