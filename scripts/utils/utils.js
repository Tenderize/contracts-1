const encode = require('ethereumjs-abi').rawEncode
const ethUtils = require('ethereumjs-util')
const Buffer = require('safe-buffer').Buffer
const fs = require('fs')
const path = require('path')

function encodeSigs(sigs = []) {
   return Buffer.concat(sigs.map(s => ethUtils.toBuffer(s)))
 }

 function getSigs(wallets, votedata) {
   // avoid any potential side effects
   const copyWallets = [...wallets]
   copyWallets.sort((w1, w2) => {
     return w1.getAddressString().localeCompare(w2.getAddressString())
   })
   const h = ethUtils.toBuffer(votedata)
 
   return copyWallets
     .map(w => {
       const vrs = ethUtils.ecsign(h, ethUtils.toBuffer(w.privateKey))
       return ethUtils.toRpcSig(vrs.v, vrs.r, vrs.s)
     })
     .filter(d => d)
 }

function buildSubmitHeaderBlockPaylod(
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
 
   console.log("Proposer:", proposer)
   console.log("Bor Start Block:", start)
   console.log("Bor End Block:",end)
   console.log("Root hash:", root)
   
   let data = encode(
     ['address', 'uint256', 'uint256', 'bytes32', 'bytes32', 'uint256'],
     [proposer, start, end, root, options.rewardsRootHash, 15001]
   )
   const sigData = Buffer.concat([ethUtils.toBuffer(options.sigPrefix || '0x01'), ethUtils.toBuffer(data)])
 
   // in case of TestStakeManger use dummysig data
   const sigs = ethUtils.bufferToHex(
     options.getSigs
       ? encodeSigs(getSigs(validators, ethUtils.keccak256(sigData)))
       : 'dummySig'
   )
   return { data, sigs }
 }
 module.exports.buildSubmitHeaderBlockPaylod = buildSubmitHeaderBlockPaylod