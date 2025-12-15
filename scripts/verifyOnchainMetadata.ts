import { NetworkProvider } from '@ton/blueprint';
import { Address, Dictionary, beginCell, Cell } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import { MASTER_ADDRESS_MAINNET } from '../config/mainnet';
import * as crypto from 'crypto';

export async function run(provider: NetworkProvider) {
    console.log("🔍 Verifying On-Chain Metadata Details...\n");
    console.log("=".repeat(60));

    if (!MASTER_ADDRESS_MAINNET) {
        console.error("❌ MASTER_ADDRESS_MAINNET is not set");
        return;
    }

    try {
        const contractAddress = Address.parse(MASTER_ADDRESS_MAINNET);
        const master = provider.open(KWTMaster.fromAddress(contractAddress));
        
        console.log("📍 Contract Address:", contractAddress.toString());
        console.log();

        // Get jetton data
        const jettonData = await master.getGetJettonData();
        
        console.log("📋 Metadata Cell Analysis:");
        console.log("-".repeat(60));
        
        if (!jettonData.content) {
            console.log("❌ Content cell is empty!");
            return;
        }

        // Parse metadata cell
        const contentSlice = jettonData.content.beginParse();
        const flag = contentSlice.loadUint(8);
        
        console.log("   Flag (8 bits):", flag);
        
        if (flag === 0) {
            console.log("   ⚠️  Format: Off-chain (flag=0)");
            if (contentSlice.remainingRefs > 0) {
                const uriRef = contentSlice.loadRef();
                const uriSlice = uriRef.beginParse();
                const uri = uriSlice.loadStringTail();
                console.log("   URI:", uri);
            }
        } else if (flag === 1) {
            console.log("   ✅ Format: On-chain (flag=1)");
            
            // Parse dictionary - it should be in a ref
            if (contentSlice.remainingRefs > 0) {
                // Dictionary is stored in a reference cell
                const dictRef = contentSlice.loadRef();
                const dict = dictRef.beginParse().loadDict<bigint, Cell>(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
                console.log("   ✅ Dictionary loaded");
                console.log("   📊 Dictionary size:", dict.size);
                console.log();
                
                // Helper to hash string
                function hashString(str: string): bigint {
                    const hash = crypto.createHash('sha256').update(str).digest();
                    return BigInt('0x' + hash.toString('hex'));
                }
                
                // Try to read each metadata field
                const fields = ['name', 'symbol', 'description', 'image', 'decimals'];
                
                console.log("📊 Metadata Fields:");
                console.log("-".repeat(60));
                
                for (const field of fields) {
                    const key = hashString(field);
                    const valueCell = dict.get(key);
                    
                    if (valueCell) {
                        try {
                            const valueSlice = valueCell.beginParse();
                            const value = valueSlice.loadStringTail();
                            console.log(`   ✅ ${field}: "${value}"`);
                        } catch (e) {
                            console.log(`   ⚠️  ${field}: Could not parse value`);
                        }
                    } else {
                        console.log(`   ❌ ${field}: NOT FOUND in dictionary`);
                    }
                }
                
                console.log();
                console.log("🔍 Dictionary Keys (hashes):");
                console.log("-".repeat(60));
                for (const [key, value] of dict) {
                    const keyHex = key.toString(16).padStart(64, '0');
                    console.log(`   Key: 0x${keyHex.substring(0, 16)}...`);
                    try {
                        const valueSlice = value.beginParse();
                        const valueStr = valueSlice.loadStringTail();
                        console.log(`   Value: "${valueStr}"`);
                    } catch (e) {
                        console.log(`   Value: (could not parse)`);
                    }
                    console.log();
                }
            } else {
                console.log("   ❌ No dictionary reference found!");
            }
        } else {
            console.log("   ❌ Unknown flag:", flag);
        }

    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
        throw error;
    }
    
    console.log("=".repeat(60));
}

