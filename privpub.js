const util = require('ethereumjs-util')

console.log("0x"+util.privateToPublic(process.env.PRIV_KEY).toString('hex'))