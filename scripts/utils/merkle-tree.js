const utils = require('ethereumjs-util')
const Buffer = require('safe-buffer').Buffer

const sha3 = utils.keccak256

module.exports = class MerkleTree {
  constructor(leaves = []) {
    if (leaves.length < 1) {
      throw new Error('Atleast 1 leaf needed')
    }

    const depth = Math.ceil(Math.log(leaves.length) / Math.log(2))
    if (depth > 20) {
      throw new Error('Depth must be 20 or less')
    }

    const l = leaves.concat(
      Array.from(Array(Math.pow(2, depth) - leaves.length), () =>
        utils.zeros(32)
      )
    )

    this.leaves = l
    this.layers = [l]
    this.createHashes(this.leaves)
  }

  createHashes(nodes) {
    if (nodes.length === 1) {
      return false
    }

    const treeLevel = []
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i]
      const right = nodes[i + 1]
      const data = Buffer.concat([left, right])
      treeLevel.push(sha3(data))
    }

    // is odd number of nodes
    if (nodes.length % 2 === 1) {
      treeLevel.push(nodes[nodes.length - 1])
    }

    this.layers.push(treeLevel)
    this.createHashes(treeLevel)
  }

  getLeaves() {
    return this.leaves
  }

  getLayers() {
    return this.layers
  }

  getRoot() {
    return this.layers[this.layers.length - 1][0]
  }

  getProof(leaf) {
    let index = -1
    for (let i = 0; i < this.leaves.length; i++) {
      if (Buffer.compare(leaf, this.leaves[i]) === 0) {
        index = i
      }
    }

    const proof = []
    if (index <= this.getLeaves().length) {
      let siblingIndex
      for (let i = 0; i < this.layers.length - 1; i++) {
        if (index % 2 === 0) {
          siblingIndex = index + 1
        } else {
          siblingIndex = index - 1
        }
        index = parseInt(index / 2)
        proof.push(this.layers[i][siblingIndex])
      }
    }
    return proof
  }

  verify(value, index, root, proof) {
    if (!Array.isArray(proof) || !value || !root) {
      return false
    }

    let hash = value
    for (let i = 0; i < proof.length; i++) {
      const node = proof[i]
      if (index % 2 === 0) {
        hash = sha3(Buffer.concat([hash, node]))
      } else {
        hash = sha3(Buffer.concat([node, hash]))
      }

      index = parseInt(index / 2)
    }

    return Buffer.compare(hash, root) === 0
  }
}

module.exports.MerkleTreeTwo = class MerkleTree {
  constructor(elements) {
    // Filter empty strings and hash elements
    this.elements = elements.filter(el => el).map(el => sha3(el))

    // Deduplicate elements
    this.elements = this.bufDedup(this.elements)
    // Sort elements
    this.elements.sort(Buffer.compare)

    // Create layers
    this.layers = this.getLayers(this.elements)
  }

  getLayers(elements) {
    if (elements.length === 0) {
      return [['']]
    }

    const layers = []
    layers.push(elements)

    // Get next layer until we reach the root
    while (layers[layers.length - 1].length > 1) {
      layers.push(this.getNextLayer(layers[layers.length - 1]))
    }

    return layers
  }

  getNextLayer(elements) {
    return elements.reduce((layer, el, idx, arr) => {
      if (idx % 2 === 0) {
        // Hash the current element with its pair element
        layer.push(this.combinedHash(el, arr[idx + 1]))
      }

      return layer
    }, [])
  }

  combinedHash(first, second) {
    if (!first) { return second }
    if (!second) { return first }

    return sha3(this.sortAndConcat(first, second))
  }

  getRoot() {
    return this.layers[this.layers.length - 1][0]
  }

  getHexRoot() {
    return utils.bufferToHex(this.getRoot())
  }

  getProof(el) {
    console.log(el, this.elements)
    let idx = this.bufIndexOf(el, this.elements)

    if (idx === -1) {
      throw new Error('Element does not exist in Merkle tree')
    }

    return this.layers.reduce((proof, layer) => {
      const pairElement = this.getPairElement(idx, layer)

      if (pairElement) {
        proof.push(pairElement)
      }

      idx = Math.floor(idx / 2)

      return proof
    }, [])
  }

  getHexProof(el) {
    const proof = this.getProof(el)

    return this.bufArrToHexArr(proof)
  }

  getPairElement(idx, layer) {
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1

    if (pairIdx < layer.length) {
      return layer[pairIdx]
    } else {
      return null
    }
  }

  bufIndexOf(el, arr) {
    let hash

    // Convert element to 32 byte hash if it is not one already
    if (el.length !== 32 || !Buffer.isBuffer(el)) {
      hash = sha3(el)
    } else {
      hash = el
    }

    for (let i = 0; i < arr.length; i++) {
      if (hash.equals(arr[i])) {
        return i
      }
    }

    return -1
  }

  bufDedup(elements) {
    return elements.filter((el, idx) => {
      return this.bufIndexOf(el, elements) === idx
    })
  }

  bufArrToHexArr(arr) {
    if (arr.some(el => !Buffer.isBuffer(el))) {
      throw new Error('Array is not an array of buffers')
    }

    return arr.map(el => '0x' + el.toString('hex'))
  }

  sortAndConcat(...args) {
    return Buffer.concat([...args].sort(Buffer.compare))
  }
}
