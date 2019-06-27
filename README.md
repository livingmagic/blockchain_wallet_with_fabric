# wallet_chain

区块链虚拟货币钱包

Channel named "walletchannel" base on [hyperledger fabric](https://github.com/hyperledger/fabric), [hyperledger composer](https://github.com/hyperledger/composer) and [blockchain-explorer](https://github.com/hyperledger/blockchain-explorer).



## Usage

Start composer rest server for providing restful apis.

```bash
composer-rest-server
```

Generate the Angular application:

```bash
yo hyperledger-composer
```

Follow the below so your output matches.

```bash
Welcome to the Hyperledger Composer project generator
? Please select the type of project: Angular
You can run this generator using: 'yo hyperledger-composer:angular'
Welcome to the Hyperledger Composer Angular project generator
? Do you want to connect to a running Business Network? Yes
? Project name: [insert]
? Description: Hyperledger Composer Angular project
? Author name: [insert]
? Author email: [insert]
? License: Apache-2.0
? Name of the Business Network card: admin@tutorial-network
? Do you want to generate a new REST API or connect to an existing REST API?  Connect to an existing REST
 API
? REST server address: http://localhost
? REST server port: 3000
? Should namespaces be used in the generated REST API? Namespaces are not used
Created application!
```