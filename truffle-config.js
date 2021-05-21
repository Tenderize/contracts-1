require('babel-register')
require('babel-polyfill')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised).should()

var HDWalletProvider = require('truffle-hdwallet-provider')
var PrivateKeyProvider = require("truffle-privatekey-provider");

const PRIV_KEY = process.env.PRIV_KEY
const MNEMONIC =
  process.env.MNEMONIC ||
  'clock radar mass judge dismiss just intact mind resemble fringe diary casino'
const API_KEY = process.env.API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: 'localhost',
      port: 9545,
      network_id: '*', // match any network
      skipDryRun: true,
      gas: 7000000
    },
    bor: {
      provider: () =>
        new PrivateKeyProvider(
          PRIV_KEY,
          `http://localhost:8545`
        ),
      network_id: '*', // match any network
      gasPrice: '0'
    },
    ropsten: {
      provider: () =>
        new PrivateKeyProvider(
          PRIV_KEY,
          `https://ropsten.infura.io/v3/${API_KEY}`
        ),
      network_id: 3,
      gas: 7000000,
      gasPrice: 10000000000, // 10 gwei
      skipDryRun: true
      // confirmations: 5
    },
    goerli: {
      provider: function() {
        return new PrivateKeyProvider(
          PRIV_KEY,
          `https://goerli.infura.io/v3/${API_KEY}`
        )
      },
      network_id: 5,
      gas: 8000000
    },
    kovan: {
      provider: function() {
        return new PrivateKeyProvider(
          PRIV_KEY,
          `https://kovan.infura.io/v3/${API_KEY}`
        )
      },
      network_id: 42,
      gas: 8000000
    },
    mainnet: {
      provider: function() {
        return new PrivateKeyProvider(
          PRIV_KEY,
          `https://mainnet.infura.io/v3/${API_KEY}`
        )
      },
      network_id: 1,
      gas: 4000000
    },
    rinkeby: {
      provider: function() {
        return new PrivateKeyProvider(
          PRIV_KEY,
          `https://rinkeby.infura.io/v3/${API_KEY}`
        )
      },
      network_id: 4,
      gas: 8000000
    }
  },
  compilers: {
    solc: {
      version: '0.5.11',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: 'constantinople'
      }
    }
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 21,
      outputFile: '/dev/null',
      showTimeSpent: true
    }
  },
  plugins: ['solidity-coverage', 'truffle-plugin-verify'],
  verify: {
    preamble: 'Matic network contracts'
  },
  api_keys: {
    etherscan: ETHERSCAN_API_KEY
  }
}
