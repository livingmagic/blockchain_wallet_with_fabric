#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# Exit on first error, print all commands.
set -ev

CHANNEL_NAME=walletchannel

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=10
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

# scripts/init.sh
docker exec cli scripts/init.sh $CHANNEL_NAME