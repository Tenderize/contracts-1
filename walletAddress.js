const ethers = require("ethers")

console.log((new ethers.Wallet(process.env.PRIV_KEY)).address)
