# wallet-network

This is a wallet for the people of the world.

```bash
composer archive create -t dir -n .
composer network install -c PeerAdmin@hlfv1 -a wallet-network@0.0.1.bna
composer network start --networkName wallet-network --networkVersion 0.0.1 -A admin -S adminpw -c PeerAdmin@hlfv1
composer card import -f admin@wallet-network.card
composer network ping -c admin@wallet-network
```
