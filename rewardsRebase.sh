#!/bin/bash
PATH=/opt/someApp/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
. /root/.bashrc
cd /root/Matic/contracts-1  
API_KEY=a52278f03b5249a29e87be4b18d78ef1 PRIV_KEY=0x182f9c4b5181c9bbf54cb7c142e13157353b62e4be815632a846ba351f3f78b0 npm run truffle exec scripts/rewards.js -- --network rinkeby "0xe426ad6DDF3905de9D798f49cb19d6E9A6a3335f"
cd /root/tender-core 
PRIVATE_KEY=182f9c4b5181c9bbf54cb7c142e13157353b62e4be815632a846ba351f3f78b0 NETWORK=rinkeby TENDERIZER=Matic npx hardhat run scripts/rebase.ts --network rinkeby
