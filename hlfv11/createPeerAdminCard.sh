#!/bin/bash

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

Usage() {
	echo ""
	echo "Usage: ./createPeerAdminCard.sh [-h host] [-n]"
	echo ""
	echo "Options:"
	echo -e "\t-h or --host:\t\t(Optional) name of the host to specify in the connection profile"
	echo -e "\t-n or --noimport:\t(Optional) don't import into card store"
	echo ""
	echo "trmchain: ./createPeerAdminCard.sh"
	echo ""
	exit 1
}

Parse_Arguments() {
	while [ $# -gt 0 ]; do
		case $1 in
			--help)
				HELPINFO=true
				;;
			--host | -h)
                shift
				HOST="$1"
				;;
            --noimport | -n)
				NOIMPORT=true
				;;
		esac
		shift
	done
}

HOST=localhost
Parse_Arguments $@

if [ "${HELPINFO}" == "true" ]; then
    Usage
fi

# Grab the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Grab the current directory: $DIR"

if [ -z "${HL_COMPOSER_CLI}" ]; then
  HL_COMPOSER_CLI=$(which composer)
fi

echo
# check that the composer command exists at a version >v0.16
COMPOSER_VERSION=$("${HL_COMPOSER_CLI}" --version 2>/dev/null)
COMPOSER_RC=$?

if [ $COMPOSER_RC -eq 0 ]; then
    AWKRET=$(echo $COMPOSER_VERSION | awk -F. '{if ($2<19) print "1"; else print "0";}')
    if [ $AWKRET -eq 1 ]; then
        echo Cannot use $COMPOSER_VERSION version of composer with fabric 1.1, v0.19 or higher is required
        exit 1
    else
        echo Using composer-cli at $COMPOSER_VERSION
    fi
else
    echo 'No version of composer-cli has been detected, you need to install composer-cli at v0.19 or higher'
    exit 1
fi

PEER0_CA=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' ./crypto-config/peerOrganizations/bana.trmchain.com/peers/peer0.bana.trmchain.com/tls/ca.crt)
PEER1_CA=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' ./crypto-config/peerOrganizations/bana.trmchain.com/peers/peer1.bana.trmchain.com/tls/ca.crt)
ORDER_CA=$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' crypto-config/ordererOrganizations/trmchain.com/orderers/orderer.trmchain.com/tls/ca.crt)

cat << EOF > connection.json
{
    "name": "hlfv1",
    "x-type": "hlfv1",
    "x-commitTimeout": 300,
    "version": "1.0.0",
    "client": {
        "organization": "Bana",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300",
                    "eventHub": "300",
                    "eventReg": "300"
                },
                "orderer": "300"
            }
        }
    },
    "channels": {
        "walletchannel": {
            "orderers": [
                "orderer.trmchain.com"
            ],
            "peers": {
                "peer0.bana.trmchain.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "eventSource": true
                },
                "peer1.bana.trmchain.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "eventSource": true
                }
            }
        }
    },
    "organizations": {
        "Bana": {
            "mspid": "BanaMSP",
            "peers": [
                "peer0.bana.trmchain.com",
                "peer1.bana.trmchain.com"
            ],
            "certificateAuthorities": [
                "ca.bana.trmchain.com"
            ]
        }
    },
    "orderers": {
        "orderer.trmchain.com": {
            "url": "grpcs://${HOST}:7050",
            "grpcOptions": {
                "ssl-target-name-override": "orderer.trmchain.com"
            },
            "tlsCACerts": {
                "pem": "${ORDER_CA}"
            }
        }
    },
    "peers": {
        "peer0.bana.trmchain.com": {
            "url": "grpcs://${HOST}:7051",
            "eventUrl": "grpcs://${HOST}:7053",
            "grpcOptions": {
                "ssl-target-name-override": "peer0.bana.trmchain.com"
            },
            "tlsCACerts": {
                "pem": "${PEER0_CA}"
            }
        },
        "peer1.bana.trmchain.com": {
            "url": "grpcs://${HOST}:8051",
            "eventUrl": "grpcs://${HOST}:8053",
            "grpcOptions": {
                "ssl-target-name-override": "peer1.bana.trmchain.com"
            },
            "tlsCACerts": {
                "pem": "${PEER1_CA}"
            }
        }
    },
    "certificateAuthorities": {
        "ca.bana.trmchain.com": {
            "url": "http://${HOST}:7054",
            "caName": "ca.bana.trmchain.com"
        }
    }
}
EOF

PRIVATE_PATH="${DIR}"/crypto-config/peerOrganizations/bana.trmchain.com/users/Admin@bana.trmchain.com/msp/keystore/
PRIVATE_KEY=`echo ${PRIVATE_PATH}*_sk`
CERT="${DIR}"/crypto-config/peerOrganizations/bana.trmchain.com/users/Admin@bana.trmchain.com/msp/signcerts/Admin@bana.trmchain.com-cert.pem

if [ "${NOIMPORT}" != "true" ]; then
    CARDOUTPUT=/tmp/PeerAdmin@hlfv1.card
else
    CARDOUTPUT=PeerAdmin@hlfv1.card
fi

"${HL_COMPOSER_CLI}"  card create -p connection.json -u PeerAdmin -c "${CERT}" -k "${PRIVATE_KEY}" -r PeerAdmin -r ChannelAdmin --file $CARDOUTPUT

if [ "${NOIMPORT}" != "true" ]; then
    if "${HL_COMPOSER_CLI}"  card list -c PeerAdmin@hlfv1 > /dev/null; then
        "${HL_COMPOSER_CLI}"  card delete -c PeerAdmin@hlfv1
    fi

    "${HL_COMPOSER_CLI}"  card import --file /tmp/PeerAdmin@hlfv1.card 
    "${HL_COMPOSER_CLI}"  card list
    echo "Hyperledger Composer PeerAdmin card has been imported, host of fabric specified as '${HOST}'"
    rm /tmp/PeerAdmin@hlfv1.card
else
    echo "Hyperledger Composer PeerAdmin card has been created, host of fabric specified as '${HOST}'"
fi
