import { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import { MASTER_ADDRESS_MAINNET, OWNER_ADDRESS_MAINNET, METADATA_URI } from '../config/mainnet';

export async function run(provider: NetworkProvider) {
    console.log("🔍 Checking KWTMaster Contract Status (MAINNET)...\n");
    console.log("=".repeat(60));

    if (!MASTER_ADDRESS_MAINNET) {
        console.error("❌ MASTER_ADDRESS_MAINNET is not set in config/mainnet.ts");
        return;
    }

    try {
        const contractAddress = Address.parse(MASTER_ADDRESS_MAINNET);
        console.log("📍 Contract Address:", contractAddress.toString());
        console.log("🔗 Explorer:", `https://tonscan.org/address/${contractAddress.toString({ urlSafe: true, bounceable: false })}`);
        console.log();

        const master = provider.open(KWTMaster.fromAddress(contractAddress));
        const isDeployed = await provider.isContractDeployed(contractAddress);
        
        if (!isDeployed) {
            console.log("❌ Contract is NOT deployed yet!");
            return;
        }

        console.log("✅ Contract is deployed!\n");

        try {
            const jettonData = await master.getGetJettonData();
            
            console.log("📊 Contract Data:");
            console.log("   Total Supply:", jettonData.totalSupply.toString(), "nano");
            console.log("   Mintable:", jettonData.mintable ? "✅ Yes" : "❌ No");
            console.log("   Owner:", jettonData.owner.toString());
            
            if (OWNER_ADDRESS_MAINNET) {
                const expectedOwner = Address.parse(OWNER_ADDRESS_MAINNET);
                if (jettonData.owner.equals(expectedOwner)) {
                    console.log("   ✅ Owner matches config!");
                } else {
                    console.log("   ⚠️  Owner mismatch!");
                }
            }

            console.log("\n📋 Metadata:");
            if (jettonData.content) {
                try {
                    const contentSlice = jettonData.content.beginParse();
                    const flag = contentSlice.loadUint(8);
                    
                    if (flag === 0 && contentSlice.remainingRefs > 0) {
                        const uriRef = contentSlice.loadRef();
                        const uriSlice = uriRef.beginParse();
                        const uri = uriSlice.loadStringTail();
                        console.log("   ✅ Metadata Type: Off-chain (URI)");
                        console.log("   ✅ Metadata URI:", uri);
                        
                        if (uri === METADATA_URI) {
                            console.log("   ✅ URI matches config!");
                            console.log("\n✅ CONFIGURE SUCCESSFUL!");
                        } else {
                            console.log("   ⚠️  URI mismatch!");
                        }
                    } else {
                        console.log("   ⚠️  Metadata format is not standard");
                    }
                } catch (error: any) {
                    console.log("   ⚠️  Could not parse metadata:", error.message);
                }
            } else {
                console.log("   ❌ No metadata set!");
                console.log("   ⚠️  Configure may not have been processed yet.");
            }

            // Check if configured
            try {
                const debugState = await master.getGetDebugState();
                console.log("\n🔧 Debug State:");
                console.log("   Configured:", debugState.configured ? "✅ Yes" : "❌ No");
                console.log("   Mintable:", debugState.mintable ? "✅ Yes" : "❌ No");
                
                if (debugState.configured) {
                    console.log("\n✅ CONTRACT IS FULLY CONFIGURED!");
                    console.log("   Ready for Initial Allocation (Mint)");
                } else {
                    console.log("\n⚠️  Contract is NOT configured yet!");
                    console.log("   Configure transaction may still be processing.");
                }
            } catch (error: any) {
                console.log("\n⚠️  Could not read debug state:", error.message);
            }

        } catch (error: any) {
            console.error("\n❌ Error reading contract data:", error.message);
            if (error.message.includes("-13")) {
                console.error("   Exit code -13: Contract is deployed but not configured yet.");
                console.error("   This is normal if Configure was just sent.");
                console.error("   Please wait a few minutes and try again.");
            }
        }

        console.log("\n" + "=".repeat(60));

    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
        throw error;
    }
}

