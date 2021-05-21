const util = require('ethereumjs-util')

util.privateToPublic(process.env.PRIV_KEY).toString('hex')
