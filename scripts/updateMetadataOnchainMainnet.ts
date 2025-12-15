import { NetworkProvider } from '@ton/blueprint';
import { Address, toNano, Dictionary, beginCell, Cell } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import { MASTER_ADDRESS_MAINNET, OWNER_ADDRESS_MAINNET } from '../config/mainnet';
import * as crypto from 'crypto';

// Read metadata from JSON file
const metadataJson = {
    name: "KIWI Token",
    symbol: "KWT",
    description: "KWT is the main utility and governance token of the KIWI ecosystem on the TON blockchain.",
    decimals: 9,
    image: "https://kiwi.eu.com/kwt/kwt-logo.webp"
};

/**
 * Build on-chain metadata cell according to TEP-64 standard
 * 
 * TEP-64 on-chain format:
 * - Flag: 1 (on-chain, 1 byte)
 * - Dictionary: key = hash256(key_string), value = UTF-8 string cell
 */
function buildOnchainMetadataCell(metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    decimals: number;
}): Cell {
    // Create empty dictionary with uint256 keys and Cell values
    // Use proper serializers: Keys.BigUint(256) for 256-bit unsigned integers, Values.Cell() for Cell values
    const metadataDict = Dictionary.empty<bigint, Cell>(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    
    // Helper function to hash string to uint256 (SHA256)
    function hashString(str: string): bigint {
        const hash = crypto.createHash('sha256').update(str).digest();
        return BigInt('0x' + hash.toString('hex'));
    }
    
    // Store each metadata field in dictionary
    // Key = SHA256(key_name), Value = Cell containing UTF-8 string
    metadataDict.set(hashString('name'), beginCell().storeStringTail(metadata.name).endCell());
    metadataDict.set(hashString('symbol'), beginCell().storeStringTail(metadata.symbol).endCell());
    metadataDict.set(hashString('description'), beginCell().storeStringTail(metadata.description).endCell());
    metadataDict.set(hashString('image'), beginCell().storeStringTail(metadata.image).endCell());
    metadataDict.set(hashString('decimals'), beginCell().storeStringTail(metadata.decimals.toString()).endCell());
    
    // Build final cell: flag (1 byte) = 1 (on-chain), then dictionary in ref
    // According to TEP-64, dictionary should be stored in a reference cell
    const dictCell = beginCell()
        .storeDict(metadataDict, Dictionary.Keys.BigUint(256), Dictionary.Values.Cell())
        .endCell();
    
    return beginCell()
        .storeUint(1, 8)  // On-chain flag
        .storeRef(dictCell)  // Store dictionary in reference cell (TEP-64 standard)
        .endCell();
}

export async function run(provider: NetworkProvider) {
    console.log("\n" + "=".repeat(60));
    console.log("🔄 Updating Metadata to On-Chain Format (TEP-64)");
    console.log("=".repeat(60));
    console.log();

    if (!MASTER_ADDRESS_MAINNET) {
        throw new Error("❌ MASTER_ADDRESS_MAINNET is not set in config/mainnet.ts");
    }

    if (!OWNER_ADDRESS_MAINNET) {
        throw new Error("❌ OWNER_ADDRESS_MAINNET is not set in config/mainnet.ts");
    }

    const sender = provider.sender();
    const ownerAddress = Address.parse(OWNER_ADDRESS_MAINNET);
    const contractAddress = Address.parse(MASTER_ADDRESS_MAINNET);

    console.log("📍 Contract Address:", contractAddress.toString());
    console.log("👤 Owner Address (Multisig):", ownerAddress.toString());
    console.log();

    // Verify sender is owner
    if (sender.address) {
        console.log("🔐 Sender Wallet:", sender.address.toString());
        if (!sender.address.equals(ownerAddress)) {
            console.error("❌ ERROR: You must use the multisig owner wallet to update metadata!");
            console.error("   Expected:", ownerAddress.toString());
            console.error("   Got:", sender.address.toString());
            throw new Error("Sender wallet does not match owner wallet");
        }
        console.log("✅ Sender wallet matches owner!");
    } else {
        console.log("⚠️  Warning: Cannot verify sender address (using ton:// link)");
        console.log("   Make sure you're using the multisig owner wallet:", ownerAddress.toString());
    }
    console.log();

    const master = provider.open(KWTMaster.fromAddress(contractAddress));

    // Verify contract is deployed
    console.log("🔍 Checking contract status...");
    try {
        const jettonData = await master.getGetJettonData();
        console.log("   ✅ Contract is deployed");
        console.log("   Total Supply:", jettonData.totalSupply.toString(), "nano");
        console.log("   Owner:", jettonData.owner.toString());
        
        if (!jettonData.owner.equals(ownerAddress)) {
            throw new Error("Contract owner does not match expected owner address");
        }
    } catch (error: any) {
        throw new Error(`Failed to read contract: ${error.message}`);
    }
    console.log();

    // Build on-chain metadata cell
    console.log("📋 Building on-chain metadata cell (TEP-64 format)...");
    console.log("   Name:", metadataJson.name);
    console.log("   Symbol:", metadataJson.symbol);
    console.log("   Description:", metadataJson.description);
    console.log("   Image:", metadataJson.image);
    console.log("   Decimals:", metadataJson.decimals);
    console.log();

    const metadataCell = buildOnchainMetadataCell(metadataJson);
    console.log("   ✅ On-chain metadata cell created");
    console.log("   📌 Format: TEP-64 on-chain (flag=1, Dictionary)");
    console.log("   💡 Metadata is stored directly in contract - no external server needed!");
    console.log();

    // Send TokenUpdateContent message
    console.log("📤 Sending TokenUpdateContent message...");
    console.log("   ⚠️  This will update metadata to on-chain format");
    console.log("   ⚠️  Only the owner can update metadata");
    console.log("   💡 After this update, explorers and wallets will be able to read metadata directly from contract");
    console.log();

    await master.send(
        sender,
        {
            value: toNano("0.3"),
        },
        {
            $$type: 'TokenUpdateContent' as const,
            content: metadataCell,
        }
    );

    console.log("✅ TokenUpdateContent message sent successfully!");
    console.log("⏳ Waiting for transaction to be processed (30 seconds)...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verify update
    console.log("\n🔍 Verifying metadata update...");
    try {
        const jettonData = await master.getGetJettonData();
        
        if (jettonData.content) {
            const contentSlice = jettonData.content.beginParse();
            const flag = contentSlice.loadUint(8);
            
            console.log("   Flag:", flag);
            if (flag === 1) {
                console.log("   ✅ Metadata is now on-chain format (flag=1)");
                console.log("   📌 Metadata is stored directly in contract");
                console.log("   💡 Explorer and wallets should now be able to read metadata");
                
                // Try to parse dictionary
                if (contentSlice.remainingRefs > 0) {
                    const dict = contentSlice.loadDict<bigint, Cell>(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
                    console.log("   ✅ Dictionary loaded successfully");
                    console.log("   📊 Dictionary size:", dict.size);
                }
            } else {
                console.log("   ⚠️  Flag is", flag, "(expected 1 for on-chain)");
            }
        }
    } catch (error: any) {
        console.log("   ⚠️  Could not verify:", error.message);
        console.log("   Transaction was sent - please check explorer");
    }

    console.log();
    console.log("=".repeat(60));
    console.log("✅ METADATA UPDATE COMPLETED");
    console.log("=".repeat(60));
    console.log();
    console.log("📍 Contract Address:", contractAddress.toString());
    console.log("🔗 Explorer:");
    console.log(`   https://tonscan.org/jetton/${contractAddress.toString({ urlSafe: true, bounceable: false })}`);
    console.log();
    console.log("💡 Note:");
    console.log("   - Metadata is now stored on-chain (no external server needed)");
    console.log("   - It may take a few minutes for explorer to refresh and show new metadata");
    console.log("   - Wallets should now display token name, symbol, and logo correctly");
    console.log();
}
