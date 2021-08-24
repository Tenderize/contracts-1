const contracts = require('../contractAddresses.json')

const utils = require('./utils/utils')

const RootToken = artifacts.require('TestToken')
const StakeManager = artifacts.require('StakeManager')

async function getStakeManager() {
  return StakeManager.at(contracts.root.StakeManagerProxy)
}

async function stake() {
  console.log(process.argv)
  const validatorAccount = process.argv[6]
  // pubkey should not have the leading 04 prefix
  const pubkey = process.argv[7]
  const stakeAmount = web3.utils.toWei(process.argv[8] || '10000')
  const heimdallFee = web3.utils.toWei(process.argv[9] || '1')
  console.log(`Staking ${stakeAmount} for ${validatorAccount}...`)

  const stakeManager = await getStakeManager()
  const maticToken = await RootToken.at(contracts.root.tokens.MaticToken)
  console.log({ stakeManager: stakeManager.address, maticToken: maticToken.address, stakeToken: await stakeManager.token() })
  console.log('Sender accounts has a balanceOf', (await maticToken.balanceOf(validatorAccount)).toString())
  await maticToken.approve(stakeManager.address, web3.utils.toWei('1000000'), { from: validatorAccount })
  await delay(5)
  console.log('sent approve tx, staking now...')
  // Remember to change the 4th parameter to false if delegation is not required
  await stakeManager.stakeFor(validatorAccount, stakeAmount, heimdallFee, true, pubkey, { from: validatorAccount })
  return delay(5)
}

module.exports = async function(callback) {
  try {
    await stake()
  } catch (e) {
    // truffle exec <script> doesn't throw errors, so handling it in a verbose manner here
    console.log(e)
  }
  callback()
}

function delay(s) {
  return new Promise(resolve => setTimeout(resolve, s * 1000))
}