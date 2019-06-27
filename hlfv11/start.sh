#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error, print all commands.
set -ev

#Detect architecture
export ARCH=`uname -m`
echo ${ARCH}

export CA_PATH=./crypto-config/peerOrganizations/bana.trmchain.com/ca/
export CA_SK=$(basename `echo ${CA_PATH}*_sk`)
echo $CA_SK

docker-compose -f docker-compose.yml up -d
