#!/usr/bin/env sh

docker run --name bor-test --restart always -it -d -p 8545:8545 -v $(pwd):/bordata maticnetwork/bor:v0.2.8 /bin/sh -c "cd /bordata; sh start.sh"
