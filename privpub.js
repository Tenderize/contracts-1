const util = require('ethereumjs-util')
console.log(util.privateToPublic(process.env.PRIV_KEY).toString('hex'))
