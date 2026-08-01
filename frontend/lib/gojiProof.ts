// GojiProof ABI - from contracts/out/GojiProof.sol/GojiProof.json
export const GOJIPROOF_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "anchorRoot",
    "inputs": [
      { "name": "merkleRoot", "type": "bytes32", "internalType": "bytes32" },
      { "name": "connectionId", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [
      { "name": "timestamp", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "connectionToRoot",
    "inputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "documents",
    "inputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "outputs": [
      { "name": "merkleRoot", "type": "bytes32", "internalType": "bytes32" },
      { "name": "connectionId", "type": "bytes32", "internalType": "bytes32" },
      { "name": "submitter", "type": "address", "internalType": "address" },
      { "name": "timestamp", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDocument",
    "inputs": [{ "name": "merkleRoot", "type": "bytes32", "internalType": "bytes32" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct GojiProof.DocumentRecord",
        "components": [
          { "name": "merkleRoot", "type": "bytes32", "internalType": "bytes32" },
          { "name": "connectionId", "type": "bytes32", "internalType": "bytes32" },
          { "name": "submitter", "type": "address", "internalType": "address" },
          { "name": "timestamp", "type": "uint256", "internalType": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRootByConnection",
    "inputs": [{ "name": "connectionId", "type": "bytes32", "internalType": "bytes32" }],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasDocument",
    "inputs": [{ "name": "connectionId", "type": "bytes32", "internalType": "bytes32" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isAnchored",
    "inputs": [{ "name": "merkleRoot", "type": "bytes32", "internalType": "bytes32" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "RootAnchored",
    "inputs": [
      { "name": "merkleRoot", "type": "bytes32", "indexed": true, "internalType": "bytes32" },
      { "name": "connectionId", "type": "bytes32", "indexed": true, "internalType": "bytes32" },
      { "name": "submitter", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "timestamp", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "stateMutability": "nonpayable"
  }
] as const
