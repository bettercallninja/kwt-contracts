import { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import { 
    MASTER_ADDRESS_TESTNET,
    OWNER_ADDRESS_TESTNET,
    METADATA_URI as METADATA_URI_TESTNET, 
    AIRDROP_WALLET_TESTNET, 
    TREASURY_WALLET_TESTNET, 
    TEAM_WALLET_TESTNET, 
    BURN_RESERVE_WALLET_TESTNET 
} from '../config/testnet';
import { 
    MASTER_ADDRESS_MAINNET,
    OWNER_ADDRESS_MAINNET,
    METADATA_URI as METADATA_URI_MAINNET, 
    AIRDROP_WALLET_MAINNET, 
    TREASURY_WALLET_MAINNET, 
    TEAM_WALLET_MAINNET, 
    BURN_RESERVE_WALLET_MAINNET 
} from '../config/mainnet';
import { buildOffchainMetadataCell } from './helpers/metadata';

export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const isMainnet = provider.network() === 'mainnet';

    // Select config based on network
    const MASTER_ADDRESS = isMainnet ? MASTER_ADDRESS_MAINNET : MASTER_ADDRESS_TESTNET;
    const OWNER_ADDRESS = isMainnet ? OWNER_ADDRESS_MAINNET : OWNER_ADDRESS_TESTNET;
    const METADATA_URI = isMainnet ? METADATA_URI_MAINNET : METADATA_URI_TESTNET;
    const AIRDROP_WALLET = isMainnet ? AIRDROP_WALLET_MAINNET : AIRDROP_WALLET_TESTNET;
    const TREASURY_WALLET = isMainnet ? TREASURY_WALLET_MAINNET : TREASURY_WALLET_TESTNET;
    const TEAM_WALLET = isMainnet ? TEAM_WALLET_MAINNET : TEAM_WALLET_TESTNET;
    const BURN_RESERVE_WALLET = isMainnet ? BURN_RESERVE_WALLET_MAINNET : BURN_RESERVE_WALLET_TESTNET;
    const networkName = isMainnet ? 'mainnet' : 'testnet';
    const explorerBase = isMainnet ? 'https://tonscan.org' : 'https://testnet.tonscan.org';
    const configPath = isMainnet ? './config/mainnet.ts' : './config/testnet.ts';

    console.log("⚙️  Sending Configure Message to KWTMaster...\n");
    console.log("=".repeat(60));
    console.log(`🌐 Network: ${networkName.toUpperCase()}`);
    console.log("=".repeat(60));
    console.log();

    // Validate config
    if (!MASTER_ADDRESS) {
        console.error(`❌ MASTER_ADDRESS_${networkName.toUpperCase()} is not set in ${configPath}`);
        console.error("   Please set the contract address first.");
        return;
    }

    if (!OWNER_ADDRESS) {
        console.error(`❌ OWNER_ADDRESS_${networkName.toUpperCase()} is not set in ${configPath}`);
        console.error("   Please set the owner address first.");
        return;
    }

    // Determine owner address
    let ownerAddress: Address;
    
    if (sender.address) {
        ownerAddress = sender.address;
        console.log("✅ Using sender address as owner:", ownerAddress.toString());
    } else {
        try {
            ownerAddress = Address.parse(OWNER_ADDRESS);
            console.log("✅ Using owner address from config:", ownerAddress.toString());
            console.log("⚠️  Note: Make sure you're signing with this wallet!");
        } catch (error) {
            throw new Error(`❌ Invalid OWNER_ADDRESS_${networkName.toUpperCase()} in ${configPath}: ${OWNER_ADDRESS}`);
        }
    }

    // Get actual owner from contract
    let contractOwner: Address;
    try {
        const contractAddress = Address.parse(MASTER_ADDRESS);
        const master = provider.open(KWTMaster.fromAddress(contractAddress));
        const jettonData = await master.getGetJettonData();
        contractOwner = jettonData.owner;
        
        console.log("📋 Contract Owner (from blockchain):", contractOwner.toString());
        console.log("👤 Your Wallet:", ownerAddress.toString());
        console.log();
        
        // Check if addresses match
        if (!ownerAddress.equals(contractOwner)) {
            console.log("❌ CRITICAL ERROR: Your wallet does NOT match the contract owner!");
            console.log("   Contract Owner:", contractOwner.toString());
            console.log("   Your Wallet:  ", ownerAddress.toString());
            console.log();
            console.log("⚠️  Configure will FAIL because only the contract owner can send Configure!");
            console.log();
            console.log("💡 Solution:");
            console.log("   1. Use the wallet that deployed the contract:", contractOwner.toString());
            console.log("   2. Or deploy a new contract with your wallet as owner");
            console.log();
            throw new Error("Wallet address does not match contract owner. Configure will fail!");
        } else {
            console.log("✅ Your wallet matches the contract owner!\n");
        }
    } catch (error: any) {
        if (error.message.includes("Wallet address does not match")) {
            throw error;
        }
        // If we can't read contract, continue with warning
        console.log("⚠️  Could not verify owner from contract, proceeding with warning...");
        const expectedOwner = Address.parse(OWNER_ADDRESS);
        if (!ownerAddress.equals(expectedOwner)) {
            console.log("⚠️  WARNING: Sender address does not match expected owner!");
            console.log("   Expected:", expectedOwner.toString());
            console.log("   Got:", ownerAddress.toString());
            console.log("   ⚠️  Configure will FAIL if you're not the owner!");
            console.log();
        } else {
            console.log("✅ Owner address matches config!\n");
        }
    }

    try {
        const contractAddress = Address.parse(MASTER_ADDRESS);
        const master = provider.open(KWTMaster.fromAddress(contractAddress));

        // Get non-bounceable address for ton:// links
        const contractAddressNonBounce = contractAddress.toString({ 
            urlSafe: true, 
            bounceable: false, 
            testOnly: !isMainnet 
        });
        
        console.log("📍 Contract Address:", contractAddress.toString());
        console.log("   Non-bounceable (for ton://):", contractAddressNonBounce);
        console.log("👤 Owner Address:", ownerAddress.toString());
        console.log();

        // Check if contract is deployed
        console.log("🔍 Checking contract deployment status...");
        let isDeployed = false;
        let deploymentMethod = "";
        
        // Method 1: Try isContractDeployed
        try {
            const deployed = await provider.isContractDeployed(contractAddress);
            if (deployed) {
                isDeployed = true;
                deploymentMethod = "isContractDeployed";
                console.log("✅ Contract is deployed (method: isContractDeployed)");
            } else {
                console.log("⚠️  isContractDeployed returned false - trying alternative method...");
            }
        } catch (error: any) {
            console.log("⚠️  Could not check deployment with isContractDeployed:", error.message);
            console.log("   Trying alternative method...");
        }

        // Method 2: Try to read contract state
        if (!isDeployed) {
            try {
                const jettonData = await master.getGetJettonData();
                isDeployed = true;
                deploymentMethod = "can read contract state";
                console.log("✅ Contract is deployed (method: can read contract state)");
            } catch (error: any) {
                const errorMsg = error.message || error.toString() || "";
                const errorCode = error.code || "";
                
                // Exit code -13 means contract is deployed but not initialized/configured
                if (errorMsg.includes("exit_code: -13") || 
                    errorMsg.includes("exit_code:-13") ||
                    errorMsg.includes("-13") ||
                    errorCode === -13 ||
                    errorMsg.includes("Invalid address: 0") || 
                    errorMsg.includes("address: 0") ||
                    errorMsg.includes("not initialized") ||
                    errorMsg.includes("uninitialized")) {
                    isDeployed = true;
                    deploymentMethod = "deployed but not configured (exit_code: -13)";
                    console.log("✅ Contract is deployed (method: exit_code -13 = deployed but not configured)");
                    console.log("   This is normal - contract needs Configure message.");
                    console.log("   Proceeding with Configure...");
                } else {
                    console.log("⚠️  Could not read contract state:", errorMsg);
                    console.log("   Error code:", errorCode);
                }
            }
        }

        if (!isDeployed) {
            console.error("\n❌ Contract appears to be NOT deployed!");
            console.error("   Please check:");
            console.error("   1. Did you complete the deployment process?");
            console.error("   2. Did you wait for transactions to be confirmed?");
            console.error("   3. Is the contract address correct?");
            console.error("\n🔗 Check on explorer:");
            console.error(`   ${explorerBase}/address/${contractAddress.toString({ urlSafe: true, bounceable: false })}`);
            console.error("\n💡 If contract is deployed in explorer:");
            console.error("   - Wait a few minutes for blockchain sync");
            console.error("   - Try again");
            console.error("   - Or proceed anyway if you're sure it's deployed");
            return;
        }
        
        console.log(`\n✅ Deployment confirmed via: ${deploymentMethod}\n`);

        // Check if already configured
        let isConfigured = false;
        try {
            const jettonData = await master.getGetJettonData();
            if (jettonData.content) {
                try {
                    const contentSlice = jettonData.content.beginParse();
                    const flag = contentSlice.loadUint(8);
                    if (flag === 0 && contentSlice.remainingRefs > 0) {
                        const uriRef = contentSlice.loadRef();
                        const uriSlice = uriRef.beginParse();
                        const uri = uriSlice.loadStringTail();
                        if (uri && uri.length > 0) {
                            isConfigured = true;
                            console.log("⚠️  WARNING: Contract appears to be already configured!");
                            console.log("   Configure message can only be sent once.");
                            console.log("   If you want to update metadata, use 'updateMetadata' script instead.");
                            console.log();
                            console.log("   Current metadata URI:", uri);
                            console.log();
                            console.log("   Do you want to proceed anyway? (This will fail if already configured)");
                            console.log("   Press Ctrl+C to cancel, or wait 5 seconds to proceed...");
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            console.log("   Proceeding anyway...\n");
                        }
                    }
                } catch (e) {
                    console.log("✅ Contract content exists but cannot be parsed - proceeding with Configure...\n");
                    isConfigured = false;
                }
            }
        } catch (error: any) {
            const errorMsg = error.message || error.toString() || "";
            if (errorMsg.includes("Invalid address: 0") || 
                errorMsg.includes("Index") || 
                errorMsg.includes("out of bounds")) {
                console.log("✅ Contract is not configured yet - proceeding with Configure...\n");
            } else {
                console.log("⚠️  Could not check current configuration:", errorMsg);
                console.log("   Proceeding with Configure message...\n");
            }
            isConfigured = false;
        }

        // Create metadata cell
        console.log("📋 Creating metadata cell (TEP-64 off-chain format)...");
        const metadataCell = buildOffchainMetadataCell(METADATA_URI);
        console.log("   ✅ Metadata cell created");
        console.log("   🔗 Metadata URI:", METADATA_URI);
        console.log("   📌 Format: Standard TEP-64 off-chain (flag=0, URI in ref)");
        console.log();

        // Validate wallet addresses
        console.log("🔍 Validating wallet addresses...");
        if (!AIRDROP_WALLET || !TREASURY_WALLET || !TEAM_WALLET || !BURN_RESERVE_WALLET) {
            throw new Error(`❌ Wallet addresses are not set in ${configPath}. Please set all wallet addresses first.`);
        }
        const airdropWallet = Address.parse(AIRDROP_WALLET);
        const treasuryWallet = Address.parse(TREASURY_WALLET);
        const teamWallet = Address.parse(TEAM_WALLET);
        const burnReserveWallet = Address.parse(BURN_RESERVE_WALLET);
        console.log("   ✅ Airdrop Wallet:", airdropWallet.toString());
        console.log("   ✅ Treasury Wallet:", treasuryWallet.toString());
        console.log("   ✅ Team Wallet:", teamWallet.toString());
        console.log("   ✅ Burn Reserve Wallet:", burnReserveWallet.toString());
        console.log();

        // Send Configure message
        console.log("📤 Preparing Configure message...");
        console.log("   ⚠️  CRITICAL: Only the multisig owner can send Configure!");
        console.log("   You MUST use the multisig wallet:", OWNER_ADDRESS);
        console.log("   Regular wallets cannot send Configure - only the multisig owner.");
        console.log("   💡 TIP: Use Mnemonic of one of the multisig signers if needed.\n");
        
        if (!sender.address) {
            console.log("🔗 Generating ton:// deep link...");
            console.log("   Please wait for the link to appear below...\n");
        }

        await master.send(
            sender,
            {
                value: toNano("0.3"),
                bounce: false,
            },
            {
                $$type: 'Configure' as const,
                content: metadataCell,
                airdrop_wallet: airdropWallet,
                treasury_wallet: treasuryWallet,
                team_wallet: teamWallet,
                burn_reserve_wallet: burnReserveWallet,
            }
        );

        console.log("✅ Configure message sent successfully!");
        console.log("\n⏳ Waiting for transaction to be processed (15 seconds)...");
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Verify Configure was successful
        console.log("\n🔍 Verifying configuration...");
        try {
            const jettonData = await master.getGetJettonData();
            
            // Verify owner
            if (jettonData.owner.equals(ownerAddress)) {
                console.log("✅ Owner verified:", jettonData.owner.toString());
            } else {
                console.log("⚠️  Owner mismatch!");
                console.log("   Expected:", ownerAddress.toString());
                console.log("   Got:", jettonData.owner.toString());
            }

            // Verify metadata
            if (jettonData.content) {
                const contentSlice = jettonData.content.beginParse();
                const flag = contentSlice.loadUint(8);
                if (flag === 0 && contentSlice.remainingRefs > 0) {
                    const uriRef = contentSlice.loadRef();
                    const uriSlice = uriRef.beginParse();
                    const uri = uriSlice.loadStringTail();
                    
                    if (uri === METADATA_URI) {
                        console.log("✅ Metadata URI verified:", uri);
                    } else {
                        console.log("⚠️  Metadata URI mismatch!");
                        console.log("   Expected:", METADATA_URI);
                        console.log("   Got:", uri);
                    }
                } else {
                    console.log("⚠️  Metadata format is not standard");
                }
            } else {
                console.log("❌ Metadata is not set!");
                console.log("   Configure may not have been processed yet.");
                console.log("   Please check the explorer and try again if needed.");
            }

            console.log("\n✅ Configure verification completed!");
            console.log("   Total Supply:", jettonData.totalSupply.toString(), "nano");
            console.log("   Mintable:", jettonData.mintable ? "Yes" : "No");

        } catch (error: any) {
            console.log("⚠️  Could not verify configuration:", error.message);
            console.log("   This might be normal if the transaction is still processing.");
            console.log("   Please check the explorer to confirm.");
        }

        // Summary
        console.log("\n" + "=".repeat(60));
        console.log("✅ CONFIGURE SUMMARY");
        console.log("=".repeat(60));
        console.log("📍 Contract Address:", contractAddress.toString());
        console.log("👤 Owner Address:", ownerAddress.toString());
        console.log("🔗 Metadata URI:", METADATA_URI);
        console.log("📊 Wallet Addresses:");
        console.log("   Airdrop:", airdropWallet.toString());
        console.log("   Treasury:", treasuryWallet.toString());
        console.log("   Team:", teamWallet.toString());
        console.log("   Burn Reserve:", burnReserveWallet.toString());
        console.log("=".repeat(60));
        console.log("\n🔗 Explorer:");
        console.log(`   ${explorerBase}/address/${contractAddress.toString({ urlSafe: true, bounceable: false })}`);
        console.log("\n✅ Configure process completed!");

    } catch (error: any) {
        console.error("\n❌ CONFIGURE FAILED!");
        console.error("Error:", error.message);
        console.error("\n💡 Possible reasons:");
        console.error("   1. You are not the contract owner");
        console.error("   2. Contract is already configured (Configure can only be sent once)");
        console.error(`   3. Insufficient ${isMainnet ? 'TON' : 'Test TON'} balance`);
        console.error("   4. Network connection issues");
        console.error("\n🔗 Check transaction on explorer:");
        console.error(`   ${explorerBase}/address/${MASTER_ADDRESS}`);
        throw error;
    }
}
