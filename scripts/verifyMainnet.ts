import { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import { MASTER_ADDRESS_MAINNET, OWNER_ADDRESS_MAINNET, METADATA_URI } from '../config/mainnet';

export async function run(provider: NetworkProvider) {
    console.log("🔍 Verifying Mainnet Contract Status...\n");
    
    const contractAddress = Address.parse(MASTER_ADDRESS_MAINNET);
    const master = provider.open(KWTMaster.fromAddress(contractAddress));
    
    console.log("📍 Contract:", contractAddress.toString());
    console.log("🔗 Explorer: https://tonscan.org/address/" + contractAddress.toString({ urlSafe: true, bounceable: false }));
    console.log();
    
    try {
        const jettonData = await master.getGetJettonData();
        
        console.log("✅ Contract is deployed and accessible!\n");
        console.log("📊 Contract State:");
        console.log("   Total Supply:", jettonData.totalSupply.toString(), "nano");
        console.log("   Mintable:", jettonData.mintable ? "✅ Yes" : "❌ No");
        console.log("   Owner:", jettonData.owner.toString());
        console.log();
        
        // Check metadata
        if (jettonData.content) {
            try {
                const contentSlice = jettonData.content.beginParse();
                const flag = contentSlice.loadUint(8);
                
                if (flag === 0 && contentSlice.remainingRefs > 0) {
                    const uriRef = contentSlice.loadRef();
                    const uriSlice = uriRef.beginParse();
                    const uri = uriSlice.loadStringTail();
                    console.log("✅ Metadata configured!");
                    console.log("   URI:", uri);
                    if (uri === METADATA_URI) {
                        console.log("   ✅ URI matches config!");
                    }
                }
            } catch (e) {
                console.log("⚠️  Could not parse metadata");
            }
        } else {
            console.log("❌ No metadata - Configure may not be complete");
        }
        
        // Check debug state
        try {
            const debugState = await master.getGetDebugState();
            console.log("\n🔧 Configuration Status:");
            console.log("   Configured:", debugState.configured ? "✅ YES" : "❌ NO");
            console.log("   Mintable:", debugState.mintable ? "✅ Yes" : "❌ No");
            
            if (debugState.configured) {
                console.log("\n✅✅✅ CONTRACT IS FULLY CONFIGURED! ✅✅✅");
                console.log("   Ready for Initial Allocation (Mint)");
            } else {
                console.log("\n⚠️  Contract is NOT configured yet!");
                console.log("   Configure transaction may still be processing.");
                console.log("   Please wait 1-2 minutes and check again.");
            }
        } catch (e: any) {
            console.log("\n⚠️  Could not read debug state:", e.message);
        }
        
    } catch (error: any) {
        console.log("❌ Error:", error.message);
        if (error.message.includes("-13")) {
            console.log("\n💡 Exit code -13 means:");
            console.log("   - Contract is deployed ✅");
            console.log("   - But not configured yet ⚠️");
            console.log("   - Configure transaction may still be processing");
            console.log("   - Please wait a few minutes and try again");
        }
    }
}

