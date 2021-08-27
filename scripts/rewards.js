const contracts = require('../contractAddresses.json')

const ethUtils = require('ethereumjs-util')

const getBlockHeader = require('../test/helpers/blocks').getBlockHeader
const MerkleTree = require('./utils/merkle-tree')

const utils = require('./utils/utils')

const StakeManager = artifacts.require('StakeManager')
const RootChain = artifacts.require('RootChain')
const ValidatorShare = artifacts.require('ValidatorShare')
const ethers = require('ethers')

const validatorAccount = process.argv[6]

const privKey = process.env.PRIV_KEY

async function getStakeManager() {
  return StakeManager.at(contracts.root.StakeManagerProxy)
}

let offset = 1
let lastEndBlock = 0

async function submitHeaderBlock() {
  const childWeb3 = new ethers.providers.JsonRpcProvider('http://localhost:8545')
  const wallet = new ethers.Wallet(privKey)
  const proposer = wallet
  const event = {
    block: await childWeb3.getBlock(
      'latest',
      true /* returnTransactionObjects */
    )
  }

  // rootChain expects the first checkpoint to start from block 0.
  // However, ganache would already be running and would be much ahead of block 0.
  // offset is used to treat the block of the first checkpoint to be 0
  if (offset == null) {
    offset = event.block.number
  }
  event.block.number -= offset // rootChain will thank you for this
  const start = lastEndBlock + 1
  const end = event.block.number
  lastEndBlock = end
  if (start > end) {
    throw new Error(`Invalid end block number for checkpoint`, { start, end })
  }

  const headers = []
  for (let i = start; i <= end; i++) {
    const block = await childWeb3.getBlock(i + offset)
    block.number = i
    headers.push(getBlockHeader(block))
  }

  const blockHeader = getBlockHeader(event.block)
  const tree = new MerkleTree(headers)
  const root = ethUtils.bufferToHex(tree.getRoot())
  // tree
  //   .verify(blockHeader, end - start, tree.getRoot(), blockProof)
  //   .should.equal(true)
  const { data, sigs } = utils.buildsubmitCheckpointPaylod(
    proposer.address,
    start,
    end,
    root,
    [proposer],
    { getSigs: true, allValidators: true }
  )

  const rootChain = await RootChain.at(contracts.root.RootChainProxy)
  const res = await rootChain.submitCheckpoint(
    data, sigs)
  return res
}

async function checkStake() {
  const stakeManager = await getStakeManager()
  const validatorID = await stakeManager.signerToValidator(validatorAccount)
  const validator = await stakeManager.validators(validatorID)
  console.log('val share', validator.contractAddress)
  const valShare = await ValidatorShare.at(validator.contractAddress)

  console.log('stakeManager.totalRewards:', web3.utils.fromWei(await stakeManager.totalRewards()))
  console.log('valShare.getRewardPerShare:', web3.utils.fromWei(await valShare.getRewardPerShare()))
  // console.log('valShare.rewards:', web3.utils.fromWei(await valShare.rewards()))

  // const accounts = await web3.eth.getAccounts()

  // const exchangeRate = await valShare.exchangeRate()
  // const shares = (await valShare.balanceOf(accounts[1]))
  // const prec = web3.utils.toBN(100)
  // console.log('share', shares.toString())
  // console.log('fx rate', exchangeRate.toString())
  // const tokensFromShares = exchangeRate.mul(shares).div(prec)
  // console.log(web3.utils.fromWei(tokensFromShares))
}

module.exports = async function(callback) {
  try {
    await submitHeaderBlock()
    await checkStake()
  } catch (e) {
    // truffle exec <script> doesn't throw errors, so handling it in a verbose manner here
    console.log(e)
  }
  callback()
}