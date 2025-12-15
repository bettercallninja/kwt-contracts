import { NetworkProvider } from '@ton/blueprint';
import { Address } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import { MASTER_ADDRESS_TESTNET, OWNER_ADDRESS_TESTNET, METADATA_URI } from '../config/testnet';

export async function run(provider: NetworkProvider) {
    console.log("🔍 Checking KWTMaster Contract Status...\n");
    console.log("=".repeat(60));

    // Check if contract address is set
    if (!MASTER_ADDRESS_TESTNET) {
        console.error("❌ MASTER_ADDRESS_TESTNET is not set in config/testnet.ts");
        console.error("   Please set the contract address first.");
        return;
    }

    try {
        const contractAddress = Address.parse(MASTER_ADDRESS_TESTNET);
        console.log("📍 Contract Address:", contractAddress.toString());
        console.log("🔗 Explorer:", `https://testnet.tonscan.org/address/${contractAddress.toString({ urlSafe: true, bounceable: false })}`);
        console.log();

        // Check if contract is deployed
        const master = provider.open(KWTMaster.fromAddress(contractAddress));
        const isDeployed = await provider.isContractDeployed(contractAddress);
        
        if (!isDeployed) {
            console.log("❌ Contract is NOT deployed yet!");
            console.log("   Please wait for deployment to complete or check the address.");
            return;
        }

        console.log("✅ Contract is deployed!\n");

        // Get contract data
        try {
            const jettonData = await master.getGetJettonData();
            
            console.log("📊 Contract Data:");
            console.log("   Total Supply:", jettonData.totalSupply.toString(), "nano");
            console.log("   Mintable:", jettonData.mintable ? "✅ Yes" : "❌ No");
            console.log("   Owner:", jettonData.owner.toString());
            
            // Verify owner
            if (OWNER_ADDRESS_TESTNET) {
                const expectedOwner = Address.parse(OWNER_ADDRESS_TESTNET);
                if (jettonData.owner.equals(expectedOwner)) {
                    console.log("   ✅ Owner matches config!");
                } else {
                    console.log("   ⚠️  Owner mismatch!");
                    console.log("      Expected:", expectedOwner.toString());
                    console.log("      Got:", jettonData.owner.toString());
                }
            }

            // Check metadata
            console.log("\n📋 Metadata:");
            if (jettonData.content) {
                try {
                    const contentSlice = jettonData.content.beginParse();
                    const flag = contentSlice.loadUint(8);
                    
                    if (flag === 0 && contentSlice.remainingRefs > 0) {
                        // Off-chain metadata
                        const uriRef = contentSlice.loadRef();
                        const uriSlice = uriRef.beginParse();
                        const uri = uriSlice.loadStringTail();
                        console.log("   ✅ Metadata Type: Off-chain (URI)");
                        console.log("   ✅ Metadata URI:", uri);
                        
                        if (uri === METADATA_URI) {
                            console.log("   ✅ URI matches config!");
                        } else {
                            console.log("   ⚠️  URI mismatch!");
                            console.log("      Expected:", METADATA_URI);
                            console.log("      Got:", uri);
                        }
                    } else if (flag === 1 && contentSlice.remainingRefs > 0) {
                        // On-chain metadata
                        const contentRef = contentSlice.loadRef();
                        const contentSlice2 = contentRef.beginParse();
                        try {
                            const contentString = contentSlice2.loadStringTail();
                            const metadata = JSON.parse(contentString);
                            console.log("   ✅ Metadata Type: On-chain (stored in contract)");
                            console.log("   ✅ Name:", metadata.name || "N/A");
                            console.log("   ✅ Symbol:", metadata.symbol || "N/A");
                            console.log("   ✅ Decimals:", metadata.decimals || "N/A");
                            console.log("   ✅ Image:", metadata.image || "N/A");
                            console.log("   💡 On-chain metadata doesn't depend on external URIs!");
                        } catch (e) {
                            console.log("   ✅ Metadata Type: On-chain (stored in contract)");
                            console.log("   ⚠️  Could not parse metadata JSON:", (e as Error).message);
                        }
                    } else {
                        console.log("   ⚠️  Metadata format is not standard");
                        console.log("      Flag:", flag);
                        console.log("      Refs:", contentSlice.remainingRefs);
                    }
                } catch (error: any) {
                    console.log("   ⚠️  Could not parse metadata:", error.message);
                }
            } else {
                console.log("   ❌ No metadata set!");
                console.log("   ⚠️  Configure message may not have been sent or processed.");
            }

            // Check wallet code
            if (jettonData.walletCode) {
                console.log("\n💼 Wallet Code:");
                console.log("   ✅ Wallet code is set");
            }

        } catch (error: any) {
            console.error("\n❌ Error reading contract data:", error.message);
            console.error("   Contract might not be fully initialized.");
            console.error("   Make sure Configure message was sent successfully.");
        }

        console.log("\n" + "=".repeat(60));
        console.log("✅ Status check completed!");
        console.log("=".repeat(60));

    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
        if (error.message.includes("Invalid address")) {
            console.error("   Please check MASTER_ADDRESS_TESTNET in config/testnet.ts");
        }
        throw error;
    }
}

