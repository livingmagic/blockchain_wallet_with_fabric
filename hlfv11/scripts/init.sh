#!/bin/bash
#
#

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo

CHANNEL_NAME="$1"

# Create the channel
peer channel create -o orderer.trmchain.com:7050 -c $CHANNEL_NAME -f ./configtx/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/trmchain.com/orderers/orderer.trmchain.com/msp/tlscacerts/tlsca.trmchain.com-cert.pem
# # Join peer0.bana.trmchain.com to the channel.
peer channel join -b ${CHANNEL_NAME}.block
# # Join peer1.bana.trmchain.com to the channel.
CORE_PEER_ADDRESS=peer1.bana.trmchain.com:7051  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/bana.trmchain.com/peers/peer1.bana.trmchain.com/tls/ca.crt peer channel join -b $CHANNEL_NAME.block

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0