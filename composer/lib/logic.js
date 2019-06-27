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
 * Write your transction processor functions here
 */

/**
 * RMB toping up transaction
 * @param {org.bana.wallet.TopUp} topUp
 * @transaction
 */
async function topUp(topUp) {
    if (topUp.value > 0) {
        // Get the asset registry for the asset.
        const assetRegistry = await getAssetRegistry('org.bana.wallet.Balance');
        let balance = await assetRegistry.get(topUp.balanceId);
        // Set new value
        balance.value = balance.value + topUp.value;

        // Update the asset in the asset registry.
        await assetRegistry.update(balance);

        // Emit an event for the modified asset.
        let event = getFactory().newEvent('org.bana.wallet', 'TopUpSuccessEvent');
        event.balanceId = topUp.balanceId;
        emit(event);
    }
    else {
        throw new Error('value negative or zero error');
    }
}

/**
 * RMB paying out transaction
 * @param {org.bana.wallet.PayOut} payOut
 * @transaction
 */
async function payOut(payOut) {
    // Get current participant
    let currentParticipant = getCurrentParticipant();
    const results = await query(
        'selectBalanceByAccount', { account: 'resource:' +  currentParticipant.getFullyQualifiedIdentifier()});

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('org.bana.wallet.Balance');
    let balanceSrc = results[0];
    let balanceDest = await assetRegistry.get(payOut.balanceDestId);

    if (payOut.value > 0 && payOut.value < balanceSrc.value) {
        balanceSrc.value = balanceSrc.value - payOut.value;
        balanceDest.value = balanceDest.value + payOut.value;
        await assetRegistry.update(balanceSrc);
        await assetRegistry.update(balanceDest);

        // Emit an event for the modified asset.
        let event = getFactory().newEvent('org.bana.wallet', 'PayOutSuccessEvent');
        event.balanceSrcId = balanceSrc.balanceId;
        event.balanceDestId = balanceDest.balanceId;
        emit(event);
    }
    else {
        throw new Error('value negative or zero or no enough money error');
    }
}
