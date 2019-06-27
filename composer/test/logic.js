/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write the unit tests for your transction processor functions here
 */

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const namespace = 'org.bana.wallet';
const assetType = 'Balance';
const assetNS = namespace + '.' + assetType;
const participantType = 'UserAccount';
const participantNS = namespace + '.' + participantType;

describe('#' + namespace, () => {
    // In-memory card store for testing so cards are not persisted to the file system
    const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore({ type: 'composer-wallet-inmemory' });

    // Embedded connection used for local testing
    const connectionProfile = {
        name: 'embedded',
        'x-type': 'embedded'
    };

    // Name of the business network card containing the administrative identity for the business network
    const adminCardName = 'admin';

    // Admin connection to the blockchain, used to deploy the business network
    let adminConnection;

    // This is the business network connection the tests will use.
    let businessNetworkConnection;

    // This is the factory for creating instances of types.
    let factory;

    // These are the identities for Alice and Bob.
    const aliceCardName = 'alice';
    const bobCardName = 'bob';
    const triumenCardName = 'triumen';

    // These are a list of receieved events.
    let events;
    let businessNetworkName;

    before(async () => {
        // Generate certificates for use with the embedded connection
        const credentials = CertificateUtil.generate({ commonName: 'admin' });

        // Identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: ['PeerAdmin', 'ChannelAdmin']
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);
        const deployerCardName = 'PeerAdmin';

        adminConnection = new AdminConnection({ cardStore: cardStore });

        await adminConnection.importCard(deployerCardName, deployerCard);
        await adminConnection.connect(deployerCardName);
    });

    /**
     *
     * @param {String} cardName The card name to use for this identity
     * @param {Object} identity The identity details
     */
    async function importCardForIdentity(cardName, identity) {
        const metadata = {
            userName: identity.userID,
            version: 1,
            enrollmentSecret: identity.userSecret,
            businessNetwork: businessNetworkName
        };
        const card = new IdCard(metadata, connectionProfile);
        await adminConnection.importCard(cardName, card);
    }

    // This is called before each test is executed.
    beforeEach(async () => {
        // Generate a business network definition from the project directory.
        let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        businessNetworkName = businessNetworkDefinition.getName();
        await adminConnection.install(businessNetworkDefinition);
        const startOptions = {
            networkAdmins: [
                {
                    userName: 'admin',
                    enrollmentSecret: 'adminpw'
                }
            ]
        };
        const adminCards = await adminConnection.start(businessNetworkName, businessNetworkDefinition.getVersion(), startOptions);
        await adminConnection.importCard(adminCardName, adminCards.get('admin'));

        // Create and establish a business network connection
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        events = [];
        businessNetworkConnection.on('event', event => {
            events.push(event);
        });
        await businessNetworkConnection.connect(adminCardName);

        // Get the factory for the business network.
        factory = businessNetworkConnection.getBusinessNetwork().getFactory();

        // Create the participants.
        const alice = factory.newResource(namespace, participantType, 'balance@alice');
        alice.name = 'Alice';
        alice.cardID = 'cardID1';

        const bob = factory.newResource(namespace, participantType, 'balance@bob');
        bob.name = 'Bob';
        bob.cardID = 'cardID2';
        // Add all participants
        const participantRegistry = await businessNetworkConnection.getParticipantRegistry(participantNS);
        await participantRegistry.addAll([alice, bob]);

        // Create the back account.
        const triumen = factory.newResource(namespace, 'PayCompanyAccount', 'account@triumen');
        triumen.name = 'Triumen'
        triumen.companyCode = 'companyCode1'
        const payCompanyAccountRegistry = await businessNetworkConnection.getParticipantRegistry(namespace + '.PayCompanyAccount');
        await payCompanyAccountRegistry.add(triumen);

        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        // Create the assets.
        const balanceAlice = factory.newResource(namespace, assetType, 'balance@alice');
        balanceAlice.account = factory.newRelationship(namespace, participantType, alice.$identifier);
        balanceAlice.value = 10;

        const balanceBob = factory.newResource(namespace, assetType, 'balance@bob');
        balanceBob.account = factory.newRelationship(namespace, participantType, bob.$identifier);
        balanceBob.value = 20;
        // Add all balances
        await assetRegistry.addAll([balanceAlice, balanceBob]);

        // Issue the identities.
        let identity = await businessNetworkConnection.issueIdentity(participantNS + '#' + alice.$identifier, 'alice1');
        await importCardForIdentity(aliceCardName, identity);
        identity = await businessNetworkConnection.issueIdentity(participantNS + '#' + bob.$identifier, 'bob1');
        await importCardForIdentity(bobCardName, identity);
        identity = await businessNetworkConnection.issueIdentity(namespace + '.PayCompanyAccount#' + triumen.$identifier, 'triumen1');
        await importCardForIdentity(triumenCardName, identity);
    });

    /**
     * Reconnect using a different identity.
     * @param {String} cardName The name of the card for the identity to use
     */
    async function useIdentity(cardName) {
        await businessNetworkConnection.disconnect();
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        events = [];
        businessNetworkConnection.on('event', (event) => {
            events.push(event);
        });
        await businessNetworkConnection.connect(cardName);
        factory = businessNetworkConnection.getBusinessNetwork().getFactory();
    }

    it('Alice can read his balance', async () => {
        // Use the identity for Alice.
        await useIdentity(aliceCardName);
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        const asset = await assetRegistry.get('balance@alice');
        // Validate the assets.
        asset.account.getFullyQualifiedIdentifier().should.equal(participantNS + '#balance@alice');
        asset.value.should.equal(10);
    });

    it('Alice cannot read Bob balance', async () => {
        await useIdentity(bobCardName);
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.get('balance@alice').should.be.rejectedWith(/does not have .* access to resource/);
    });

    it('Triumen can submit toping up transaction', async () => {
        await useIdentity(triumenCardName);
        const transaction = factory.newTransaction(namespace, 'TopUp');
        transaction.balanceId = 'balance@alice';
        transaction.value = 5;

        await businessNetworkConnection.submitTransaction(transaction);

        await useIdentity(aliceCardName);
        const results = await businessNetworkConnection.query(
            'selectBalanceByAccount', { account: 'resource:' + participantNS + '#balance@alice' })
        results[0].value.should.equal(15);
    });

    it('Alice cannot submit toping up transaction', async () => {
        await useIdentity(aliceCardName);
        const transaction = factory.newTransaction(namespace, 'TopUp');
        transaction.balanceId = 'balance@alice';
        transaction.value = 5;

        businessNetworkConnection.submitTransaction(transaction).should.be.rejectedWith(/does not have .* access to resource/)
    });

    it('All can submit paying out transaction', async () => {
        await useIdentity(aliceCardName);
        const transaction = factory.newTransaction(namespace, 'PayOut');
        transaction.balanceDestId = 'balance@bob';
        transaction.value = 5;

        await businessNetworkConnection.submitTransaction(transaction);

        const results1 = await businessNetworkConnection.query(
            'selectBalanceByAccount', { account: 'resource:' + participantNS + '#balance@alice' })
        results1[0].value.should.equal(5);
        await useIdentity(bobCardName);
        const results2 = await businessNetworkConnection.query(
            'selectBalanceByAccount', { account: 'resource:' + participantNS + '#balance@bob' })
        results2[0].value.should.equal(25);
    });
});
