/**
 * Helper functions for KWT contract interactions
 */

import { NetworkProvider } from '@ton/blueprint';
import { Address, OpenedContract } from '@ton/core';
import { KWTMaster } from '../../build/KWTMaster/KWTMaster_KWTMaster';
import { MASTER_ADDRESS_TESTNET } from '../../config/testnet';
import { MASTER_ADDRESS_MAINNET } from '../../config/mainnet';

/**
 * Open the KWTMaster contract instance
 * Automatically detects network from provider and uses appropriate config
 */
export function openMaster(provider: NetworkProvider, masterAddress?: string): OpenedContract<KWTMaster> {
    let address: string;
    
    if (masterAddress) {
        address = masterAddress;
    } else {
        // Try to detect network from provider or use testnet by default
        // For mainnet scripts, pass the address explicitly
        address = MASTER_ADDRESS_MAINNET || MASTER_ADDRESS_TESTNET;
    }
    
    if (!address) {
        throw new Error("Master address is not set. Please set MASTER_ADDRESS_MAINNET or MASTER_ADDRESS_TESTNET in config files.");
    }
    
    const masterAddressParsed = Address.parse(address);
    return provider.open(KWTMaster.fromAddress(masterAddressParsed));
}

/**
 * Get jetton data from the master contract
 */
export async function getJettonData(master: OpenedContract<KWTMaster>) {
    return await master.getGetJettonData();
}

/**
 * Get jetton wallet address for a given owner address
 */
export async function getWalletAddress(master: OpenedContract<KWTMaster>, ownerAddress: Address): Promise<Address> {
    return await master.getGetWalletAddress(ownerAddress);
}

/**
 * Format nano amount to human-readable KWT (9 decimals)
 */
export function formatKWT(nano: bigint): string {
    const kwt = Number(nano) / 1e9;
    return kwt.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 9 
    });
}

/**
 * Read all contract state (all getters)
 */
export async function readAllState(master: OpenedContract<KWTMaster>) {
    const jettonData = await master.getGetJettonData();
    const debugState = await master.getGetDebugState();
    const supplyInfo = await master.getGetSupplyInfo();
    const burnStats = await master.getGetBurnStats();
    const dailyVolume = await master.getGetDailyVolume();
    
    return { jettonData, debugState, supplyInfo, burnStats, dailyVolume };
}

