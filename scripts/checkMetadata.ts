import { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import { MASTER_ADDRESS_MAINNET, METADATA_URI } from '../config/mainnet';

export async function run(provider: NetworkProvider) {
    console.log("🔍 Checking Metadata Details...\n");
    console.log("=".repeat(60));

    if (!MASTER_ADDRESS_MAINNET) {
        console.error("❌ MASTER_ADDRESS_MAINNET is not set");
        return;
    }

    try {
        const contractAddress = Address.parse(MASTER_ADDRESS_MAINNET);
        const master = provider.open(KWTMaster.fromAddress(contractAddress));
        
        console.log("📍 Contract Address:", contractAddress.toString());
        console.log("🔗 Expected Metadata URI:", METADATA_URI);
        console.log();

        // Get jetton data
        const jettonData = await master.getGetJettonData();
        
        console.log("📋 Metadata Cell Analysis:");
        console.log("-".repeat(60));
        
        if (!jettonData.content) {
            console.log("❌ Content cell is empty!");
            return;
        }

        // Parse metadata cell according to TEP-64 format
        const contentSlice = jettonData.content.beginParse();
        const flag = contentSlice.loadUint(8);
        
        console.log("   Flag (8 bits):", flag);
        console.log("   Expected: 0 (off-chain)");
        
        if (flag !== 0) {
            console.log("   ❌ ERROR: Flag is not 0! Format is incorrect.");
            return;
        }
        
        console.log("   ✅ Flag is correct (off-chain format)");
        console.log();

        // Check if there's a ref for URI
        if (contentSlice.remainingRefs === 0) {
            console.log("❌ No reference found in metadata cell!");
            console.log("   URI should be stored in a reference cell");
            return;
        }

        console.log("   References found:", contentSlice.remainingRefs);
        
        // Load URI from ref
        const uriRef = contentSlice.loadRef();
        const uriSlice = uriRef.beginParse();
        
        // Read URI string
        const uri = uriSlice.loadStringTail();
        
        console.log("   ✅ URI extracted:", uri);
        console.log();
        
        console.log("📊 Comparison:");
        console.log("   Expected URI:", METADATA_URI);
        console.log("   Stored URI:  ", uri);
        
        if (uri === METADATA_URI) {
            console.log("   ✅ URIs match!");
        } else {
            console.log("   ❌ URIs do NOT match!");
        }
        
        console.log();
        console.log("=".repeat(60));
        console.log("💡 If URIs match but explorer doesn't show metadata:");
        console.log("   1. Check if metadata.json is accessible at:", uri);
        console.log("   2. Check CORS headers (should allow all origins: * or specific domains)");
        console.log("   3. Wait for explorer cache to update (can take up to 1 hour)");
        console.log("   4. Verify metadata.json format is valid JSON");
        console.log("=".repeat(60));

    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
        throw error;
    }
}

