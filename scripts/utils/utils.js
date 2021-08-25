const encode = require('ethereumjs-abi').rawEncode
const ethUtils = require('ethereumjs-util')
const Buffer = require('safe-buffer').Buffer
const BN = ethUtils.BN

export function getSigs(wallets, votedata, order = true) {
  // avoid any potential side effects
  const copyWallets = [...wallets]

  if (order) {
    copyWallets.sort((w1, w2) => {
      return w1.getAddressString().localeCompare(w2.getAddressString())
    })
  }

  const h = ethUtils.toBuffer(votedata)

  return copyWallets
    .map(w => {
      const vrs = ethUtils.ecsign(h, ethUtils.toBuffer(w.privateKey))
      return ethUtils.toRpcSig(vrs.v, vrs.r, vrs.s)
    })
}

export function encodeSigsForCheckpoint(sigs = []) {
  return sigs.map(s => {
    const buffer = [...ethUtils.toBuffer(s)]
    return [
      new BN(buffer.slice(0, 32)),
      new BN(buffer.slice(32, 64)),
      new BN(buffer.slice(64, 96))
    ]
  })
}

 export function buildsubmitCheckpointPaylod(
  proposer,
  start,
  end,
  root,
  wallets,
  options = { rewardsRootHash: '', allValidators: false, getSigs: false, totalStake: 1, sigPrefix: '' } // false vars are to show expected vars
) {
  if (!root) root = ethUtils.keccak256(encode(start, end)) // dummy root
  if (!wallets) {
    wallets = getWallets()
  }

  let validators = options.allValidators
    ? wallets
    : [wallets[1], wallets[2], wallets[3]]

  let data = encode(
    ['address', 'uint256', 'uint256', 'bytes32', 'bytes32', 'uint256'],
    [proposer, start, end, root, options.rewardsRootHash, 15001]
  )
  const sigData = Buffer.concat([ethUtils.toBuffer(options.sigPrefix || '0x01'), ethUtils.toBuffer(data)])

  // in case of TestStakeManger use empty data
  const sigs = encodeSigsForCheckpoint(
    options.getSigs
      ? getSigs(validators, ethUtils.keccak256(sigData))
      : []
  )
  return { data, sigs }
}
 module.exports.buildsubmitCheckpointPaylod = buildsubmitCheckpointPaylod